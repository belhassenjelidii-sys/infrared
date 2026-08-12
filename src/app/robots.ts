import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/commercial"] },
    ],
    sitemap: "https://infrared-optic-store.netlify.app/sitemap.xml",
  };
}
