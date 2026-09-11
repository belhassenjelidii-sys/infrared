import type { Prisma } from "@prisma/client";
import Image from "next/image";
import { Ruler, ShieldCheck } from "lucide-react";

type DetailedProduct = Prisma.ProductGetPayload<{ include: { brand: true; productModel: true; images: true } }>;
type Row = [string, string];

function yesNo(value: boolean | null) {
  return value == null ? null : value ? "Oui" : "Non";
}

function row(label: string, value: string | null | undefined): Row | null {
  return value?.trim() ? [label, value] : null;
}

function protectionText(index: number | null) {
  if (index === 0) return "Verres très clairs : confort visuel, sans protection solaire significative.";
  if (index === 1) return "Protection adaptée à une luminosité faible et à un ciel couvert.";
  if (index === 2) return "Protection adaptée à un ensoleillement moyen, au printemps ou en automne.";
  if (index === 3) return "Protection solaire élevée, adaptée à la ville, à la plage et aux fortes luminosités. Cette catégorie convient à la conduite.";
  if (index === 4) return "Protection très élevée réservée aux luminosités extrêmes. Cette catégorie ne convient pas à la conduite.";
  return null;
}

function DataTable({ rows }: { rows: Row[] }) {
  return <dl className="divide-y divide-black/10 border-y border-black/10">{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[minmax(0,1fr)_minmax(130px,1fr)] gap-5 px-4 py-3 text-sm even:bg-[#fafafa] sm:px-5"><dt className="text-black/55">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>)}</dl>;
}

function FrameSizeFigures({ product }: { product: DetailedProduct }) {
  const measurements = [
    { image: "/images/guide/glasses.png", alt: "Mesure de la largeur du verre", label: "Largeur du verre", value: product.lensWidth },
    { image: "/images/guide/bridge.png", alt: "Mesure du pont", label: "Pont", value: product.bridgeWidth },
    { image: "/images/guide/temple_s.png", alt: "Mesure de la branche", label: "Branche", value: product.templeLength },
  ].filter((measurement) => measurement.value != null);
  const additional = [
    row("Hauteur du verre", product.lensHeight == null ? null : `${product.lensHeight} mm`),
    row("Largeur totale", product.totalWidth == null ? null : `${product.totalWidth} mm`),
  ].filter((item): item is Row => item !== null);

  if (!measurements.length && !additional.length) return null;

  return <div className="border border-black/10 bg-white p-5 sm:p-7">
    {measurements.length > 0 && <div className="grid gap-4 sm:grid-cols-3">{measurements.map((measurement) => <figure key={measurement.label} className="border border-black/10 bg-[#fafafa] p-4 text-center"><div className="relative mx-auto aspect-square w-full max-w-36"><Image src={measurement.image} alt={measurement.alt} fill quality={100} sizes="144px" className="object-contain"/></div><figcaption className="mt-3 text-xs uppercase tracking-[.12em] text-black/45">{measurement.label}</figcaption><strong className="mt-1 block text-base">{measurement.value} mm</strong></figure>)}</div>}
    {additional.length > 0 && <dl className={`${measurements.length ? "mt-5 border-t pt-5" : ""} grid gap-3 text-sm sm:grid-cols-2`}>{additional.map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-black/45">{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl>}
  </div>;
}

export default function ProductTechnicalDetails({ product }: { product: DetailedProduct }) {
  const model = product.productModel;
  const technical = [
    row("Marque", product.brand.name),
    row("Collection", model?.collection),
    row("Référence", product.reference),
    row("Forme", product.shapeOverride ?? model?.shape ?? product.shape),
    row("Type de monture", product.frameTypeOverride ?? model?.frameType),
    row("Matière fabricant", product.materialOverride ?? model?.materialLabel),
    row("Couleur de la monture", product.frameColorFamily ?? product.color),
    row("Coloris marque monture", product.frameColorLabel && product.frameColorLabel !== (product.frameColorFamily ?? product.color) ? product.frameColorLabel : null),
    row("Poids", product.weight == null ? null : `${Number(product.weight)} g`),
    row("EAN-13", product.ean),
  ].filter((item): item is Row => item !== null);
  const lenses = [
    row("Couleur des verres", product.lensColorFamily),
    row("Indice de protection", product.solarIndex == null ? null : product.solarIndex.toString()),
    row("Verres polarisés", yesNo(product.polarized)),
    row("Verres dégradés", yesNo(product.gradient)),
    row("Verres photochromiques", yesNo(product.photochromic)),
    row("Verres miroirs", yesNo(product.mirrored)),
    row("Adaptable à la vue", yesNo(product.prescriptionCompatible)),
    row("Coloris marque verres", product.lensColorLabel && product.lensColorLabel !== product.lensColorFamily ? product.lensColorLabel : null),
  ].filter((item): item is Row => item !== null);
  const protection = protectionText(product.solarIndex);
  const hasDimensions = [product.lensWidth, product.bridgeWidth, product.templeLength, product.lensHeight, product.totalWidth].some((value) => value != null);
  const description = product.description || model?.description || null;
  const hasSpecifications = technical.length > 0 || lenses.length > 0 || protection;

  if (!hasSpecifications && !hasDimensions && !description) return null;

  return <section className="mt-20 border-t border-black/15 pt-12" aria-labelledby="technical-characteristics">
    {hasSpecifications && <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-red">Détails du modèle</p><h2 id="technical-characteristics" className="mt-2 text-2xl font-medium sm:text-3xl">Caractéristiques techniques</h2></div><p className="text-sm text-black/45">Informations renseignées pour cette monture</p></div>
      <div className={`grid overflow-hidden border border-black/10 ${technical.length && lenses.length ? "lg:grid-cols-2" : ""}`}>
        {technical.length > 0 && <div><h3 className="border-b border-black/10 bg-black px-5 py-4 text-sm font-semibold uppercase tracking-[.12em] text-white">La monture</h3><DataTable rows={technical}/></div>}
        {(lenses.length > 0 || protection) && <div className={technical.length ? "border-t border-black/10 lg:border-l lg:border-t-0" : ""}><h3 className="border-b border-black/10 bg-[#f2f2f2] px-5 py-4 text-sm font-semibold uppercase tracking-[.12em]">Caractéristiques des verres</h3>{lenses.length > 0 && <DataTable rows={lenses}/>} {protection && <div className="m-5 flex gap-3 border-l-2 border-red bg-red-soft/50 p-4 text-sm leading-6 text-black/65"><ShieldCheck className="mt-0.5 shrink-0 text-red" size={20}/><p>{protection}</p></div>}</div>}
      </div>
    </>}

    {(hasDimensions || description) && <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:items-stretch">
      {hasDimensions && <div><div className="mb-4 flex items-center gap-2"><Ruler size={20} className="text-red"/><h2 className="text-xl font-semibold">Taille et dimensions</h2></div><FrameSizeFigures product={product}/></div>}
      {description && <article className="bg-[#f5f5f5] p-7 sm:p-10 lg:mt-9"><p className="text-xs font-semibold uppercase tracking-[.18em] text-red">À propos de cette monture</p><h2 className="mt-3 text-2xl font-medium">Description de {product.brand.name} {model?.code ?? product.reference}</h2><p className="mt-6 text-sm leading-7 text-black/65">{description}</p><h3 className="mt-8 text-lg font-semibold">Des lunettes de marque authentiques</h3><p className="mt-3 text-sm leading-7 text-black/65">Cette monture est un produit original livré avec les accessoires fournis par la marque. Nos opticiens peuvent vous conseiller sur la taille, l’ajustement et les verres adaptés.</p></article>}
    </div>}
  </section>;
}
