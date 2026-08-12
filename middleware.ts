import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session-edge";

// Content pages (Boutiques, Paramètres) are open to COMMERCIAL too, since
// that role covers Marketing Digital & Commercial. The rest of /admin
// (Produits, Marques, Catégories, Promotions, Utilisateurs) is ADMIN /
// DEVELOPER only.
const CONTENT_PATHS = ["/admin/boutiques", "/admin/parametres"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isContentRoute = CONTENT_PATHS.some((p) => pathname.startsWith(p));
  const isAdminRoute = pathname.startsWith("/admin") && !isContentRoute;
  const isCommercialRoute = pathname.startsWith("/commercial");

  const deny = () => {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  };

  if (isAdminRoute && !(session?.role === "ADMIN" || session?.role === "DEVELOPER")) return deny();
  if (isContentRoute && !session) return deny();
  if (isCommercialRoute && !session) return deny();

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/commercial/:path*"],
};
