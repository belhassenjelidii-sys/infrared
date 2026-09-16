import Link from "next/link";
import ManagedImage from "@/components/ManagedImage";
import { getDbBrands } from "@/lib/catalogue-db";

type Brand = {
  name: string;
  slug: string;
  logo: string | null;
  photo: string | null;
  sprite?: { src: string; center: number; width: number };
};

const BRAND_SPRITES: Record<string, { src: string; center: number; width: number }> = {
  chanel: { src: "/images/brand-strips/visio-row-1.png", center: 48, width: 1848 },
  "miu-miu": { src: "/images/brand-strips/visio-row-1.png", center: 251, width: 1848 },
  celine: { src: "/images/brand-strips/visio-row-1.png", center: 452, width: 1848 },
  dior: { src: "/images/brand-strips/visio-row-1.png", center: 653, width: 1848 },
  "saint-laurent": { src: "/images/brand-strips/visio-row-1.png", center: 854, width: 1848 },
  loewe: { src: "/images/brand-strips/visio-row-1.png", center: 1054, width: 1848 },
  gucci: { src: "/images/brand-strips/visio-row-1.png", center: 1256, width: 1848 },
  prada: { src: "/images/brand-strips/visio-row-1.png", center: 1458, width: 1848 },
  cartier: { src: "/images/brand-strips/visio-row-1.png", center: 1657, width: 1848 },
  fendi: { src: "/images/brand-strips/visio-row-2.png", center: 65, width: 1848 },
  "tom-ford": { src: "/images/brand-strips/visio-row-2.png", center: 267, width: 1848 },
  "bottega-veneta": { src: "/images/brand-strips/visio-row-2.png", center: 469, width: 1848 },
  chloe: { src: "/images/brand-strips/visio-row-2.png", center: 670, width: 1848 },
  balenciaga: { src: "/images/brand-strips/visio-row-2.png", center: 870, width: 1848 },
  "ray-ban": { src: "/images/brand-strips/visio-row-2.png", center: 1075, width: 1848 },
  persol: { src: "/images/brand-strips/visio-row-2.png", center: 1275, width: 1848 },
  burberry: { src: "/images/brand-strips/visio-row-2.png", center: 1477, width: 1848 },
  oakley: { src: "/images/brand-strips/visio-row-2.png", center: 1678, width: 1848 },
  randolph: { src: "/images/brand-strips/visio-row-3.png", center: 700, width: 1770 },
  "maui-jim": { src: "/images/brand-strips/visio-row-3.png", center: 900, width: 1770 },
  "oliver-peoples": { src: "/images/brand-strips/visio-row-3.png", center: 1101, width: 1770 },
  moscot: { src: "/images/brand-strips/visio-row-3.png", center: 1303, width: 1770 },
  "barton-perreira": { src: "/images/brand-strips/visio-row-3.png", center: 1503, width: 1770 },
  "garrett-leight": { src: "/images/brand-strips/visio-row-3.png", center: 1703, width: 1770 },
};

function SpritePhoto({ sprite, name }: { sprite: { src: string; center: number; width: number }; name: string }) {
  const scale = 70 / 96;
  const position = ((sprite.center * scale - 35) / (sprite.width * scale - 70)) * 100;
  return <span role="img" aria-label={`Collection ${name}`} className="block h-full w-full bg-no-repeat" style={{ backgroundImage: `url(${sprite.src})`, backgroundSize: `${sprite.width * scale}px auto`, backgroundPosition: `${position}% -5px` }} />;
}

function BrandSet({ brands, ariaHidden = false }: { brands: Brand[]; ariaHidden?: boolean }) {
  return (
    <div className="brand-marquee-set flex shrink-0 items-start gap-12 pr-12 sm:gap-16 sm:pr-16" aria-hidden={ariaHidden}>
      {brands.map((b) => (
        <Link
          key={b.slug}
          href={`/marques/${b.slug}`}
          tabIndex={ariaHidden ? -1 : undefined}
          className="brand-marquee-item group/brand flex w-[92px] shrink-0 flex-col items-center text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red"
        >
          <span className="relative block h-[62px] w-[62px] overflow-hidden rounded-xl border border-black/10 bg-[#f1f1f1] p-1 transition-transform duration-300 group-hover/brand:-translate-y-1 sm:h-[70px] sm:w-[70px]">
            {b.photo ? <ManagedImage src={b.photo} alt={`Collection ${b.name}`} fill sizes="96px" quality={90} className="object-cover" /> : b.sprite ? <SpritePhoto sprite={b.sprite} name={b.name} /> : b.logo ? <ManagedImage src={b.logo} alt={`Logo ${b.name}`} fill sizes="96px" className="object-contain p-2" /> : <span className="grid h-full w-full place-items-center text-xs font-semibold text-black/50">{b.name.slice(0, 2).toUpperCase()}</span>}
          </span>
          <span className="mt-3 line-clamp-2 text-[9px] font-medium uppercase tracking-[0.04em] text-black">{b.name}</span>
        </Link>
      ))}
    </div>
  );
}

export default async function BrandMarquee({ speedSeconds = 22 }: { speedSeconds?: number }) {
  const dbBrands = await getDbBrands().catch(() => []);
  const brands: Brand[] = dbBrands.map((brand) => {
    return {
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      photo: brand.marqueeImage || null,
      sprite: BRAND_SPRITES[brand.slug],
    };
  });

  if (!brands.length) return null;

  return (
    <div className="brand-marquee overflow-hidden bg-white py-1" aria-label="Nos marques">
      <div className="brand-marquee-viewport overflow-hidden px-5">
        <div className="brand-marquee-track flex w-max items-start" role="presentation" style={{ animationDuration: `${Math.min(80, Math.max(6, speedSeconds))}s` }}>
          <BrandSet brands={brands} />
          <BrandSet brands={brands} ariaHidden />
        </div>
      </div>
      <p className="sr-only">Survolez la barre des marques pour mettre son défilement en pause.</p>
    </div>
  );
}
