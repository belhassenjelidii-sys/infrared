import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDT } from "@/lib/currency";
import PrintReceiptButton from "@/components/PrintReceiptButton";

export const dynamic = "force-dynamic";
export default async function OrderConfirmation({params,searchParams}:{params:Promise<{number:string}>;searchParams:Promise<{token?:string}>}) {
  const {number}=await params;
  const {token=""}=await searchParams;
  const order=await prisma.order.findFirst({where:{number,publicToken:token},select:{number:true,total:true,paymentMethod:true,paymentStatus:true,createdAt:true,items:{select:{id:true,quantity:true,brandName:true,productName:true,reference:true,frameColor:true,size:true,unitPrice:true}}}});
  if(!order) notFound();
  const date=new Intl.DateTimeFormat("fr-TN",{dateStyle:"long"}).format(order.createdAt);
  const payment=order.paymentMethod==="ONLINE_TND"?"Paiement en ligne":order.paymentMethod==="CASH_IN_STORE"?"Paiement au retrait":"Paiement à la livraison";
  return <div className="vf-container py-12 sm:py-16"><div className="receipt mx-auto max-w-2xl border p-7 sm:p-10"><div className="flex items-start justify-between gap-4"><div><CheckCircle2 className="text-emerald-600" size={42}/><h1 className="mt-5 text-3xl font-medium">Commande confirmée</h1><p className="mt-3 text-sm text-stone">Merci. Votre numéro de commande est <strong className="text-black">{order.number}</strong>.</p></div><div className="text-right text-xs text-stone"><p>Reçu de paiement</p><p className="mt-1">{date}</p></div></div><div className="mt-7 divide-y border-y">{order.items.map(item=><div key={item.id} className="flex justify-between gap-4 py-4 text-sm"><span>{item.quantity} × {item.brandName} {item.productName}<small className="mt-1 block text-black/55">{[item.reference,item.frameColor,item.size].filter(Boolean).join(" · ")}</small></span><strong>{formatDT(Number(item.unitPrice)*item.quantity)}</strong></div>)}</div><div className="mt-5 space-y-2"><div className="flex justify-between text-sm"><span>Mode de paiement</span><strong>{payment}</strong></div><div className="flex justify-between text-lg"><span>Total</span><strong>{formatDT(Number(order.total))}</strong></div></div><p className="mt-6 bg-mist p-4 text-sm">L’équipe InfraRed vous contactera pour confirmer la commande et la livraison.</p><PrintReceiptButton/><Link href="/catalogue" className="no-print mt-6 ml-3 inline-flex bg-red px-5 py-3 text-sm font-semibold text-white">Retour au catalogue</Link></div><style>{`@media print{@page{size:A4;margin:16mm}body{background:#fff!important}.no-print{display:none!important}.receipt{border:0!important;max-width:none!important;padding:0!important;box-shadow:none!important}.vf-container{max-width:none!important;padding:0!important}}`}</style></div>;
}
