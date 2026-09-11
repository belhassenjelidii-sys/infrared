import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-data";
import { consumeRateLimit, requestFingerprint } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rate = await consumeRateLimit(`search:${requestFingerprint(request)}`, 60, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ results: [] }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSec), "Cache-Control": "no-store" } });
  }
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ results: [] });

  const settings = await getSiteSettings();

  const rows = await prisma.product.findMany({
    where: {
      archived: false,
      published: true,
      available: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { reference: { contains: q, mode: "insensitive" } },
        { brand: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }, { id: "asc" }],
    take: 6,
  });

  return NextResponse.json({
    results: rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      reference: p.reference,
      brandName: p.brand?.name ?? "",
      ...(settings.showPrices ? { price: Number(p.price) > 0 ? Number(p.price) : 0 } : {}),
      image: p.images[0]?.url ?? null,
    })),
  });
}
