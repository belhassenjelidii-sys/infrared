export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Real photo URL once available — null renders PlaceholderMedia. */
  image: string | null;
  active: boolean;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  /** Real brand logo URL once available — null renders a text badge. */
  logo: string | null;
  marqueeImage?: string | null;
  heroWomenImage?: string | null;
  heroMenImage?: string | null;
  heroWomenTitle?: string | null;
  heroMenTitle?: string | null;
  heroWomenText?: string | null;
  heroMenText?: string | null;
  active: boolean;
};

export type ProductImage = {
  id: string;
  /** Real photo URL once available — empty when isPlaceholder is true. */
  url: string;
  alt: string;
  sortOrder: number;
  isPlaceholder: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  reference: string;
  description: string;
  price: number;
  oldPrice: number | null;
  discount: number | null;
  categorySlug: string;
  categoryName: string;
  brandSlug: string;
  /** Denormalized brand name — avoids a client-side static-data lookup per card. */
  brandName: string;
  color: string;
  shape?: string | null;
  target: "Homme" | "Femme" | "Mixte" | "Enfant";
  available: boolean;
  featured: boolean;
  isNew: boolean;
  isPromotion: boolean;
  createdAt: string;
  images: ProductImage[];
};

/** Public product shape used when prices are disabled. Sensitive commercial
 * pricing fields are omitted entirely from the RSC/Client payload. */
export type PublicProduct = Omit<Product, "price" | "oldPrice" | "discount" | "isPromotion"> & {
  price?: never;
  oldPrice?: never;
  discount?: never;
  isPromotion?: never;
};

export type CatalogProduct = Product | PublicProduct;
