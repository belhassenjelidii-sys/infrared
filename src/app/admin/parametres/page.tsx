import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import ImageUploadField from "@/components/ImageUploadField";
import { updateSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getSession();
  const s = await prisma.storeSettings.findFirst();

  return (
    <AdminShell active="/admin/parametres" name={session?.name} email={session?.email} role={session?.role}>
      <p className="eyebrow text-red">Gestion</p>
      <h1 className="font-display mt-2 text-3xl">Accueil & paramètres</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone">
        Modifiez l&apos;affiche d&apos;accueil, les titres des catégories, la visibilité des prix et les coordonnées sans toucher au code.
      </p>

      <form action={updateSettingsAction} className="mt-8 grid max-w-4xl gap-5 rounded-2xl border border-line bg-white p-5 sm:p-7">
        <h2 className="font-display text-xl">Accueil</h2>

        <ImageUploadField name="heroImageUrl" label="Photo / affiche principale du Hero" initialUrl={s?.heroImageUrl} />

        <div>
          <label className="text-sm font-medium">Titre principal</label>
          <input name="heroTitle" defaultValue={s?.heroTitle ?? "Découvrez votre prochaine paire."} className="mt-1 min-h-11 w-full rounded-lg border border-line px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium">Sous-titre</label>
          <textarea name="heroSubtitle" defaultValue={s?.heroSubtitle ?? ""} rows={3} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Texte du bouton principal</label>
            <input name="heroCtaLabel" defaultValue={s?.heroCtaLabel ?? "Découvrir nos lunettes"} className="mt-1 min-h-11 w-full rounded-lg border border-line px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Couleur d&apos;accent</label>
            <input type="color" name="accentColor" defaultValue={s?.accentColor ?? "#E0122C"} className="mt-1 h-11 w-full rounded-lg border border-line" />
          </div>
        </div>

        <div className="border-t border-line pt-5">
          <h3 className="font-display text-lg">Titres des cartes d&apos;accueil</h3>
          <p className="mt-1 text-xs text-stone">Ces titres peuvent être changés sans renommer les catégories internes.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <input name="categoryTitleSolaires" defaultValue={s?.categoryTitleSolaires ?? "Lunettes solaires"} placeholder="Lunettes solaires" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
            <input name="categoryTitleOptiques" defaultValue={s?.categoryTitleOptiques ?? "Lunettes optiques"} placeholder="Lunettes optiques" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
            <input name="categoryTitleNouveautes" defaultValue={s?.categoryTitleNouveautes ?? "Nouveautés"} placeholder="Nouveautés" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
          </div>
        </div>

        <label className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-line bg-mist px-4">
          <span>
            <span className="block text-sm font-medium">Afficher les prix sur le site</span>
            <span className="block text-xs text-stone">Désactivez pour cacher les prix sur les pages publiques.</span>
          </span>
          <input type="checkbox" name="showPrices" defaultChecked={s?.showPrices ?? true} className="h-5 w-5 accent-red" />
        </label>

        <div className="border-t border-line pt-5">
          <h3 className="font-display text-lg">Coordonnées</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input name="phone" defaultValue={s?.phone ?? ""} placeholder="Téléphone principal" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
            <input name="whatsapp" defaultValue={s?.whatsapp ?? ""} placeholder="WhatsApp : 216XXXXXXXX" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
            <input name="instagram" defaultValue={s?.instagram ?? ""} placeholder="Instagram URL" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
            <input name="facebook" defaultValue={s?.facebook ?? ""} placeholder="Facebook URL" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
            <input name="address" defaultValue={s?.address ?? ""} placeholder="Adresse principale" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm sm:col-span-2" />
            <input name="mapsUrl" defaultValue={s?.mapsUrl ?? ""} placeholder="Lien Google Maps" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm sm:col-span-2" />
            <input name="logoUrl" defaultValue={s?.logoUrl ?? ""} placeholder="Logo URL optionnelle" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm sm:col-span-2" />
          </div>
        </div>

        <button className="min-h-12 rounded-full bg-red px-6 text-sm font-medium text-white hover:bg-red-dark">Enregistrer les modifications</button>
      </form>
    </AdminShell>
  );
}
