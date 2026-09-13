import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-data";
import { getHoursForDay, getStoreLiveStatus, parseStoreHours, storeStatusLabel } from "@/lib/store-hours";
import Link from "next/link";
import { requirePagePermission } from "@/lib/authz";
import { can } from "@/lib/permissions";
import AdminShell from "@/components/AdminShell";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import ImageUploadField from "@/components/ImageUploadField";
import ManagedImage from "@/components/ManagedImage";
import { createStoreAction, updateStoreAction, deleteStoreAction, setStoreStatusOverrideAction } from "./actions";

export const dynamic = "force-dynamic";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;

const STORE_360: Record<string, string> = {
  "tunisia-mall": "https://www.google.com/maps/embed?pb=!4v1789063431965!6m8!1m7!1sCAoSFkNJSE0wb2dLRUlDQWdJQ0U0OS1oWmc.!2m2!1d36.84821944133287!2d10.27877983991743!3f331.59466865746475!4f-0.6865421402864342!5f0.7820865974627469",
  kram: "https://www.google.com/maps/embed?pb=!4v1789064630322!6m8!1m7!1sCAoSF0NJSE0wb2dLRUlDQWdJQ0U0OS1oZ2dF!2m2!1d36.83297262476452!2d10.31612871316821!3f100!4f0!5f0.7820865974627469",
};

function StoreMediaPreview({ store }: { store: { slug: string; name: string; photo: string | null } }) {
  const panorama = STORE_360[store.slug];
  const photo = store.photo || (store.slug === "el-aouina" ? "/images/stores/el-aouina.png" : null);
  if (!panorama && !photo) return null;
  return <div className="mt-4 overflow-hidden rounded-xl border border-line bg-mist">
    <div className="flex items-center justify-between border-b border-line bg-white px-4 py-2 text-xs"><strong>Aperçu actuel</strong><span className="text-stone">{panorama ? "Visite Google 360° interactive" : "Photo de couverture"}</span></div>
    <div className="relative aspect-[16/6] min-h-48 w-full">
      {panorama ? <iframe src={panorama} title={`Visite 360° ${store.name}`} className="absolute inset-0 h-full w-full border-0" loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/> : <ManagedImage src={photo!} alt={`Boutique ${store.name}`} fill quality={100} sizes="(max-width: 1024px) 100vw, 900px" className="object-cover"/>}
    </div>
  </div>;
}

function defaultHoursFor(day: string, globalHours: Array<{ day: string; hours: string }>) {
  return getHoursForDay(globalHours, day) || (day === "Dimanche" ? "Fermé" : "09:30 – 19:30");
}

export default async function AdminStoresPage() {
  const session = await requirePagePermission("stores.view");
  const canManageStores = can(session, "stores.manage");
  const [settings, stores] = await Promise.all([
    getSiteSettings(),
    prisma.store.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const storeViews = stores.map((store) => {
    const ownHours = parseStoreHours(store.hoursJson);
    const hours = ownHours.length ? ownHours : settings.hours;
    const statusOverride = store.statusOverride === "open" || store.statusOverride === "closed" ? store.statusOverride : "auto";
    const liveStatus = getStoreLiveStatus({ statusOverride, hours });
    return { ...store, hours, statusOverride, liveStatus, statusLabel: storeStatusLabel(liveStatus) };
  });

  return (
    <AdminShell active="/admin/boutiques" name={session?.name} email={session?.email} role={session?.role}>
      <p className="eyebrow text-red">Gestion</p>
      <h1 className="font-display mt-2 text-3xl">Nos boutiques</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone">
        {canManageStores ? "Modifiez chaque boutique, ses horaires et son statut." : "Consultez les informations de chaque boutique."} Les informations sont visibles sur la page publique <code>/boutique</code>.
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-white p-5">
        <p className="text-sm font-medium">Ouverture des boutiques</p>
        <p className="mt-1 text-xs text-stone">
          Par défaut, le statut Ouverte/Fermée est calculé automatiquement avec les horaires saisis ci-dessous. Vous pouvez aussi le forcer manuellement.
        </p>
      </div>

      <div className="mt-8 space-y-5">
        {storeViews.map((store) => (
          <div key={store.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg">{store.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2.5 py-1 font-semibold ${store.liveStatus === "open" ? "bg-emerald-50 text-emerald-700" : "bg-red-soft text-red"}`}>
                    {store.statusLabel}
                  </span>
                  <span className="text-stone">
                    {store.statusOverride === "auto" ? "Selon les horaires" : "Statut forcé manuellement"}
                  </span>
                </div>
              </div>
              {canManageStores && <form action={deleteStoreAction.bind(null, store.id)}>
                <ConfirmSubmitButton
                  confirmMessage={`Supprimer la boutique "${store.name}" ?`}
                  className="rounded-full border border-red/30 px-3 py-1 text-xs text-red hover:bg-red hover:text-white"
                >
                  Supprimer
                </ConfirmSubmitButton>
              </form>}
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-stone">
              <span>Page publique :</span>
              <Link href={`/boutique/${store.slug}`} target="_blank" className="font-mono text-red hover:underline">
                /boutique/{store.slug}
              </Link>
            </div>

            <StoreMediaPreview store={store} />

            {canManageStores && <div className="mt-4 flex flex-wrap gap-2 border-y border-line py-3">
              <form action={setStoreStatusOverrideAction.bind(null, store.id, "auto")}>
                <button className={`rounded-full border px-4 py-2 text-xs font-medium ${store.statusOverride === "auto" ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}>
                  Selon horaires
                </button>
              </form>
              <form action={setStoreStatusOverrideAction.bind(null, store.id, "open")}>
                <button className={`rounded-full border px-4 py-2 text-xs font-medium ${store.statusOverride === "open" ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}>
                  Ouverte
                </button>
              </form>
              <form action={setStoreStatusOverrideAction.bind(null, store.id, "closed")}>
                <button className={`rounded-full border px-4 py-2 text-xs font-medium ${store.statusOverride === "closed" ? "border-red bg-red text-white" : "border-red/20 text-red hover:bg-red-soft"}`}>
                  Fermée
                </button>
              </form>
            </div>}

            <form action={updateStoreAction.bind(null, store.id)} className="mt-4 grid gap-3 sm:grid-cols-2">
              <fieldset disabled={!canManageStores} className="contents">
              <div>
                <label className="text-xs font-medium">Nom</label>
                <input name="name" defaultValue={store.name} required className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Adresse de la page (slug)</label>
                <input name="slug" defaultValue={store.slug} placeholder="ex. kram" className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Adresse</label>
                <input name="address" defaultValue={store.address} required className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Mobile</label>
                <input name="mobile" defaultValue={store.mobile} required className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">E-mail de préparation (optionnel)</label>
                <input name="email" type="email" defaultValue={store.email ?? ""} placeholder="boutique@infrared.tn" className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Fixe (optionnel)</label>
                <input name="landline" defaultValue={store.landline ?? ""} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Lien Google Maps (itinéraire)</label>
                <input name="mapsUrl" defaultValue={store.mapsUrl ?? ""} placeholder="https://maps.google.com/…" className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium">Requête carte intégrée</label>
                <input name="mapsEmbedQuery" defaultValue={store.mapsEmbedQuery ?? ""} placeholder={store.address} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
              </div>

              <div className="sm:col-span-2 rounded-xl border border-line bg-mist/40 p-4">
                <p className="text-sm font-medium">Horaires de cette boutique</p>
                <p className="mt-1 text-xs text-stone">Exemples : <strong>09:30 – 19:30</strong>, <strong>09:00 – 13:00 / 14:00 – 18:00</strong> ou <strong>Fermé</strong>.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {DAYS.map((day) => (
                    <label key={day} className="text-xs font-medium">
                      {day}
                      <input
                        name={`hours_${day.toLowerCase()}`}
                        defaultValue={getHoursForDay(store.hours, day) || defaultHoursFor(day, settings.hours)}
                        className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <ImageUploadField
                  name="photo"
                  label="Photo de couverture de la boutique — cliquez sur « Retirer » pour l'enlever"
                  initialUrl={store.photo}
                  folder="stores"
                />
              </div>
              <div className="sm:col-span-2">
                <button className="rounded-full bg-red px-5 py-2.5 text-sm font-medium text-white hover:bg-red-dark">Enregistrer la boutique</button>
              </div>
              </fieldset>
            </form>
          </div>
        ))}
      </div>

      {canManageStores && <form action={createStoreAction} className="mt-8 grid gap-3 rounded-2xl border border-dashed border-line bg-white p-5 sm:grid-cols-2">
        <h3 className="font-display text-lg sm:col-span-2">+ Nouvelle boutique</h3>
        <input name="name" placeholder="Nom" required className="rounded-lg border border-line px-3 py-2 text-sm" />
        <input name="address" placeholder="Adresse" required className="rounded-lg border border-line px-3 py-2 text-sm" />
        <input name="mobile" placeholder="Mobile" required className="rounded-lg border border-line px-3 py-2 text-sm" />
        <input name="email" type="email" placeholder="E-mail de préparation (optionnel)" className="rounded-lg border border-line px-3 py-2 text-sm" />
        <input name="landline" placeholder="Fixe (optionnel)" className="rounded-lg border border-line px-3 py-2 text-sm" />
        <input name="mapsUrl" placeholder="Lien Google Maps (itinéraire)" className="rounded-lg border border-line px-3 py-2 text-sm sm:col-span-2" />
        <input name="mapsEmbedQuery" placeholder="Requête carte intégrée (optionnel)" className="rounded-lg border border-line px-3 py-2 text-sm sm:col-span-2" />

        <div className="sm:col-span-2 rounded-xl border border-line bg-mist/40 p-4">
          <p className="text-sm font-medium">Horaires</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {DAYS.map((day) => (
              <label key={day} className="text-xs font-medium">
                {day}
                <input
                  name={`hours_${day.toLowerCase()}`}
                  defaultValue={defaultHoursFor(day, settings.hours)}
                  className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <ImageUploadField name="photo" label="Photo de couverture (optionnel)" folder="stores" />
        </div>
        <button className="sm:col-span-2 rounded-full bg-red py-2.5 text-sm font-medium text-white hover:bg-red-dark">Ajouter</button>
      </form>}
    </AdminShell>
  );
}
