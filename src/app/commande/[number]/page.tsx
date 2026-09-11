import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDT } from "@/lib/currency";

export const dynamic = "force-dynamic";
export default async function OrderConfirmation({params}:{params:Promise<{number:string}>}) {
  const {number}=await params;
  const order=await prisma.order.findUnique({where:{number},include:{items:true}});
  if(!order) notFound();
  return <div className="vf-container py-16"><div className="mx-auto max-w-2xl border p-7 sm:p-10"><CheckCircle2 className="text-emerald-600" size={42}/><h1 className="mt-5 text-3xl font-medium">Commande confirmée</h1><p className="mt-3 text-sm text-stone">Merci. Votre numéro de commande est <strong className="text-black">{order.number}</strong>.</p><div className="mt-7 divide-y border-y">{order.items.map(item=><div key={item.id} className="flex justify-between gap-4 py-4 text-sm"><span>{item.quantity} × {item.brandName} {item.productName}<small className="mt-1 block text-black/55">{[item.reference,item.frameColor,item.size].filter(Boolean).join(" · ")}</small></span><strong>{formatDT(Number(item.unitPrice)*item.quantity)}</strong></div>)}</div><div className="mt-5 flex justify-between text-lg"><span>Total</span><strong>{formatDT(Number(order.total))}</strong></div><p className="mt-6 bg-mist p-4 text-sm">L’équipe InfraRed vous contactera pour confirmer la commande et la livraison.</p><Link href="/catalogue" className="mt-6 inline-flex bg-red px-5 py-3 text-sm font-semibold text-white">Retour au catalogue</Link></div></div>;
}
