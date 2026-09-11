import ManagedImage from "@/components/ManagedImage";
import { prisma } from "@/lib/prisma";
import { formatDT } from "@/lib/currency";
import { requirePagePermission } from "@/lib/authz";
import AdminShell from "@/components/AdminShell";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import PromotionEditor, { PromotionCreator } from "./PromotionEditor";
import { removePromotionAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const session = await requirePagePermission("promotions.manage");
  const [promotions, availableProducts] = await Promise.all([
    prisma.product.findMany({where:{isPromotion:true,archived:false},include:{brand:true,images:{take:1,orderBy:{sortOrder:"asc"}}},orderBy:[{discount:"desc"},{name:"asc"}]}),
    prisma.product.findMany({where:{isPromotion:false,archived:false},include:{brand:true},orderBy:[{brand:{name:"asc"}},{name:"asc"}],take:500}),
  ]);
  const choices=availableProducts.map(product=>({id:product.id,label:`${product.brand.name} · ${product.variantReference??product.reference} · ${formatDT(product.price)}`}));
  return <AdminShell active="/admin/promotions" name={session.name} email={session.email} role={session.role}>
    <p className="eyebrow text-red">Gestion</p><h1 className="mt-2 text-3xl font-semibold">Promotions</h1><p className="mt-2 text-sm text-stone">Choisissez un prix promotionnel exact ou une réduction de 5 % à 90 %. Les promotions actives restent modifiables directement dans leur ligne.</p>
    <section className="mt-7 rounded-2xl border border-line bg-white p-5"><h2 className="text-lg font-semibold">Ajouter un article en promotion</h2><PromotionCreator products={choices}/></section>
    <section className="mt-7"><div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-semibold">Articles en promotion</h2><p className="mt-1 text-sm text-stone">{promotions.length} promotion(s) active(s)</p></div></div>
      <div className="grid gap-4">{promotions.map(product=><article key={product.id} className="rounded-2xl border border-line bg-white p-4"><div className="grid items-center gap-4 xl:grid-cols-[minmax(280px,1fr)_180px_minmax(320px,1.3fr)_auto]"><div className="flex items-center gap-4"><div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-mist">{product.images[0]&&<ManagedImage src={product.images[0].url} alt={product.name} fill sizes="112px" className="object-contain"/>}</div><div><p className="font-semibold">{product.brand.name} · {product.name}</p><p className="mt-1 text-xs text-stone">{product.variantReference??product.reference}</p></div></div><div><p className="text-xs uppercase text-stone">Prix actuel</p><p className="mt-1 font-bold">{formatDT(product.price)}</p><p className="text-xs text-stone line-through">{formatDT(product.oldPrice!)}</p></div><PromotionEditor compact productId={product.id} price={Number(product.price)} discount={product.discount}/><form action={removePromotionAction.bind(null,product.id)} className="xl:text-right"><ConfirmSubmitButton confirmMessage={`Retirer la promotion de “${product.name}” et restaurer le prix normal ?`} className="admin-action-button border-red/40 text-red">Retirer</ConfirmSubmitButton></form></div></article>)}{promotions.length===0&&<p className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-stone">Aucune promotion active.</p>}</div>
    </section>
  </AdminShell>;
}
