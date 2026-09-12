"use client";

import { useMemo, useState } from "react";
import ActionForm, { SubmitButton } from "@/components/ActionForm";
import { formatDT } from "@/lib/currency";
import { availableCheckoutPayments, defaultCheckoutPayment, type CheckoutFulfillment, type CheckoutPayment } from "@/lib/checkout-options";
import { displayTunisianPlace, findDelegation, findGovernorate, localityChoice, TUNISIAN_GOVERNORATES } from "@/lib/tunisia-addresses";
import { createOrderAction } from "./actions";

type CheckoutFeatures = {
  delivery: boolean;
  storePickup: boolean;
  cashOnDelivery: boolean;
  onlinePayment: boolean;
  deliveryFee: number;
};

type CheckoutItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  brand: string;
  model: string;
  details: string;
};

export default function CheckoutForm({
  features,
  stores,
  gateway,
  items,
  subtotal,
}: {
  features: CheckoutFeatures;
  stores: { id: string; name: string; address: string }[];
  gateway: { ready: boolean; label: string | null; mode: "sandbox" | "live" };
  items: CheckoutItem[];
  subtotal: number;
}) {
  const onlineAvailable = features.onlinePayment && gateway.ready;
  const deliveryAvailable = features.delivery && (features.cashOnDelivery || onlineAvailable);
  const pickupAvailable = features.storePickup;
  const initialFulfillment: CheckoutFulfillment = deliveryAvailable ? "DELIVERY" : "PICKUP";
  const [fulfillment, setFulfillment] = useState<CheckoutFulfillment>(initialFulfillment);
  const [payment, setPayment] = useState<CheckoutPayment | null>(() => defaultCheckoutPayment({ fulfillment: initialFulfillment, cashOnDelivery: features.cashOnDelivery, onlineAvailable }));
  const [governorateValue, setGovernorateValue] = useState("");
  const [delegationValue, setDelegationValue] = useState("");
  const [localityValue, setLocalityValue] = useState("");

  const governorate = useMemo(() => findGovernorate(governorateValue), [governorateValue]);
  const delegation = useMemo(() => findDelegation(governorate, delegationValue), [governorate, delegationValue]);
  const locality = useMemo(() => delegation?.localities.find((entry) => localityChoice(entry) === localityValue) ?? null, [delegation, localityValue]);
  const paymentOptions = availableCheckoutPayments({ fulfillment, cashOnDelivery: features.cashOnDelivery, onlineAvailable });
  const total = subtotal + (fulfillment === "DELIVERY" ? features.deliveryFee : 0);

  function selectFulfillment(next: CheckoutFulfillment) {
    setFulfillment(next);
    setPayment(defaultCheckoutPayment({ fulfillment: next, cashOnDelivery: features.cashOnDelivery, onlineAvailable }));
  }

  return <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
    <ActionForm action={createOrderAction} className="grid gap-6">
      <fieldset className="grid gap-4 border p-5">
        <legend className="px-2 font-medium">Coordonnées du client</legend>
        <input name="name" required maxLength={120} autoComplete="name" placeholder="Nom et prénom *" className="min-h-12 border px-3"/>
        <input name="phone" required inputMode="tel" autoComplete="tel" title="Saisissez un numéro tunisien valide, par exemple 20 123 456." maxLength={20} placeholder="Téléphone tunisien * · 20 123 456" className="min-h-12 border px-3"/>
        <input name="email" type="email" maxLength={180} autoComplete="email" placeholder="E-mail (facultatif)" className="min-h-12 border px-3"/>
      </fieldset>

      <fieldset className="grid gap-3 border p-5">
        <legend className="px-2 font-medium">Mode de remise</legend>
        {features.delivery && <label className={`flex items-center gap-3 border p-4 ${deliveryAvailable ? "" : "cursor-not-allowed opacity-50"}`}>
          <input type="radio" name="fulfillment" value="DELIVERY" required checked={fulfillment === "DELIVERY"} disabled={!deliveryAvailable} onChange={() => selectFulfillment("DELIVERY")}/>
          <span>Livraison à domicile · {formatDT(features.deliveryFee)}</span>
        </label>}
        {pickupAvailable && <label className="flex items-center gap-3 border p-4">
          <input type="radio" name="fulfillment" value="PICKUP" required checked={fulfillment === "PICKUP"} onChange={() => selectFulfillment("PICKUP")}/>
          <span>Retrait gratuit en boutique</span>
        </label>}
        {fulfillment === "PICKUP" && <select name="storeId" defaultValue="" required className="min-h-12 border px-3">
          <option value="">Choisir la boutique de retrait</option>
          {stores.map((store) => <option key={store.id} value={store.id}>{store.name} — {store.address}</option>)}
        </select>}
      </fieldset>

      {fulfillment === "DELIVERY" && <fieldset className="grid gap-4 border p-5">
        <legend className="px-2 font-medium">Adresse de livraison</legend>
        <label className="grid gap-2 text-sm font-medium">Gouvernorat *
          <input list="tunisia-governorates" value={governorateValue} required autoComplete="off" placeholder="Rechercher un gouvernorat" className="min-h-12 border px-3 font-normal" onChange={(event) => { setGovernorateValue(event.target.value); setDelegationValue(""); setLocalityValue(""); }} onBlur={() => { if (!governorate) setGovernorateValue(""); }}/>
          <datalist id="tunisia-governorates">{TUNISIAN_GOVERNORATES.map((entry) => <option key={entry.name} value={displayTunisianPlace(entry.name)}/>)}</datalist>
        </label>
        <input type="hidden" name="governorate" value={governorate?.name ?? ""}/>
        <label className="grid gap-2 text-sm font-medium">Zone / délégation *
          <input list="tunisia-delegations" value={delegationValue} required disabled={!governorate} autoComplete="off" placeholder="Rechercher une zone ou délégation" className="min-h-12 border px-3 font-normal disabled:bg-black/5" onChange={(event) => { setDelegationValue(event.target.value); setLocalityValue(""); }} onBlur={() => { if (!delegation) setDelegationValue(""); }}/>
          <datalist id="tunisia-delegations">{governorate?.delegations.map((entry) => <option key={entry.name} value={displayTunisianPlace(entry.name)}/>)}</datalist>
        </label>
        <input type="hidden" name="delegation" value={delegation?.name ?? ""}/>
        <label className="grid gap-2 text-sm font-medium">Localité / quartier *
          <input list="tunisia-localities" value={localityValue} required disabled={!delegation} autoComplete="off" placeholder="Rechercher une localité ou un quartier" className="min-h-12 border px-3 font-normal disabled:bg-black/5" onChange={(event) => setLocalityValue(event.target.value)} onBlur={() => { if (!locality) setLocalityValue(""); }}/>
          <datalist id="tunisia-localities">{delegation?.localities.map((entry, index) => <option key={`${entry.name}-${entry.postalCode}-${index}`} value={localityChoice(entry)}/>)}</datalist>
        </label>
        <input type="hidden" name="locality" value={locality?.name ?? ""}/>
        <label className="grid gap-2 text-sm font-medium">Code postal
          <input name="postalCode" value={locality?.postalCode ?? ""} readOnly placeholder="Renseigné automatiquement" className="min-h-12 border bg-black/[0.025] px-3 font-normal"/>
        </label>
        <label className="grid gap-2 text-sm font-medium">Adresse exacte *
          <textarea name="address" required maxLength={240} autoComplete="street-address" placeholder="Rue, numéro, résidence, étage…" rows={3} className="border p-3 font-normal"/>
        </label>
      </fieldset>}

      {onlineAvailable ? <fieldset className="grid gap-3 border p-5">
        <legend className="px-2 font-medium">Mode de paiement</legend>
        {paymentOptions.includes("CASH_ON_DELIVERY") && <label className="flex items-center gap-3 border p-4"><input type="radio" name="paymentMethod" value="CASH_ON_DELIVERY" required checked={payment === "CASH_ON_DELIVERY"} onChange={() => setPayment("CASH_ON_DELIVERY")}/><span>Paiement à la livraison</span></label>}
        {paymentOptions.includes("CASH_IN_STORE") && <label className="flex items-center gap-3 border p-4"><input type="radio" name="paymentMethod" value="CASH_IN_STORE" required checked={payment === "CASH_IN_STORE"} onChange={() => setPayment("CASH_IN_STORE")}/><span>Paiement en boutique au retrait</span></label>}
        {paymentOptions.includes("ONLINE_TND") && <label className="flex items-center justify-between gap-3 border p-4"><span className="flex items-center gap-3"><input type="radio" name="paymentMethod" value="ONLINE_TND" required checked={payment === "ONLINE_TND"} onChange={() => setPayment("ONLINE_TND")}/><span>{gateway.label} {gateway.mode === "sandbox" ? "· Test Sandbox" : "· Paiement sécurisé"}</span></span><small className="text-stone">Débit en TND</small></label>}
      </fieldset> : <input type="hidden" name="paymentMethod" value={payment ?? ""}/>}

      {features.onlinePayment && !gateway.ready && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Le paiement en ligne est activé mais sa passerelle TND est incomplète. Seul le paiement lié au mode de remise est disponible.</p>}
      <textarea name="notes" maxLength={500} placeholder="Notes (facultatif)" rows={3} className="border p-3"/>
      <div><SubmitButton disabled={!payment}>Confirmer la commande</SubmitButton></div>
    </ActionForm>

    <aside className="border bg-[#fafafa] p-6">
      <h2 className="font-medium">Votre commande</h2>
      <div className="mt-4 divide-y">{items.map((item) => <div key={item.id} className="flex justify-between gap-4 py-3 text-sm"><span>{item.quantity} × {item.brand} {item.model}<small className="mt-1 block text-black/55">{item.details}</small></span><strong className="whitespace-nowrap">{formatDT(item.unitPrice * item.quantity)}</strong></div>)}</div>
      <div className="mt-4 flex justify-between border-t pt-4"><span>Sous-total</span><strong>{formatDT(subtotal)}</strong></div>
      {fulfillment === "DELIVERY" && <div className="mt-3 flex justify-between text-sm"><span>Livraison</span><strong>{formatDT(features.deliveryFee)}</strong></div>}
      <div className="mt-4 flex justify-between border-t pt-4 text-lg"><span>Total</span><strong>{formatDT(total)}</strong></div>
      {onlineAvailable && <p className="mt-4 border-t pt-4 text-xs leading-5 text-stone">Le montant final est transmis et vérifié en dinars tunisiens, sans conversion de devise.</p>}
    </aside>
  </div>;
}
