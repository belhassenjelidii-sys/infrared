import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import ActionForm, { SubmitButton } from "@/components/ActionForm";
import DeliveryAssignmentForm from "@/components/DeliveryAssignmentForm";
import PreparationStoreForm from "@/components/PreparationStoreForm";
import { updateOrderDeliveryAction, updateOrderPreparationStoreAction, updateOrderStatusAction } from "@/app/admin/commandes/actions";
import { ORDER_STATUS_LABELS, allowedNextOrderStatuses } from "@/lib/order-status";
import { canChangePreparationStore } from "@/lib/order-preparation";
import { requirePagePermission } from "@/lib/authz";
import { formatDT } from "@/lib/currency";
import { prisma } from "@/lib/prisma";

const object=(value:unknown)=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};

export default async function OrderDetailsPage({params}:{params:Promise<{id:string}>}) {
  await requirePagePermission("orders.view");
  const {id}=await params;
  const [order,companies,stores]=await Promise.all([
    prisma.order.findUnique({where:{id},include:{items:true,deliveryCompany:true,preparationStore:true}}),
    prisma.deliveryCompany.findMany({where:{active:true},orderBy:{name:"asc"}}),
    prisma.store.findMany({where:{active:true},select:{id:true,name:true,address:true},orderBy:{sortOrder:"asc"}}),
  ]);
  if(!order)notFound();
  const customer=object(order.customerSnapshot);const fulfillment=object(order.fulfillmentSnapshot);const delivery=fulfillment.method==="DELIVERY";const deliveryAddress=fulfillment.address?String(fulfillment.address):fulfillment.method==="PICKUP"?"Retrait en boutique":"—";
  return <AdminShell active="/admin/commandes"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow text-red">Commande</p><h1 className="mt-2 text-3xl font-semibold">{order.number}</h1><p className="mt-1 text-sm text-stone">Créée le {order.createdAt.toLocaleDateString("fr-TN")}</p></div><div className="flex flex-wrap gap-2"><Link href={`/admin/commandes/${order.id}/imprimer?type=commande`} className="admin-action-button">Imprimer le bon de commande</Link>{delivery&&<Link href={`/admin/commandes/${order.id}/imprimer?type=livraison`} className="inline-flex min-h-10 items-center rounded-lg bg-red px-4 py-2 text-sm font-semibold text-white">Bordereau de livraison</Link>}</div></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]"><section className="rounded-2xl border border-line bg-white p-6"><h2 className="font-display text-xl">Articles</h2><div className="mt-4 divide-y">{order.items.map(item=><div key={item.id} className="flex justify-between gap-4 py-4 text-sm"><span>{item.quantity} × <strong>{item.brandName} {item.modelCode??item.productName}</strong><small className="mt-1 block text-stone">{[item.reference,item.frameColor,item.lensColor,item.size].filter(Boolean).join(" · ")}</small></span><strong>{formatDT(Number(item.unitPrice)*item.quantity)}</strong></div>)}</div><div className="flex justify-between border-t pt-4 text-lg"><span>Total</span><strong>{formatDT(Number(order.total))}</strong></div></section>
      <aside className="grid gap-5"><section className="rounded-2xl border border-line bg-white p-5"><h2 className="font-semibold">Client</h2><dl className="mt-3 grid gap-2 text-sm"><div><dt className="text-stone">Nom</dt><dd>{String(customer.name??"—")}</dd></div><div><dt className="text-stone">Téléphone</dt><dd>{String(customer.phone??"—")}</dd></div><div><dt className="text-stone">Adresse</dt><dd>{deliveryAddress}</dd></div><div><dt className="text-stone">Ville</dt><dd>{String(fulfillment.city??"—")}</dd></div></dl></section>
        <section className="rounded-2xl border border-line bg-white p-5"><h2 className="font-semibold">Traitement</h2><p className="mt-2 text-sm text-stone">{order.paymentMethod==="PAYPAL"?"PayPal · payé":order.paymentMethod==="CASH_ON_DELIVERY"?"Paiement à la livraison":"Paiement en boutique"}</p><ActionForm action={updateOrderStatusAction.bind(null,order.id)} refreshOnSuccess className="mt-4 grid gap-3"><select name="status" defaultValue={order.status} className="min-h-11 rounded-lg border px-3">{allowedNextOrderStatuses(order.status).map(value=><option key={value} value={value}>{ORDER_STATUS_LABELS[value]}</option>)}</select><div><SubmitButton>Mettre à jour</SubmitButton></div></ActionForm></section>
        <section className="rounded-2xl border border-line bg-white p-5"><h2 className="font-semibold">Préparation</h2><p className="mt-1 text-xs text-stone">Organisation uniquement : le stock reste global pour cette première version.</p><PreparationStoreForm action={updateOrderPreparationStoreAction.bind(null,order.id)} stores={stores} storeId={order.preparationStoreId} disabled={!canChangePreparationStore(order.status)}/>{order.preparationStore&&<p className="mt-3 rounded-lg bg-mist p-3 text-xs">Préparée par <strong>{order.preparationStore.name}</strong></p>}</section>
        {delivery&&<section className="rounded-2xl border border-line bg-white p-5"><h2 className="font-semibold">Transporteur</h2><p className="mt-1 text-xs text-stone">La sélection apparaîtra sur le bordereau de livraison.</p><DeliveryAssignmentForm action={updateOrderDeliveryAction.bind(null,order.id)} companies={companies} deliveryCompanyId={order.deliveryCompanyId} manualFirstName={order.manualDeliveryFirstName} manualLastName={order.manualDeliveryLastName} manualPhone={order.manualDeliveryPhone} trackingNumber={order.trackingNumber}/>{order.deliveryCompany&&<p className="mt-3 rounded-lg bg-mist p-3 text-xs">Affectée à <strong>{order.deliveryCompany.name}</strong>{order.deliveryCompany.phone?<><br/>{order.deliveryCompany.phone}</>:null}</p>}{!order.deliveryCompany&&order.manualDeliveryFirstName&&<p className="mt-3 rounded-lg bg-mist p-3 text-xs">Livreur manuel : <strong>{order.manualDeliveryFirstName} {order.manualDeliveryLastName}</strong><br/>{order.manualDeliveryPhone}</p>}</section>}
      </aside></div>
  </AdminShell>;
}
