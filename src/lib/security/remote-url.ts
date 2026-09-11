import "server-only";
import dns from "node:dns/promises";
import net from "node:net";

const MAX_REDIRECTS = 3;

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase().split("%", 1)[0];
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;

  // IPv4-mapped IPv6, e.g. ::ffff:127.0.0.1
  const mapped = normalized.match(/::ffff:(?:0:)?(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return isPrivateIpv4(mapped[1]);

  return false;
}

function isPrivateIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return isPrivateIpv4(ip);
  if (version === 6) return isPrivateIpv6(ip);
  return true;
}

/**
 * Validate a remote URL before making a server-side request.
 * DNS is resolved explicitly so hostnames pointing at private/reserved
 * addresses are rejected instead of being fetched by the server.
 */
export async function assertSafeRemoteUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("URL invalide.");
  }

  if (!/^https?:$/.test(url.protocol)) throw new Error("Seules les URL HTTP/HTTPS sont autorisées.");
  if (url.username || url.password) throw new Error("URL avec identifiants interdite.");
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new Error("Port URL interdit.");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname === "metadata.google.internal" ||
    hostname === "instance-data.ec2.internal"
  ) {
    throw new Error("Hôte local/interne interdit.");
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("Adresse IP privée/interne interdite.");
    return url;
  }

  let records: { address: string }[];
  try {
    records = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("Impossible de résoudre l'hôte distant.");
  }
  if (!records.length || records.some((record) => isPrivateIp(record.address))) {
    throw new Error("L'hôte distant pointe vers une adresse privée/interne.");
  }

  return url;
}

async function readBodyWithLimit(response: Response, maxBytes: number): Promise<Buffer> {
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error(`Réponse distante trop volumineuse (${maxBytes} octets max).`);
  }

  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = Buffer.from(value);
      total += chunk.length;
      if (total > maxBytes) throw new Error(`Réponse distante trop volumineuse (${maxBytes} octets max).`);
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, total);
}

/**
 * Download a remote resource with bounded redirects and SSRF checks applied
 * to every redirect target. The body is streamed with a hard size cap.
 */
export async function fetchSafeRemoteBytes(
  rawUrl: string,
  options: { maxBytes: number; timeoutMs?: number; userAgent?: string },
): Promise<{ url: string; contentType: string; buffer: Buffer }> {
  let current = await assertSafeRemoteUrl(rawUrl);
  const timeoutMs = options.timeoutMs ?? 15_000;

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetch(current, {
      headers: options.userAgent ? { "User-Agent": options.userAgent } : undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (response.status >= 300 && response.status < 400) {
      if (redirect === MAX_REDIRECTS) throw new Error("Trop de redirections.");
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirection distante invalide.");
      current = await assertSafeRemoteUrl(new URL(location, current).toString());
      continue;
    }

    if (!response.ok) throw new Error(`Impossible de récupérer la ressource (${response.status}).`);

    const buffer = await readBodyWithLimit(response, options.maxBytes);
    return {
      url: current.toString(),
      contentType: (response.headers.get("content-type") || "application/octet-stream").split(";", 1)[0].toLowerCase(),
      buffer,
    };
  }

  throw new Error("Impossible de récupérer la ressource distante.");
}


/** Same redirect/SSRF policy for lightweight HEAD checks. */
export async function headSafeRemote(
  rawUrl: string,
  options: { timeoutMs?: number } = {}
): Promise<{ url: string; contentLength: number | null; contentType: string }> {
  let current = await assertSafeRemoteUrl(rawUrl);
  const timeoutMs = options.timeoutMs ?? 6_000;

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetch(current, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (response.status >= 300 && response.status < 400) {
      if (redirect === MAX_REDIRECTS) throw new Error("Trop de redirections.");
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirection distante invalide.");
      current = await assertSafeRemoteUrl(new URL(location, current).toString());
      continue;
    }

    return {
      url: current.toString(),
      contentLength: (() => {
        const n = Number(response.headers.get("content-length") || "");
        return Number.isFinite(n) && n >= 0 ? n : null;
      })(),
      contentType: (response.headers.get("content-type") || "").split(";", 1)[0].toLowerCase(),
    };
  }

  throw new Error("Impossible de vérifier la ressource distante.");
}
