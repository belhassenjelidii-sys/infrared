import "server-only";
import { revalidatePath } from "next/cache";

/**
 * A product can appear on: the homepage, /catalogue, /marques, /promotions,
 * /nouveautes, and its own /produit/[slug] page. Call this after ANY create,
 * update, delete, or image change so the public site never shows stale data
 * — this is the single place that list lives, so every action stays in sync.
 */
export function revalidateProductViews(slug?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/catalogue");
  revalidatePath("/marques");
  revalidatePath("/promotions");
  revalidatePath("/nouveautes");
  if (slug) revalidatePath(`/produit/${slug}`);
}
