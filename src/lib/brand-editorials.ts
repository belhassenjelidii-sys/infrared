export type BrandEditorial = {
  image: string;
  alt: string;
};

const brandEditorials: Record<string, BrandEditorial> = {
  carrera: {
    image: "/images/brand-editorials/carrera.jpg",
    alt: "Mannequin portant des lunettes Carrera",
  },
  "ray-ban": {
    image: "/images/brand-editorials/ray-ban.jpg",
    alt: "Mannequins portant des lunettes Ray-Ban",
  },
  vogue: {
    image: "/images/brand-editorials/vogue-eyewear.jpg",
    alt: "Mannequin portant des lunettes Vogue Eyewear",
  },
  polaroid: {
    image: "/images/brand-editorials/polaroid.jpg",
    alt: "Mannequin portant des lunettes de soleil",
  },
  "emporio-armani": {
    image: "/images/brand-editorials/emporio-armani.jpg",
    alt: "Mannequins de la collection lunettes Emporio Armani",
  },
  "miu-miu": {
    image: "/images/brand-editorials/miu-miu.jpg",
    alt: "Mannequin portant des lunettes de soleil",
  },
  prada: {
    image: "/images/brand-editorials/prada.jpg",
    alt: "Portrait éditorial avec lunettes de soleil",
  },
  gucci: {
    image: "/images/brand-editorials/gucci.jpg",
    alt: "Mannequin portant des lunettes Gucci",
  },
  "saint-laurent": {
    image: "/images/brand-editorials/saint-laurent.jpg",
    alt: "Mannequin portant des lunettes de soleil",
  },
  "oliver-peoples": {
    image: "/images/brand-editorials/oliver-peoples.jpg",
    alt: "Campagne lunettes Oliver Peoples",
  },
};

export function getBrandEditorial(slug: string): BrandEditorial | null {
  return brandEditorials[slug] ?? null;
}
