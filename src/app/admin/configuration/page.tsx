import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import ActionForm, { SubmitButton } from "@/components/ActionForm";
import { Field } from "@/components/AdminFields";
import { requirePagePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { updateCommerceSettingsAction, updateLowStockThresholdAction } from "./actions";
import { commerceSettings } from "@/lib/features";

const toggleClass = "flex min-h-12 items-center justify-between rounded-xl border border-line bg-white px-4 text-sm";

export default async function Configuration() {
  const user = await requirePagePermission("settings.manage");
  const settings = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" }, select: { lowStockThreshold: true, features: true } });
  const commerce = commerceSettings(settings?.features);
  const canConfigureCommerce = user.role === "SUPER_ADMIN" || user.role === "DEVELOPER";
  const toggle = (name: keyof typeof commerce, label: string, description: string) => <label className={toggleClass}><span><strong className="block font-medium text-ink">{label}</strong><span className="mt-0.5 block text-xs text-stone">{description}</span></span><input type="checkbox" name={name} defaultChecked={commerce[name] === true} className="h-5 w-5 accent-red" /></label>;

  return <AdminShell active="/admin/configuration">
    <p className="eyebrow text-red">Réglages</p><h1 className="mt-2 text-3xl font-semibold">Catalogue & e-commerce</h1>
    <nav className="mt-6 flex flex-wrap gap-2" aria-label="Sections de configuration">{[["#catalogue","Catalogue"],["#ecommerce","Vente en ligne"],["/admin/livraison","Livraison"],["/admin/paiements","Paiement TND"]].map(([href,label])=><Link key={href} href={href} className="rounded-full border border-line bg-white px-4 py-2 text-sm hover:border-red hover:text-red">{label}</Link>)}</nav>

    <section id="catalogue" className="mt-6 scroll-mt-28 rounded-2xl border border-line bg-white p-6 target:ring-2 target:ring-red/40">
      <h2 className="font-display text-xl">Catalogue</h2><dl className="mt-5 grid gap-4 text-sm md:grid-cols-3"><div><dt className="text-stone">Types de produits</dt><dd className="mt-1">Lunettes solaires · Lunettes optiques</dd></div><div><dt className="text-stone">Devise</dt><dd className="mt-1">Dinar tunisien (TND), trois décimales</dd></div><div><dt className="text-stone">Organisation</dt><dd className="mt-1">Marque → Modèle → Article / variante</dd></div></dl>
      <ActionForm action={updateLowStockThresholdAction} className="mt-6 grid max-w-sm gap-4 border-t border-line pt-5"><Field label="Seuil de stock faible" name="lowStockThreshold" type="number" min={0} max={1000} value={settings?.lowStockThreshold ?? 5}/><p className="text-xs text-stone">Les articles dont le stock est inférieur ou égal à ce seuil apparaissent sur le dashboard.</p><div><SubmitButton>Enregistrer le seuil</SubmitButton></div></ActionForm>
    </section>

    <ActionForm action={updateCommerceSettingsAction} className="mt-5 grid gap-5">
      <section id="ecommerce" className="scroll-mt-28 rounded-2xl border border-line bg-white p-6 target:ring-2 target:ring-red/40"><h2 className="font-display text-xl">Vente en ligne</h2><p className="mt-2 text-sm text-stone">Activez le panier et le parcours de commande proposés aux clients.</p>{canConfigureCommerce ? <div className="mt-5 grid gap-3 md:grid-cols-3">{toggle("cart", "Panier", "Ajout et gestion des articles")}{toggle("orders", "Commandes", "Création et suivi des commandes")}{toggle("checkout", "Checkout", "Formulaire de finalisation")}</div> : <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Seul un Super Admin peut modifier ces options.</p>}</section>
      {canConfigureCommerce && <><section id="livraison" className="scroll-mt-28 rounded-2xl border border-line bg-white p-6 target:ring-2 target:ring-red/40"><p className="eyebrow text-red">Expédition</p><h2 className="font-display mt-1 text-xl">Livraison et retrait</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{toggle("delivery", "Livraison à domicile", "Livrer à l’adresse du client")}{toggle("storePickup", "Retrait gratuit en boutique", "Retrait dans une boutique InfraRed")}</div><div className="mt-5 max-w-sm"><Field label="Prix de livraison (TND)" name="deliveryFee" type="number" min={0} max={1000} step="0.001" value={commerce.deliveryFee}/></div></section>
      <section id="paiement" className="scroll-mt-28 rounded-2xl border border-line bg-white p-6 target:ring-2 target:ring-red/40"><p className="eyebrow text-red">Encaissement</p><h2 className="font-display mt-1 text-xl">Modes de paiement</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{toggle("cashOnDelivery", "Paiement à la livraison", "Le client règle lors de la réception")}{toggle("onlinePayment", "Paiement en ligne", "À activer après connexion d’une passerelle bancaire")}</div><p className="mt-4 rounded-xl bg-mist px-4 py-3 text-xs leading-5 text-stone">Le paiement à la livraison et le retrait sont utilisables immédiatement. Le paiement en ligne nécessite une passerelle bancaire configurée.</p></section>
      <div className="sticky bottom-4 z-10 flex justify-end"><SubmitButton>Enregistrer l’e-commerce</SubmitButton></div></>}
    </ActionForm>
    {canConfigureCommerce && <section className="mt-5 rounded-2xl border border-line bg-white p-6"><p className="eyebrow text-red">Encaissement</p><h2 className="font-display mt-1 text-xl">Passerelles TND</h2><p className="mt-2 text-sm text-stone">Les clés Flouci, Konnect et ClickToPay se gèrent sur la page Paiement.</p><Link href="/admin/paiements" className="mt-4 inline-flex rounded-full bg-red px-5 py-2.5 text-sm font-semibold text-white">Ouvrir la configuration Paiement</Link></section>}
  </AdminShell>;
}
