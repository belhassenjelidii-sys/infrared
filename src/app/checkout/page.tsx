import { redirect } from "next/navigation";
import { getCommerceSettings, getCurrentCart } from "@/lib/commerce";
import { getTndPaymentPublicStatus } from "@/lib/tnd-payment";
import { getDbStores } from "@/lib/site-data";
import { getAddressDirectory } from "@/lib/address-directory";
import CheckoutForm from "./CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const [features, cart, stores, gateway, query, addressDirectory] = await Promise.all([getCommerceSettings(), getCurrentCart(), getDbStores(), getTndPaymentPublicStatus(), searchParams, getAddressDirectory()]);
  if (!features.cart || !features.checkout || !features.orders) redirect("/catalogue");
  if (!cart?.items.length) redirect("/panier");
  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
  return <div className="min-h-screen bg-[#f5f3f0] py-6 sm:py-8"><div className="vf-container">
    <div className="mx-auto max-w-[1180px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-red">Commande sécurisée</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Finaliser votre commande</h1><p className="mt-2 max-w-xl text-sm leading-5 text-stone">Vos coordonnées sont utilisées uniquement pour confirmer et acheminer votre commande.</p></div>
    {query.payment === "cancelled" && <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Paiement en ligne annulé. Votre panier a été conservé.</p>}
    {query.payment === "error" && <p className="mt-5 rounded-lg bg-red-soft p-4 text-sm text-red">Le paiement n’a pas pu être confirmé. Aucun nouvel essai ne sera débité automatiquement.</p>}
    <CheckoutForm
      features={{ delivery: features.delivery, storePickup: features.storePickup, cashOnDelivery: features.cashOnDelivery, onlinePayment: features.onlinePayment, deliveryFee: features.deliveryFee }}
      stores={stores.map((store) => ({ id: store.id, name: store.name, address: store.address }))}
      gateway={{ ready: gateway.ready, label: gateway.label, mode: gateway.mode }}
      items={cart.items.map((item) => ({ id: item.id, quantity: item.quantity, unitPrice: Number(item.unitPrice), brand: item.variant.brand.name, model: item.variant.productModel?.name ?? item.variant.name, details: [item.variant.frameColorFamily ?? item.variant.color, item.variant.size].filter(Boolean).join(" · ") }))}
      subtotal={subtotal}
      addressDirectory={addressDirectory}
    /></div>
  </div>;
}
