import AdminShell from "@/components/AdminShell";
import ActionForm, { SubmitButton } from "@/components/ActionForm";
import { Field } from "@/components/AdminFields";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { requirePagePermission } from "@/lib/authz";
import { commerceSettings } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { deleteDeliveryCompanyAction, saveDeliveryCompanyAction, updateDeliveryOptionsAction } from "./actions";

export default async function DeliveryPage() {
  await requirePagePermission("settings.critical");
  const [settings, companies] = await Promise.all([
    prisma.storeSettings.findUnique({ where: { singletonKey: "main" }, select: { features: true } }),
    prisma.deliveryCompany.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
  ]);
  const commerce = commerceSettings(settings?.features);
  return <AdminShell active="/admin/livraison">
    <p className="eyebrow text-red">Expédition</p><h1 className="mt-2 text-3xl font-semibold">Livraison</h1>
    <p className="mt-2 text-sm text-stone">Configurez la remise, puis ajoutez les transporteurs qui pourront être affectés aux commandes.</p>

    <ActionForm action={updateDeliveryOptionsAction} refreshOnSuccess className="mt-6 grid gap-5">
      <section className="rounded-2xl border border-line bg-white p-6"><h2 className="font-display text-xl">Livraison et retrait</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2"><label className="flex min-h-14 items-center justify-between rounded-xl border border-line px-4"><span><strong className="block">Livraison à domicile</strong><small className="text-stone">Adresse du client</small></span><input type="checkbox" name="delivery" defaultChecked={commerce.delivery} className="h-5 w-5 accent-red"/></label><label className="flex min-h-14 items-center justify-between rounded-xl border border-line px-4"><span><strong className="block">Retrait en boutique</strong><small className="text-stone">Retrait gratuit InfraRed</small></span><input type="checkbox" name="storePickup" defaultChecked={commerce.storePickup} className="h-5 w-5 accent-red"/></label></div>
        <div className="mt-5 max-w-sm"><Field label="Prix de livraison (TND)" name="deliveryFee" type="number" min={0} max={1000} step="0.001" value={commerce.deliveryFee}/></div>
      </section><div><SubmitButton>Enregistrer la livraison</SubmitButton></div>
    </ActionForm>

    <section className="mt-8 rounded-2xl border border-line bg-white p-6"><h2 className="font-display text-xl">Ajouter une société de livraison</h2><p className="mt-2 text-sm text-stone">Chaque société pourra ensuite être sélectionnée dans la fiche d’une commande.</p>
      <ActionForm action={saveDeliveryCompanyAction.bind(null, null)} refreshOnSuccess className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Nom de la société" name="name" required maxLength={120}/><Field label="Téléphone" name="phone" maxLength={40}/><Field label="Site ou portail transporteur" name="website" type="url" maxLength={500}/><Field label="Compte / code client" name="accountCode" maxLength={120}/><div className="md:col-span-2"><SubmitButton>Ajouter le transporteur</SubmitButton></div></ActionForm>
    </section>

    <div className="mt-8 grid gap-4 xl:grid-cols-2">{companies.map(company=><section key={company.id} className="rounded-2xl border border-line bg-white p-5"><div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="font-semibold">{company.name}</h3><p className="text-xs text-stone">{company.active?"Disponible pour les commandes":"Désactivé"}</p></div><ConfirmDeleteDialog compact action={deleteDeliveryCompanyAction.bind(null,company.id)} itemLabel={company.name}/></div><ActionForm action={saveDeliveryCompanyAction.bind(null,company.id)} refreshOnSuccess className="grid gap-3 sm:grid-cols-2"><Field label="Nom" name="name" required value={company.name} maxLength={120}/><Field label="Téléphone" name="phone" value={company.phone} maxLength={40}/><Field label="Site" name="website" type="url" value={company.website} maxLength={500}/><Field label="Compte client" name="accountCode" value={company.accountCode} maxLength={120}/><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={company.active} className="h-4 w-4 accent-red"/>Transporteur actif</label><div className="sm:text-right"><SubmitButton>Enregistrer</SubmitButton></div></ActionForm></section>)}{companies.length===0&&<p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-stone xl:col-span-2">Aucun transporteur enregistré.</p>}</div>
  </AdminShell>;
}
