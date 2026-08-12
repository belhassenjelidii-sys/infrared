import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function BrandMarquee() {
  const brands = await prisma.brand.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  }).catch(() => []);

  const loop = [...brands, ...brands];

  if (!brands.length) return null;

  return (
    <div className="overflow-hidden border-y border-line bg-white py-6">
      <div className="flex w-max animate-marquee gap-16">
        {loop.map((b, i) => (
          <Link
            key={`${b.slug}-${i}`}
            href={`/catalogue?brand=${b.slug}`}
            className="font-display shrink-0 text-xl text-ink/35 transition-colors hover:text-red"
          >
            {b.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
