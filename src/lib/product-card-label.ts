import type { CatalogProduct } from "@/types";

export function productCardLabel(product: Pick<CatalogProduct, "name" | "brandName" | "color" | "reference">) {
  const brand = product.brandName.trim();
  let name = product.name.trim();
  const color = product.color.trim();
  if (color && name.toLocaleLowerCase("fr").endsWith(` ${color.toLocaleLowerCase("fr")}`)) name = name.slice(0, -(color.length + 1)).trim();
  const hasBrand = brand && (name.toLocaleLowerCase("fr") === brand.toLocaleLowerCase("fr") || name.toLocaleLowerCase("fr").startsWith(`${brand.toLocaleLowerCase("fr")} `));
  const remainder = hasBrand ? name.slice(brand.length).trim() : name;
  const words = remainder.split(/\s+/).filter(Boolean);
  let modelStart = words.findIndex((word) => /\d/.test(word));
  // Model prefixes may be separate tokens: MU A54S, PR C12V, SL 557.
  if (modelStart > 0 && /^[A-Z]{1,3}$/.test(words[modelStart - 1])) modelStart -= 1;
  const collection = (modelStart < 0 ? words : words.slice(0, modelStart)).join(" ");
  const title = [brand, collection].filter(Boolean).join(" ") || name;
  // Imported IR-* values are internal inventory IDs. Use the actual model in
  // the product name instead; real supplier references remain authoritative.
  const reference = product.reference.trim();
  const model = reference && !reference.startsWith("IR-") ? reference : modelStart >= 0 ? words.slice(modelStart).join(" ") : "";
  return { title, model };
}
