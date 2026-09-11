import { notFound } from "next/navigation";
import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import ImageUploadField from "@/components/ImageUploadField";
import { requirePagePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { updateBrandEditorialAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminBrandEditorialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePagePermission("brands.manage");
  const brand = await prisma.brand.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!brand) notFound();
  return <AdminShell active="/admin/marques" name={session.name} email={session.email} role={session.role}>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow text-red">Page de marque</p><h1 className="font-display mt-2 text-3xl">{brand.name}</h1><p className="mt-2 text-sm text-stone">{brand._count.products} produit(s) — personnalisez les deux grandes affiches Femme et Homme.</p></div><Link href="/admin/marques" className="text-sm text-stone hover:text-red">← Retour aux marques</Link></div>
    <form action={updateBrandEditorialAction.bind(null, brand.id)} className="mt-8 grid max-w-5xl gap-8 rounded-2xl border border-line bg-white p-6 sm:p-8">
      <section className="grid gap-5"><div><p className="eyebrow text-red">Identité & barre animée</p><h2 className="font-display mt-1 text-xl">Logo et photo carrée</h2><p className="mt-2 text-sm text-stone">La photo carrée apparaît dans la barre. Le logo reste indépendant et sert sur la page de la marque.</p></div><div className="grid gap-5 sm:grid-cols-2"><ImageUploadField name="logo" initialUrl={brand.logo} label="Logo officiel" folder="brands" compact /><ImageUploadField name="marqueeImage" initialUrl={brand.marqueeImage} label="Photo carrée de la barre" folder="brands" compact /></div></section>
      <section className="grid gap-5"><div><p className="eyebrow text-red">Femme</p><h2 className="font-display mt-1 text-xl">Grande affiche Femme</h2></div><ImageUploadField name="heroWomenImage" initialUrl={brand.heroWomenImage} label="Photo panoramique Femme" folder="brands" /><label className="grid gap-1 text-sm font-medium">Titre<input name="heroWomenTitle" defaultValue={brand.heroWomenTitle ?? `Lunettes ${brand.name} femme`} className="min-h-11 rounded-lg border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Description<textarea name="heroWomenText" defaultValue={brand.heroWomenText ?? `Découvrez la collection de lunettes ${brand.name} pour femme disponible chez InfraRed Optic-Store.`} rows={4} className="rounded-lg border border-line p-3" /></label></section>
      <section className="grid gap-5 border-t border-line pt-8"><div><p className="eyebrow text-red">Homme</p><h2 className="font-display mt-1 text-xl">Grande affiche Homme</h2></div><ImageUploadField name="heroMenImage" initialUrl={brand.heroMenImage} label="Photo panoramique Homme" folder="brands" /><label className="grid gap-1 text-sm font-medium">Titre<input name="heroMenTitle" defaultValue={brand.heroMenTitle ?? `Lunettes ${brand.name} homme`} className="min-h-11 rounded-lg border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Description<textarea name="heroMenText" defaultValue={brand.heroMenText ?? `Découvrez la collection de lunettes ${brand.name} pour homme disponible chez InfraRed Optic-Store.`} rows={4} className="rounded-lg border border-line p-3" /></label></section>
      <button className="min-h-12 rounded-full bg-red px-7 text-sm font-semibold text-white hover:bg-red-dark">Enregistrer la page de marque</button>
    </form>
  </AdminShell>;
}
