import { redirect } from "next/navigation";
import { getCommerceSettings, getCurrentCart } from "@/lib/commerce";
import { getTndPaymentPublicStatus } from "@/lib/tnd-payment";
import { getDbStores } from "@/lib/site-data";
import CheckoutForm from "./CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const [features, cart, stores, gateway, query] = await Promise.all([getCommerceSettings(), getCurrentCart(), getDbStores(), getTndPaymentPublicStatus(), searchParams]);
  if (!features.cart || !features.checkout || !features.orders) redirect("/catalogue");
  if (!cart?.items.length) redirect("/panier");
  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
  return <div className="vf-container py-10 sm:py-14">
    <h1 className="text-3xl font-medium">Finaliser la commande</h1><p className="mt-2 text-sm text-stone">Vos coordonnées sont utilisées uniquement pour confirmer et livrer votre commande.</p>
    {query.payment === "cancelled" && <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Paiement en ligne annulé. Votre panier a été conservé.</p>}
    {query.payment === "error" && <p className="mt-5 rounded-lg bg-red-soft p-4 text-sm text-red">Le paiement n’a pas pu être confirmé. Aucun nouvel essai ne sera débité automatiquement.</p>}
    <CheckoutForm
      features={{ delivery: features.delivery, storePickup: features.storePickup, cashOnDelivery: features.cashOnDelivery, onlinePayment: features.onlinePayment, deliveryFee: features.deliveryFee }}
      stores={stores.map((store) => ({ id: store.id, name: store.name, address: store.address }))}
      gateway={{ ready: gateway.ready, label: gateway.label, mode: gateway.mode }}
      items={cart.items.map((item) => ({ id: item.id, quantity: item.quantity, unitPrice: Number(item.unitPrice), brand: item.variant.brand.name, model: item.variant.productModel?.name ?? item.variant.name, details: [item.variant.frameColorFamily ?? item.variant.color, item.variant.size].filter(Boolean).join(" · ") }))}
      subtotal={subtotal}
    />
  </div>;
}
