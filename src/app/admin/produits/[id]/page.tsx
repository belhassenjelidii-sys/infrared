import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import VariantForm from "@/components/VariantForm";
import FrameMeasurements from "@/components/FrameMeasurements";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/authz";
import { can } from "@/lib/permissions";
import { resolveCharacteristics } from "@/lib/catalogue-fields";
import { deleteVariantAction } from "../../catalogue-actions";

export default async function EditVariant({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ modelSearch?: string }> }) {
  const user = await requirePagePermission("products.view");
  const { id } = await params;
  const { modelSearch = "" } = await searchParams;
  const product = await prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } }, productModel: true } });
  if (!product) notFound();
  const models = await prisma.productModel.findMany({ where: { OR: [{ id: product.productModelId ?? "" }, { brandId: product.brandId, active: true, ...(modelSearch ? { code: { contains: modelSearch.slice(0, 80), mode: "insensitive" as const } } : {}) }] }, include: { brand: true }, orderBy: { code: "asc" }, take: 50 });
  if (product.productModelId && !models.some((model) => model.id === product.productModelId)) {
    const selected = await prisma.productModel.findUnique({ where: { id: product.productModelId }, include: { brand: true } });
    if (selected) models.unshift(selected);
  }
  const effective = resolveCharacteristics(product, product.productModel);
  const editable = ["products.edit", "content.manage", "seo.manage", "prices.edit", "stock.edit", "images.manage"].some((permission) => can(user, permission as Parameters<typeof can>[1]));
  return <AdminShell active="/admin/articles">
    <Link href="/admin/articles" className="text-sm text-stone">← Articles</Link>
    <div className="my-6 flex flex-wrap justify-between gap-4"><div><h1 className="text-2xl font-semibold">{product.name}</h1><p className="mt-2 text-sm text-stone">{product.reference} · {product.archived ? "Archivé" : product.published ? "Publié" : "Brouillon"}</p></div><div className="flex flex-wrap gap-2">{can(user, "products.create") && ([["duplicate","Dupliquer"],["color","Ajouter coloris"],["size","Ajouter taille"]] as const).map(([mode,label]) => <Link key={mode} className="h-fit rounded-lg border bg-white px-3 py-3 text-sm" href={`/admin/produits/nouveau?source=${id}&mode=${mode}`}>{label}</Link>)}{can(user, "products.delete") && <ConfirmDeleteDialog action={deleteVariantAction.bind(null, id)} itemLabel={`${product.name} · ${product.reference}`}/>}</div></div>
    {can(user, "products.edit") && <form className="mb-4 flex gap-3"><input name="modelSearch" defaultValue={modelSearch} placeholder="Rechercher un code modèle à rattacher" aria-label="Rechercher un modèle à rattacher" className="min-h-11 w-full max-w-sm rounded-lg border bg-white px-3 text-sm"/><button className="rounded-lg border bg-white px-4 text-sm">Chercher</button></form>}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]"><div>{editable ? <VariantForm key={product.updatedAt.toISOString()} product={product} models={models} user={user}/> : <div className="rounded-xl border bg-white p-6"><p>{product.description}</p><p className="mt-4 text-sm text-stone">Consultation uniquement.</p></div>}</div><aside className="grid gap-5"><section className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Caractéristiques utilisées</h2><dl className="mt-4 space-y-3 text-sm">{Object.entries({ Forme: effective.shape, Matière: effective.materialLabel, Genre: effective.gender, Monture: effective.frameType, Style: effective.style }).map(([label,value]) => <div key={label}><dt className="text-stone">{label}</dt><dd className="mt-1">{value ?? "Non renseigné"}</dd></div>)}</dl>{product.productModelId && can(user, "models.edit") && <Link href={`/admin/modeles/${product.productModelId}`} className="mt-5 inline-block text-sm text-red">Modifier le modèle</Link>}</section><FrameMeasurements {...product}/><section className="rounded-xl border bg-white p-5"><p className="text-sm text-stone">URL conservée</p><p className="mt-2 break-all text-sm">/produit/{product.slug}</p>{product.published && !product.archived && <Link href={`/produit/${product.slug}`} className="mt-4 inline-block text-sm text-red">Voir la fiche publique</Link>}</section></aside></div>
  </AdminShell>;
}

