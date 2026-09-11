import ManagedImage from "@/components/ManagedImage";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle, ArrowRight, Boxes, CircleDollarSign, Glasses, Package, Plus,
  ShieldCheck, Sparkles, Tags, TrendingUp,
} from "lucide-react";
import AdminShell from "@/components/AdminShell";
import ActionForm, { SubmitButton } from "@/components/ActionForm";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/authz";
import { can, ROLE_LABELS, type StaffRole } from "@/lib/permissions";
import { formatDT } from "@/lib/currency";
import { saveVariantAction } from "./catalogue-actions";
import { commerceSettings } from "@/lib/features";
import VariantAttributeSelectors from "@/components/VariantAttributeSelectors";

export const dynamic = "force-dynamic";
const panel = "rounded-2xl border border-slate-800 bg-[#101b29] shadow-[0_18px_50px_rgba(0,0,0,.16)]";
const input = "h-11 min-w-0 rounded-lg border border-slate-700 bg-[#0b1522] px-3 text-sm text-white";

const activityLabels: Record<string, string> = {
  "model.create": "Nouveau modèle ajouté",
  "model.update": "Modèle modifié",
  "model.delete": "Modèle supprimé",
  "variant.create": "Nouvel article ajouté",
  "variant.update": "Article modifié",
  "variant.archive": "Article archivé",
  "variant.restore": "Article restauré",
  "variant.delete": "Article supprimé",
  "stock.update": "Stock mis à jour",
  "user.create": "Utilisateur ajouté",
  "user.update": "Utilisateur modifié",
  "user.delete": "Utilisateur supprimé",
  "role.permissions.update": "Permissions modifiées",
  "settings.commerce.update": "E-commerce configuré",
  "order.status.update": "Commande mise à jour",
};

export default async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (sp.filter || sp.q) {
    const query = new URLSearchParams();
    if (sp.filter) query.set("filter", sp.filter);
    if (sp.q) query.set("q", sp.q);
    if (sp.filter === "archived") query.set("status", "archived");
    redirect(`/admin/articles?${query}`);
  }
  const user = await requirePagePermission("dashboard.view");
  const settings = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" }, select: { lowStockThreshold: true, features: true } });
  const threshold = settings?.lowStockThreshold ?? 5;
  const commerce = commerceSettings(settings?.features);
  const notificationUser = can(user, "orders.view") ? await prisma.user.findUnique({ where: { id: user.userId }, select: { orderNotificationsSeenAt: true } }) : null;
  const newOrderCount = can(user, "orders.view") ? await prisma.order.count({ where: notificationUser?.orderNotificationsSeenAt ? { createdAt: { gt: notificationUser.orderNotificationsSeenAt } } : undefined }) : 0;
  const [active, modelCount, brandCount, lowCount, recent, lowStock, activities, roleCounts, activeModels] = await Promise.all([
    prisma.product.count({ where: { archived: false, published: true } }),
    can(user, "models.view") ? prisma.productModel.count() : Promise.resolve(0),
    can(user, "brands.manage") ? prisma.brand.count({ where: { active: true } }) : Promise.resolve(0),
    can(user, "stock.view") ? prisma.product.count({ where: { archived: false, stock: { lte: threshold } } }) : Promise.resolve(0),
    can(user, "products.view") ? prisma.product.findMany({
      where: { archived: false }, take: 5, orderBy: { updatedAt: "desc" },
      include: { brand: true, category: true, productModel: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
    }) : Promise.resolve([]),
    can(user, "stock.view") ? prisma.product.findMany({
      where: { archived: false, stock: { lte: threshold } }, take: 5, orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
      include: { productModel: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
    }) : Promise.resolve([]),
    can(user, "audit.view") ? prisma.auditLog.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } }) : Promise.resolve([]),
    can(user, "users.view") ? prisma.user.groupBy({ by: ["role"], where: { active: true }, _count: { _all: true } }) : Promise.resolve([]),
    can(user, "products.create") ? prisma.productModel.findMany({ where: { active: true }, take: 100, orderBy: [{ updatedAt: "desc" }, { code: "asc" }], include: { brand: true } }) : Promise.resolve([]),
  ]);

  const stats = [
    { label: "Produits actifs", value: active, href: "/admin/articles", permission: "products.view" as const, icon: Glasses, tone: "from-emerald-500 to-emerald-700", accent: "text-emerald-400" },
    { label: "Modèles", value: modelCount, href: "/admin/modeles", permission: "models.view" as const, icon: Boxes, tone: "from-violet-500 to-violet-700", accent: "text-violet-400" },
    { label: "Marques", value: brandCount, href: "/admin/marques", permission: "brands.manage" as const, icon: Tags, tone: "from-blue-500 to-blue-700", accent: "text-blue-400" },
    { label: "Stock faible", value: lowCount, href: "/admin/stocks?stock=low", permission: "stock.view" as const, icon: AlertTriangle, tone: "from-amber-500 to-amber-700", accent: "text-amber-400" },
  ];
  const roles = (["SUPER_ADMIN", "ADMIN", "COMMERCIAL", "MARKETING"] as StaffRole[]).map((role) => ({ role, count: roleCounts.find((item) => item.role === role)?._count._all ?? 0 }));

  return <AdminShell active="/admin">
    <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[.2em] text-violet-400">Administration InfraRed</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Dashboard</h1><p className="mt-1 text-sm text-slate-400">Bienvenue sur votre espace de gestion InfraRed Optic Store.</p></div>

    {newOrderCount>0&&<Link href="/admin/notifications/commandes" className="mb-5 flex items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/10 p-4"><span><strong className="block">{newOrderCount} nouvelle(s) commande(s)</strong><span className="mt-1 block text-xs text-stone">Ouvrez les commandes pour les confirmer, les imprimer et préparer la livraison.</span></span><ArrowRight className="text-red"/></Link>}

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.filter((stat) => can(user, stat.permission)).map((stat) => <Link key={stat.label} href={stat.href} className={`${panel} group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-slate-600`}><span className={`grid h-13 w-13 place-items-center rounded-xl bg-gradient-to-br ${stat.tone} shadow-lg`}><stat.icon size={25}/></span><span><span className="text-sm text-slate-300">{stat.label}</span><strong className="mt-1 block text-3xl leading-none">{stat.value.toLocaleString("fr-TN")}</strong><span className={`mt-2 flex items-center gap-1 text-xs ${stat.accent}`}>Voir les détails <ArrowRight size={12}/></span></span></Link>)}
    </div>

    <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
        <section className={`${panel} flex flex-wrap items-center gap-3 p-4`}><span className="mr-auto flex items-center gap-3"><span className="text-violet-400"><Sparkles/></span><span><strong className="block">Actions rapides</strong><span className="text-xs text-slate-400">Accédez aux tâches courantes</span></span></span>
          {can(user, "models.create") && <Link href="/admin/modeles/nouveau" className="flex min-h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-semibold"><Plus size={17}/>Ajouter modèle</Link>}
          {can(user, "products.create") && <Link href="/admin/produits/nouveau" className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-700 px-4 text-sm"><Plus size={17}/>Ajouter article</Link>}
          {can(user, "brands.manage") && <Link href="/admin/marques" className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-700 px-4 text-sm"><Plus size={17}/>Ajouter marque</Link>}
          {can(user, "stock.edit") && <Link href="/admin/stocks" className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-700 px-4 text-sm"><Package size={17}/>Gérer stock</Link>}
        </section>

        {can(user, "products.view") && <section className={panel}><div className="flex items-center justify-between border-b border-slate-800 p-5"><div><h2 className="font-semibold">Articles récents</h2><p className="mt-1 text-xs text-slate-400">Les derniers articles ajoutés ou modifiés</p></div><Link href="/admin/articles" className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-xs">Voir tout <ArrowRight size={13}/></Link></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-slate-800/40 text-slate-400"><tr>{["Photo", "Marque", "Modèle", "Référence", "Type", "Couleur", "Taille", ...(can(user, "prices.view") ? ["Prix (TND)"] : []), ...(can(user, "stock.view") ? ["Stock"] : []), "Statut", ""].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-800">{recent.map((product) => <tr key={product.id}><td className="px-4 py-2"><span className="relative block h-10 w-16 overflow-hidden rounded-md bg-white">{product.images[0] && <ManagedImage src={product.images[0].url} alt={product.images[0].alt ?? product.name} fill sizes="64px" className="object-contain"/>}</span></td><td className="px-4 py-2">{product.brand.name}</td><td className="px-4 py-2 font-medium">{product.productModel?.code ?? "Ancien article"}</td><td className="px-4 py-2 text-slate-300">{product.variantReference ?? product.reference}</td><td className="px-4 py-2">{product.type === "SUNGLASSES" || product.category.slug === "solaires" ? "Solaire" : "Optique"}</td><td className="px-4 py-2">{product.frameColorLabel ?? product.color ?? "—"}</td><td className="px-4 py-2">{product.size ?? "—"}</td>{can(user, "prices.view") && <td className="px-4 py-2 whitespace-nowrap">{formatDT(product.price)}</td>}{can(user, "stock.view") && <td className="px-4 py-2"><span className={`rounded-md px-2 py-1 font-semibold ${product.stock !== null && product.stock <= threshold ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>{product.stock ?? "—"}</span></td>}<td className="px-4 py-2"><span className={`inline-flex items-center gap-1.5 ${product.published ? "text-emerald-400" : "text-slate-400"}`}><span className="h-2 w-2 rounded-full bg-current"/>{product.published ? "Actif" : "Brouillon"}</span></td><td className="px-4 py-2"><Link href={`/admin/produits/${product.id}`} aria-label={`Modifier ${product.name}`} className="text-lg text-slate-400">•••</Link></td></tr>)}</tbody></table></div></section>}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(260px,2fr)]">
          {can(user, "products.create") && <section className={`${panel} p-5`}><div className="mb-5 flex items-center gap-3"><Boxes className="text-violet-400"/><div><h2 className="font-semibold">Ajouter une variante</h2><p className="text-xs text-slate-400">Création rapide pour un modèle existant</p></div></div>{activeModels.length ? <ActionForm action={saveVariantAction.bind(null, null)} className="grid gap-4"><select name="productModelId" required aria-label="Modèle" className={input}><option value="">Sélectionner un modèle</option>{activeModels.map((model) => <option key={model.id} value={model.id}>{model.brand.name} · {model.code} · {model.name}</option>)}</select><input className={input} name="variantReference" required placeholder="Référence / code coloris *"/><VariantAttributeSelectors dark/><div className="grid gap-3 sm:grid-cols-2">{can(user, "prices.edit") && <input className={input} name="price" type="number" min="0" step="0.001" required placeholder="Prix TND *"/>}{can(user, "stock.edit") && <input className={input} name="stock" type="number" min="0" required placeholder="Stock *"/>}</div><input type="hidden" name="published" value="on"/><div><SubmitButton>Enregistrer la variante</SubmitButton></div></ActionForm> : <div className="rounded-xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">Créez d’abord un modèle pour utiliser l’ajout rapide. <Link href="/admin/modeles/nouveau" className="mt-3 block text-violet-400">Créer le premier modèle →</Link></div>}</section>}
          {can(user, "users.view") && <section className={`${panel} p-5`}><div className="mb-5 flex items-center gap-3"><ShieldCheck className="text-indigo-400"/><div><h2 className="font-semibold">Rôles et permissions</h2><p className="text-xs text-slate-400">Accès utilisateurs actifs</p></div></div><div className="divide-y divide-slate-800">{roles.map(({ role, count }) => <div key={role} className="flex items-center gap-3 py-3 text-sm"><span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/15 text-violet-400"><ShieldCheck size={16}/></span><span className="flex-1">{ROLE_LABELS[role]}</span><span className="rounded-full bg-violet-500/20 px-2.5 py-1 text-xs text-violet-300">{count}</span></div>)}</div>{can(user, "roles.manage") && <Link href="/admin/roles" className="mt-4 inline-flex items-center gap-1 text-xs text-violet-400">Gérer les permissions <ArrowRight size={13}/></Link>}</section>}
        </div>
      </div>

      <aside className="grid min-w-0 gap-4">
        {can(user, "stock.view") && <section className={panel}><div className="flex items-center justify-between border-b border-slate-800 p-5"><div className="flex items-center gap-3"><AlertTriangle className="text-amber-400" size={21}/><div><h2 className="font-semibold">Stock faible</h2><p className="text-xs text-slate-400">Quantité ≤ {threshold}</p></div></div><Link href="/admin/stocks?stock=low" className="text-xs">Voir tout</Link></div><div className="grid gap-2 p-3">{lowStock.map((product) => <Link key={product.id} href={`/admin/produits/${product.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-800/60"><span className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-white">{product.images[0] && <ManagedImage src={product.images[0].url} alt={product.images[0].alt ?? product.name} fill sizes="64px" className="object-contain"/>}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{product.productModel?.code ?? product.name}</strong><span className="block truncate text-xs text-slate-400">{product.variantReference ?? product.reference}</span></span><strong className="rounded-lg bg-red-500/15 px-3 py-2 text-red-400">{product.stock}</strong></Link>)}{!lowStock.length && <p className="p-4 text-sm text-slate-400">Aucun article sous le seuil.</p>}</div></section>}
        {can(user, "audit.view") && <section className={panel}><div className="flex items-center justify-between border-b border-slate-800 p-5"><div className="flex items-center gap-3"><TrendingUp className="text-violet-400" size={21}/><h2 className="font-semibold">Dernières activités</h2></div><Link href="/admin/journal" className="text-xs">Voir tout</Link></div><div className="divide-y divide-slate-800 p-3">{activities.map((activity) => <Link href="/admin/journal" key={activity.id} className="flex gap-3 rounded-lg px-2 py-3 hover:bg-slate-800/60"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400"/><span className="min-w-0 flex-1"><strong className="block text-xs">{activityLabels[activity.action] ?? activity.action}</strong><span className="mt-1 block truncate text-xs text-slate-400">{activity.actor?.name ?? "Système"} · {activity.entityType}</span></span><time className="shrink-0 text-[10px] text-slate-500">{activity.createdAt.toLocaleDateString("fr-TN")}</time></Link>)}{!activities.length && <p className="p-4 text-sm text-slate-400">Les prochaines actions apparaîtront ici.</p>}</div></section>}
        <section className={`${panel} p-5`}><div className="flex items-center gap-3"><CircleDollarSign className="text-violet-400"/><div className="min-w-0 flex-1"><h2 className="font-semibold">Vente en ligne</h2><p className="text-xs text-slate-400">État des parcours clients</p></div>{can(user, "settings.critical") && <Link href="/admin/configuration#ecommerce" className="text-xs text-violet-400">Configurer</Link>}</div><div className="mt-4 grid gap-2 text-xs">{[
          ["Panier", commerce.cart], ["Commandes", commerce.orders], ["Checkout", commerce.checkout], ["Paiement en ligne", commerce.onlinePayment], ["Paiement à la livraison", commerce.cashOnDelivery], ["Livraison", commerce.delivery], ["Retrait en boutique", commerce.storePickup]
        ].map(([label, enabled]) => <div key={String(label)} className="flex justify-between rounded-lg bg-slate-900/50 px-3 py-2"><span>{label}</span><span className={enabled ? "text-emerald-400" : "text-slate-500"}>{enabled ? "Activé" : "Désactivé"}</span></div>)}</div>{commerce.delivery && <p className="mt-3 text-xs text-slate-400">Livraison : {commerce.deliveryFee.toFixed(3)} TND</p>}</section>
      </aside>
    </div>
  </AdminShell>;
}
