import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import ActionForm, { SubmitButton } from "@/components/ActionForm";
import { requirePagePermission } from "@/lib/authz";
import { getCommerceSettings } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";
import { formatDT } from "@/lib/currency";
import { updateOrderStatusAction } from "./actions";
import { ORDER_STATUS_LABELS, allowedNextOrderStatuses } from "@/lib/order-status";

const customer=(value:unknown)=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};

export default async function OrdersPage({searchParams}:{searchParams:Promise<{status?:string}>}) {
  await requirePagePermission("orders.view");
  const query=await searchParams;
  const onlyNew=query.status==="NEW";
  const [features,orders,newCount]=await Promise.all([getCommerceSettings(),prisma.order.findMany({where:onlyNew?{status:"NEW"}:undefined,take:100,orderBy:{createdAt:"desc"},include:{items:true}}),prisma.order.count({where:{status:"NEW"}})]);
  return <AdminShell active="/admin/commandes"><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold">Commandes</h1><p className="mt-2 text-sm text-stone">{features.orders?`${orders.length} commande(s) affichée(s).`:"Les commandes en ligne sont désactivées."}</p></div>{newCount>0&&<Link href={onlyNew?"/admin/commandes":"/admin/commandes?status=NEW"} className="rounded-full bg-red px-4 py-2 text-sm font-semibold text-white">{onlyNew?"Voir toutes les commandes":`${newCount} nouvelle(s) commande(s)`}</Link>}</div>{features.orders&&<div className="mt-6 overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-slate-50 text-xs text-stone"><tr>{["Numéro","Client","Téléphone","Date","Montant","Paiement","Statut","Actions"].map(label=><th key={label} className="p-3">{label}</th>)}</tr></thead><tbody className="divide-y">{orders.map(order=>{const client=customer(order.customerSnapshot);return <tr key={order.id} className={order.status==="NEW"?"bg-red/5":""}><td className="p-3 font-medium"><Link href={`/admin/commandes/${order.id}`} className="text-red hover:underline">{order.number}</Link>{order.status==="NEW"&&<span className="ml-2 rounded-full bg-red px-2 py-0.5 text-[9px] font-bold uppercase text-white">Nouveau</span>}</td><td className="p-3">{String(client.name??"Client")}</td><td className="p-3">{String(client.phone??"—")}</td><td className="p-3 whitespace-nowrap">{order.createdAt.toLocaleDateString("fr-TN")}</td><td className="p-3 whitespace-nowrap">{formatDT(Number(order.total))}</td><td className="p-3">{order.paymentMethod==="CASH_ON_DELIVERY"?"À la livraison":order.paymentMethod==="CASH_IN_STORE"?"En boutique":order.paymentMethod==="PAYPAL"?"PayPal · payé":"En ligne"}</td><td className="p-3"><ActionForm action={updateOrderStatusAction.bind(null,order.id)} refreshOnSuccess className="flex items-center gap-2"><select name="status" defaultValue={order.status} className="min-h-9 rounded border px-2 text-xs">{allowedNextOrderStatuses(order.status).map(value=><option key={value} value={value}>{ORDER_STATUS_LABELS[value]}</option>)}</select><SubmitButton>OK</SubmitButton></ActionForm></td><td className="p-3"><Link href={`/admin/commandes/${order.id}`} className="admin-action-button whitespace-nowrap">Ouvrir / imprimer</Link></td></tr>})}</tbody></table>{!orders.length&&<p className="p-8 text-center text-stone">Aucune commande dans cette vue.</p>}</div>}</AdminShell>;
}
