import "server-only";
import dns from "node:dns/promises";
import type { LookupAddress, LookupAllOptions } from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import type { IncomingHttpHeaders } from "node:http";

const MAX_REDIRECTS = 3;
type Lookup = (hostname: string, options: LookupAllOptions) => Promise<LookupAddress[]>;
type Destination = { url: URL; addresses: string[] };

function privateV4(ip: string) { const p=ip.split(".").map(Number); if(p.length!==4||p.some(n=>!Number.isInteger(n)||n<0||n>255)) return true; const[a,b]=p; return a===0||a===10||a===127||(a===100&&b>=64&&b<=127)||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===0)||(a===192&&b===168)||(a===198&&(b===18||b===19))||a>=224; }
function privateV6(ip: string) {
  const v=ip.toLowerCase().split("%",1)[0];
  if(v==="::"||v==="::1"||v.startsWith("fc")||v.startsWith("fd")||/^fe[89ab]/.test(v)||v.startsWith("fec")||v.startsWith("fed")||v.startsWith("fee")||v.startsWith("fef")||v.startsWith("ff")) return true;
  const mapped=v.match(/^::ffff:(.+)$/i); if(!mapped) return false;
  if(mapped[1].includes(".")) return privateV4(mapped[1]);
  const parts=mapped[1].split(":"); if(parts.length!==2||parts.some(part=>!/^[0-9a-f]{1,4}$/i.test(part))) return true;
  const high=Number.parseInt(parts[0],16),low=Number.parseInt(parts[1],16);
  return privateV4(`${high>>8}.${high&255}.${low>>8}.${low&255}`);
}
export function isForbiddenRemoteIp(ip: string) { const version=net.isIP(ip); return version===4?privateV4(ip):version===6?privateV6(ip):true; }

async function resolveDestination(rawUrl: string, lookup: Lookup = dns.lookup): Promise<Destination> {
  let url: URL; try { url=new URL(rawUrl); } catch { throw new Error("URL invalide."); }
  if (!/^https?:$/.test(url.protocol)) throw new Error("Seules les URL HTTP/HTTPS sont autorisées.");
  if (url.username||url.password) throw new Error("URL avec identifiants interdite.");
  if (url.port&&url.port!=="80"&&url.port!=="443") throw new Error("Port URL interdit.");
  const hostname=url.hostname.replace(/^\[|\]$/g,"").toLowerCase();
  if (hostname==="localhost"||hostname.endsWith(".localhost")||hostname.endsWith(".local")||hostname==="metadata.google.internal"||hostname==="instance-data.ec2.internal") throw new Error("Hôte local/interne interdit.");
  const addresses=net.isIP(hostname)?[hostname]:(await lookup(hostname,{all:true,verbatim:true})).map(record=>record.address);
  if(!addresses.length||addresses.some(isForbiddenRemoteIp)) throw new Error("L'hôte distant pointe vers une adresse privée/interne.");
  return {url,addresses};
}

/** Public validation retained for callers which only need to inspect a URL. */
export async function assertSafeRemoteUrl(rawUrl: string): Promise<URL> { return (await resolveDestination(rawUrl)).url; }

/**
 * Returns a Node lookup callback that is incapable of querying DNS. The HTTP
 * socket is therefore connected only to an address resolved and validated
 * immediately before this request.
 */
export function pinnedLookup(addresses: string[]) {
  const records=addresses.map(address=>({address,family:net.isIP(address)})); if(!records.length||records.some(record=>!record.family)) throw new Error("Aucune adresse distante validée.");
  return (_hostname: string, options: unknown, callback: (...args: unknown[]) => void) => {
    if(typeof options==="object"&&options!==null&&(options as {all?:boolean}).all===true) callback(null,records);
    else callback(null,records[0].address,records[0].family);
  };
}

async function pinnedRequest(destination: Destination, method: "GET"|"HEAD", timeoutMs: number, headers?: Record<string,string>): Promise<{status:number;headers:IncomingHttpHeaders;body:NodeJS.ReadableStream}> {
  const client=destination.url.protocol==="https:"?https:http;
  return new Promise((resolve,reject)=>{
    const request=client.request(destination.url,{method,headers,lookup:pinnedLookup(destination.addresses) as never,servername:destination.url.hostname,agent:false},response=>resolve({status:response.statusCode??0,headers:response.headers,body:response}));
    request.setTimeout(timeoutMs,()=>request.destroy(new Error("Délai de récupération dépassé.")));
    request.once("error",reject); request.end();
  });
}

async function bodyWithLimit(body: NodeJS.ReadableStream, contentLength: unknown, maxBytes: number) {
  const declared=Number(contentLength??0); if(Number.isFinite(declared)&&declared>maxBytes) throw new Error(`Réponse distante trop volumineuse (${maxBytes} octets max).`);
  const chunks:Buffer[]=[]; let total=0; for await(const piece of body){const chunk=Buffer.from(piece); total+=chunk.length; if(total>maxBytes){(body as { destroy?: () => void }).destroy?.();throw new Error(`Réponse distante trop volumineuse (${maxBytes} octets max).`);}chunks.push(chunk);} return Buffer.concat(chunks,total);
}
function contentType(headers: IncomingHttpHeaders) { const value=headers["content-type"]; return (Array.isArray(value)?value[0]:value||"application/octet-stream").split(";",1)[0].toLowerCase(); }
function location(headers: IncomingHttpHeaders) { const value=headers.location; return Array.isArray(value)?value[0]:value; }
function redirect(status:number) { return status>=300&&status<400; }

async function follow(rawUrl:string, method:"GET"|"HEAD", options:{timeoutMs:number;headers?:Record<string,string>;maxBytes?:number;lookup?:Lookup}) {
  let current=rawUrl;
  for(let count=0;count<=MAX_REDIRECTS;count+=1){
    const destination=await resolveDestination(current,options.lookup);
    const response=await pinnedRequest(destination,method,options.timeoutMs,options.headers);
    if(redirect(response.status)){ response.body.resume(); if(count===MAX_REDIRECTS) throw new Error("Trop de redirections."); const next=location(response.headers); if(!next) throw new Error("Redirection distante invalide."); current=new URL(next,destination.url).toString(); continue; }
    return {destination,response};
  }
  throw new Error("Impossible de récupérer la ressource distante.");
}

/** Downloads bytes through a socket pinned to the validated destination IP. */
export async function fetchSafeRemoteBytes(rawUrl:string, options:{maxBytes:number;timeoutMs?:number;userAgent?:string}) {
  const result=await follow(rawUrl,"GET",{timeoutMs:options.timeoutMs??15_000,headers:options.userAgent?{"User-Agent":options.userAgent}:undefined,maxBytes:options.maxBytes});
  if(result.response.status<200||result.response.status>=300){result.response.body.resume();throw new Error(`Impossible de récupérer la ressource (${result.response.status}).`);}
  return {url:result.destination.url.toString(),contentType:contentType(result.response.headers),buffer:await bodyWithLimit(result.response.body,result.response.headers["content-length"],options.maxBytes)};
}

/** Same pinned DNS and redirect policy for lightweight HEAD checks. */
export async function headSafeRemote(rawUrl:string, options:{timeoutMs?:number}={}) {
  const result=await follow(rawUrl,"HEAD",{timeoutMs:options.timeoutMs??6_000}); result.response.body.resume(); const value=Number(result.response.headers["content-length"]??"");
  return {url:result.destination.url.toString(),contentLength:Number.isFinite(value)&&value>=0?value:null,contentType:contentType(result.response.headers)};
}

export const __remoteUrlTest = { resolveDestination, pinnedLookup };
