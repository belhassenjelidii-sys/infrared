import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import ActionForm, { SubmitButton } from "@/components/ActionForm";
import { requirePagePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { seoSettings } from "@/lib/features";
import { updateSeoAction } from "./actions";

export default async function SeoPage() {
  await requirePagePermission("seo.manage");
  const row = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" }, select: { features: true } });
  const seo = seoSettings(row?.features);
  return <AdminShell active="/admin/seo"><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold">SEO</h1><p className="mt-2 text-sm text-stone">Référencement général du site et indexation des pages publiques.</p></div><Link href="/sitemap.xml" target="_blank" className="rounded-lg border px-4 py-2 text-sm">Voir le sitemap</Link></div><section className="mt-6 max-w-3xl rounded-xl border bg-white p-6"><ActionForm action={updateSeoAction} className="grid gap-5"><label className="grid gap-2 text-sm font-medium">Titre général<input name="seoTitle" required minLength={10} maxLength={120} defaultValue={seo.title} className="min-h-11 rounded-lg border border-line px-3 font-normal"/></label><label className="grid gap-2 text-sm font-medium">Description générale<textarea name="seoDescription" required minLength={40} maxLength={320} defaultValue={seo.description} rows={5} className="rounded-lg border border-line p-3 font-normal"/></label><label className="flex min-h-11 items-center justify-between rounded-lg border border-line px-3 text-sm"><span>Autoriser l’indexation par les moteurs de recherche</span><input name="seoIndexing" type="checkbox" defaultChecked={seo.indexing} className="h-5 w-5 accent-red"/></label><div><SubmitButton>Enregistrer le SEO</SubmitButton></div></ActionForm></section></AdminShell>;
}
