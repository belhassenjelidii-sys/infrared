import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session-edge";
export async function middleware(req: NextRequest) {
  const token=req.cookies.get(COOKIE_NAME)?.value;
  const session=token?await verifySessionToken(token):null;
  if(!session){const url=req.nextUrl.clone();url.pathname="/login";url.searchParams.set("from",req.nextUrl.pathname);return NextResponse.redirect(url);}
  // Fine-grained authorization uses current database permissions in every page/action.
  const headers=new Headers(req.headers);headers.set("x-infrared-admin","1");
  return NextResponse.next({request:{headers}});
}
export const config={matcher:["/admin/:path*","/commercial/:path*"]};
