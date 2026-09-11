import type { NextConfig } from "next";

const supabaseHostname = (() => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return undefined;
  try { return new URL(raw).hostname; } catch { return undefined; }
})();

const isProduction = process.env.NODE_ENV === "production";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${supabaseHostname ? ` https://${supabaseHostname}` : ""}`,
  "frame-src 'self' https://www.google.com https://maps.google.com",
  "media-src 'self' blob: https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  isProduction ? "upgrade-insecure-requests" : "",
].filter(Boolean).join("; ");

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Enables `.next/standalone` — required by the Dockerfile (multi-stage
  // production build copies `.next/standalone` + `.next/static`).
  output: "standalone",
  // `sharp` is a native addon (used by the local Product Intelligence
  // Engine for pixel-level color/shape analysis) — it must run as a real
  // Node module, not be bundled by webpack/Turbopack.
  serverExternalPackages: ["sharp"],
  images: {
    qualities: [75, 90, 100],
    remotePatterns: [
      ...(supabaseHostname ? [{ protocol: "https" as const, hostname: supabaseHostname }] : []),
      // Verified catalogue imagery used by the seed catalogue. Keep this list
      // explicit: never fall back to a wildcard remote image host.
      { protocol: "https", hostname: "img.ebdcdn.com" },
      { protocol: "https", hostname: "vogue-eyewear.com" },
      { protocol: "https", hostname: "d237xocrarx9cy.cloudfront.net" },
      { protocol: "https", hostname: "assets.kogan.com" },
      { protocol: "https", hostname: "i.ebayimg.com" },
      { protocol: "https", hostname: "www.shadestation.co.uk" },
      { protocol: "https", hostname: "static5.lenskart.com" },
      { protocol: "https", hostname: "grandvision-media.imgix.net" },
      { protocol: "https", hostname: "assets2.oliverpeoples.com" },
    ],
    // Local /uploads/ folder (legacy/dev storage) is served natively.
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          ...(isProduction
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
