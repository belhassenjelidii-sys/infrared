import { redirect } from "next/navigation";
import ActionForm, { SubmitButton } from "@/components/ActionForm";
import { formatDT } from "@/lib/currency";
import { getCommerceSettings, getCurrentCart } from "@/lib/commerce";
import { getTndPaymentPublicStatus } from "@/lib/tnd-payment";
import { getDbStores } from "@/lib/site-data";
import { createOrderAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const [features, cart, stores, gateway, query] = await Promise.all([getCommerceSettings(), getCurrentCart(), getDbStores(), getTndPaymentPublicStatus(), searchParams]);
  if (!features.cart || !features.checkout || !features.orders) redirect("/catalogue");
  if (!cart?.items.length) redirect("/panier");
  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
  const onlineAvailable = features.onlinePayment && gateway.ready;
  const defaultPayment = features.cashOnDelivery ? "CASH_ON_DELIVERY" : features.storePickup ? "CASH_IN_STORE" : onlineAvailable ? "ONLINE_TND" : "";
  return <div className="vf-container py-10 sm:py-14">
    <h1 className="text-3xl font-medium">Finaliser la commande</h1><p className="mt-2 text-sm text-stone">Vos coordonnées sont utilisées uniquement pour confirmer et livrer votre commande.</p>
    {query.payment === "cancelled" && <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Paiement en ligne annulé. Votre panier a été conservé.</p>}
    {query.payment === "error" && <p className="mt-5 rounded-lg bg-red-soft p-4 text-sm text-red">Le paiement n’a pas pu être confirmé. Aucun nouvel essai ne sera débité automatiquement.</p>}
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <ActionForm action={createOrderAction} className="grid gap-6">
        <fieldset className="grid gap-4 border p-5"><legend className="px-2 font-medium">Coordonnées de livraison</legend><input name="name" required maxLength={120} autoComplete="name" placeholder="Nom et prénom *" className="min-h-12 border px-3"/><input name="phone" required inputMode="tel" autoComplete="tel" title="Saisissez un numéro tunisien valide, par exemple 20 123 456." maxLength={20} placeholder="Téléphone tunisien * · 20 123 456" className="min-h-12 border px-3"/><input name="email" type="email" maxLength={180} autoComplete="email" placeholder="E-mail (facultatif)" className="min-h-12 border px-3"/><textarea name="address" required maxLength={240} autoComplete="street-address" placeholder="Adresse *" rows={3} className="border p-3"/><input name="city" required maxLength={100} autoComplete="address-level1" placeholder="Ville / Gouvernorat *" className="min-h-12 border px-3"/><textarea name="notes" maxLength={500} placeholder="Notes de livraison (facultatif)" rows={3} className="border p-3"/></fieldset>
        <fieldset className="grid gap-3 border p-5"><legend className="px-2 font-medium">Mode de remise</legend>{features.delivery&&<label className="flex items-center gap-3 border p-4"><input type="radio" name="fulfillment" value="DELIVERY" required defaultChecked/><span>Livraison à domicile · {formatDT(features.deliveryFee)}</span></label>}{features.storePickup&&<><label className="flex items-center gap-3 border p-4"><input type="radio" name="fulfillment" value="PICKUP" required/><span>Retrait gratuit en boutique</span></label><select name="storeId" defaultValue="" className="min-h-12 border px-3"><option value="">Choisir la boutique de retrait</option>{stores.map((store)=><option key={store.id} value={store.id}>{store.name} — {store.address}</option>)}</select></>}</fieldset>
        <fieldset className="grid gap-3 border p-5"><legend className="px-2 font-medium">Mode de paiement</legend>{features.cashOnDelivery&&<label className="flex items-center gap-3 border p-4"><input type="radio" name="paymentMethod" value="CASH_ON_DELIVERY" required defaultChecked={defaultPayment==="CASH_ON_DELIVERY"}/><span>Paiement à la livraison</span></label>}{features.storePickup&&<label className="flex items-center gap-3 border p-4"><input type="radio" name="paymentMethod" value="CASH_IN_STORE" required defaultChecked={defaultPayment==="CASH_IN_STORE"}/><span>Paiement en espèces au retrait</span></label>}{onlineAvailable&&<label className="flex items-center justify-between gap-3 border p-4"><span className="flex items-center gap-3"><input type="radio" name="paymentMethod" value="ONLINE_TND" required defaultChecked={defaultPayment==="ONLINE_TND"}/><span>{gateway.label} {gateway.mode==="sandbox"?"· Test Sandbox":"· Paiement sécurisé"}</span></span><small className="text-stone">Débit en TND</small></label>}{features.onlinePayment&&!gateway.ready&&<p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Le paiement en ligne est activé mais sa passerelle TND est incomplète. Contactez la boutique.</p>}</fieldset>
        <div><SubmitButton>Confirmer la commande</SubmitButton></div>
      </ActionForm>
      <aside className="border bg-[#fafafa] p-6"><h2 className="font-medium">Votre commande</h2><div className="mt-4 divide-y">{cart.items.map((item)=><div key={item.id} className="flex justify-between gap-4 py-3 text-sm"><span>{item.quantity} × {item.variant.brand.name} {item.variant.productModel?.name??item.variant.name}<small className="mt-1 block text-black/55">{[item.variant.frameColorFamily??item.variant.color,item.variant.size].filter(Boolean).join(" · ")}</small></span><strong className="whitespace-nowrap">{formatDT(Number(item.unitPrice)*item.quantity)}</strong></div>)}</div><div className="mt-4 flex justify-between border-t pt-4"><span>Sous-total</span><strong>{formatDT(subtotal)}</strong></div>{features.delivery&&<div className="mt-3 flex justify-between text-sm"><span>Livraison</span><strong>{formatDT(features.deliveryFee)}</strong></div>}{onlineAvailable&&<p className="mt-4 border-t pt-4 text-xs leading-5 text-stone">Le montant final est transmis et vérifié en dinars tunisiens, sans conversion de devise.</p>}</aside>
    </div>
  </div>;
}
