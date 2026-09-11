/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import { requirePagePermission } from "@/lib/authz";
import { formatDT } from "@/lib/currency";
import { prisma } from "@/lib/prisma";

const object=(value:unknown)=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
const paymentLabel=(method:string|null)=>method==="PAYPAL"?"PayPal · payé":method==="CASH_ON_DELIVERY"?"Paiement à la livraison":"Paiement en boutique";
const statusLabel:Record<string,string>={NEW:"Nouvelle",CONFIRMED:"Confirmée",PREPARING:"En préparation",SHIPPED:"Expédiée",DELIVERED:"Livrée",CANCELLED:"Annulée"};

export default async function PrintOrderPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{type?:string}>}) {
  await requirePagePermission("orders.view");
  const [{id},query]=await Promise.all([params,searchParams]);
  const [order,settings]=await Promise.all([
    prisma.order.findUnique({where:{id},include:{deliveryCompany:true,items:{include:{variant:{include:{brand:true,images:{take:1,orderBy:{sortOrder:"asc"}}}}}}}}),
    prisma.storeSettings.findUnique({where:{singletonKey:"main"},select:{logoUrl:true,phone:true,address:true,whatsapp:true}}),
  ]);
  if(!order)notFound();
  const delivery=query.type==="livraison";const customer=object(order.customerSnapshot);const fulfillment=object(order.fulfillmentSnapshot);
  const itemCount=order.items.reduce((sum,item)=>sum+item.quantity,0);
  return <main className="print-document mx-auto min-h-screen max-w-5xl bg-white p-5 text-[#172033] sm:p-10">
    <div className="print:hidden mb-6 flex items-center justify-between"><a href={`/admin/commandes/${order.id}`} className="text-sm font-semibold text-red underline">← Retour à la commande</a><PrintButton label={delivery?"Imprimer le bordereau":"Imprimer le bon de commande"}/></div>
    <article className="overflow-hidden rounded-2xl border border-[#d8dee8] bg-white shadow-sm print:rounded-none print:shadow-none">
      <header className="flex flex-wrap items-start justify-between gap-6 bg-[#0a1421] px-7 py-6 text-white">
        <div className="flex items-center gap-4">{settings?.logoUrl?<img src={settings.logoUrl} alt="InfraRed Optic Store" className="h-16 w-auto max-w-44 object-contain"/>:<div className="grid h-16 w-16 place-items-center rounded-xl border border-white/25 text-xl font-black text-[#ed1b2f]">IR</div>}<div><h1 className="text-xl font-bold">InfraRed Optic Store</h1><p className="mt-1 max-w-xs text-xs text-slate-300">{settings?.address??"Tunis, Tunisie"}</p><p className="text-xs text-slate-300">{settings?.phone??settings?.whatsapp??""}</p></div></div>
        <div className="text-right"><p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#ff5264]">{delivery?"Bordereau de livraison":"Bon de commande"}</p><h2 className="mt-2 text-2xl font-black">{order.number}</h2><p className="mt-1 text-xs text-slate-300">{order.createdAt.toLocaleString("fr-TN")}</p></div>
      </header>

      <section className="grid gap-px bg-[#d8dee8] sm:grid-cols-3"><div className="bg-[#f7f9fc] p-5"><p className="document-label">Client</p><p className="mt-2 font-bold">{String(customer.name??"—")}</p><p className="text-sm">{String(customer.phone??"—")}</p></div><div className="bg-[#f7f9fc] p-5"><p className="document-label">Remise</p><p className="mt-2 font-bold">{fulfillment.method==="DELIVERY"?"Livraison à domicile":"Retrait en boutique"}</p><p className="text-sm">{String(fulfillment.address??"")}</p><p className="text-sm">{String(fulfillment.city??"")}</p></div><div className="bg-[#f7f9fc] p-5"><p className="document-label">{delivery?"Transporteur":"Traitement"}</p>{delivery?<><p className="mt-2 font-bold">{order.deliveryCompany?.name??"Non affecté"}</p><p className="text-sm">{order.deliveryCompany?.phone??""}</p><p className="text-sm">{order.trackingNumber?`Suivi : ${order.trackingNumber}`:""}</p></>:<><p className="mt-2 font-bold">{paymentLabel(order.paymentMethod)}</p><p className="text-sm">{statusLabel[order.status]??order.status}</p></>}</div></section>

      <div className="p-7"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold">Détail des articles</h3><span className="rounded-full bg-[#eef1f6] px-3 py-1 text-xs font-semibold">{itemCount} article{itemCount>1?"s":""}</span></div>
        <div className="overflow-hidden rounded-xl border border-[#d8dee8]"><table className="w-full border-collapse text-xs sm:text-sm"><thead className="bg-[#eef1f6] text-left text-[10px] uppercase tracking-wider text-[#526074]"><tr><th className="px-3 py-3">Article</th><th className="px-3 py-3">Référence</th><th className="px-3 py-3">Caractéristiques</th><th className="px-3 py-3 text-center">Qté</th>{!delivery&&<><th className="px-3 py-3 text-right">Prix unitaire</th><th className="px-3 py-3 text-right">Total</th></>}</tr></thead><tbody>{order.items.map(item=>{const image=item.variant?.images[0]?.url;const brandLogo=item.variant?.brand.logo??item.variant?.brand.marqueeImage;return <tr key={item.id} className="border-t border-[#d8dee8] align-middle"><td className="px-3 py-3"><div className="flex items-center gap-3">{image&&<img src={image} alt="" className="h-12 w-16 rounded-lg bg-white object-contain"/>}<div>{brandLogo&&<img src={brandLogo} alt={item.brandName} className="mb-1 h-5 max-w-20 object-contain object-left"/>}<strong className="block">{item.brandName} {item.modelCode??item.productName}</strong></div></div></td><td className="px-3 py-3 font-medium">{item.reference}</td><td className="px-3 py-3">{[item.size,item.frameColor,item.lensColor].filter(Boolean).join(" · ")||"—"}</td><td className="px-3 py-3 text-center font-bold">{item.quantity}</td>{!delivery&&<><td className="px-3 py-3 text-right">{formatDT(Number(item.unitPrice))}</td><td className="px-3 py-3 text-right font-bold">{formatDT(Number(item.unitPrice)*item.quantity)}</td></>}</tr>})}</tbody></table></div>
        {!delivery&&<div className="ml-auto mt-6 w-full max-w-sm rounded-xl bg-[#0a1421] p-5 text-white"><div className="flex items-center justify-between text-lg"><span>Total commande</span><strong className="text-2xl">{formatDT(Number(order.total))}</strong></div><p className="mt-2 text-right text-xs text-slate-300">{paymentLabel(order.paymentMethod)}</p></div>}
        {delivery&&<div className="mt-8 grid grid-cols-2 gap-8 text-sm"><div className="border-t border-[#7d8795] pt-2">Signature du transporteur</div><div className="border-t border-[#7d8795] pt-2">Signature du destinataire</div></div>}
      </div>
    </article>
  </main>;
}
