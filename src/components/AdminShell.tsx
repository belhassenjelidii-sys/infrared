import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Archive, ArrowUpRight, Bell, Boxes, CalendarDays, ClipboardList, CreditCard, FileImage, Glasses,
  Image as ImageIcon, Layers3, LayoutDashboard, LogOut, Menu, Package, Percent,
  KeyRound, MapPin, Search, Settings, ShieldCheck, ShoppingCart, SlidersHorizontal, Sparkles, Store,
  Tags, TrendingUp, Truck, Users, UsersRound,
} from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { getSession } from "@/lib/auth";
import { can, ROLE_LABELS, type StaffRole, type Permission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { effectiveFeatures, featureLabel, type Features } from "@/lib/features";
import AdminThemeToggle from "@/components/AdminThemeToggle";

type NavItem = { href?: string; label: string; permission: Permission; icon: LucideIcon; disabled?: boolean; status?: string };
const navigation = (features: Features): { label: string; items: NavItem[] }[] => [
  { label: "", items: [{ href: "/admin", label: "Vue d’ensemble", permission: "dashboard.view", icon: LayoutDashboard }] },
  { label: "Catalogue", items: [
    { href: "/admin/articles", label: "Articles", permission: "products.view", icon: Glasses },
    { href: "/admin/modeles", label: "Modèles", permission: "models.view", icon: Boxes },
    { href: "/admin/marques", label: "Marques", permission: "brands.manage", icon: Tags },
    { href: "/admin/categories", label: "Catégories", permission: "categories.manage", icon: Layers3 },
    { href: "/admin/stocks", label: "Stocks", permission: "stock.view", icon: Package },
    { href: "/admin/articles?status=archived", label: "Archives", permission: "products.view", icon: Archive },
  ] },
  { label: "Contenu", items: [
    { href: "/admin/parametres/tendances", label: "Tendances", permission: "content.manage", icon: TrendingUp },
    { href: "/admin/parametres/nouveautes", label: "Nouveautés", permission: "content.manage", icon: Sparkles },
    { href: "/admin/parametres/hero", label: "Bannières", permission: "content.manage", icon: ImageIcon },
    { href: "/admin/medias", label: "Médias", permission: "images.manage", icon: FileImage },
  ] },
  { label: "Ventes", items: [
    { href: features.orders ? "/admin/commandes" : "/admin/configuration#ecommerce", label: "Commandes", permission: "orders.view", icon: ShoppingCart, status: featureLabel(features.orders) },
    { href: features.orders ? "/admin/clients" : "/admin/configuration#ecommerce", label: "Clients", permission: "orders.view", icon: UsersRound, status: featureLabel(features.orders) },
    { href: "/admin/promotions", label: "Promotions", permission: "promotions.manage", icon: Percent },
  ] },
  { label: "", items: [{ href: "/admin/boutiques", label: "Boutiques", permission: "stores.view", icon: Store }] },
  { label: "Administration", items: [
    { href: "/admin/securite", label: "Sécurité du compte", permission: "dashboard.view", icon: KeyRound },
    { href: "/admin/utilisateurs", label: "Utilisateurs", permission: "users.view", icon: Users },
    { href: "/admin/roles", label: "Rôles / Permissions", permission: "roles.manage", icon: ShieldCheck },
    { href: "/admin/journal", label: "Journal", permission: "audit.view", icon: ClipboardList },
  ] },
  { label: "Paramètres", items: [
    { href: "/admin/parametres", label: "Général", permission: "content.manage", icon: Settings },
    { href: "/admin/configuration", label: "Catalogue", permission: "settings.manage", icon: SlidersHorizontal },
    { href: "/admin/adresses", label: "Adresses", permission: "settings.manage", icon: MapPin },
    { href: "/admin/livraison", label: "Livraison", permission: "settings.critical", icon: Truck, status: featureLabel(features.delivery || features.storePickup) },
    { href: "/admin/paiements", label: "Paiement", permission: "payments.manage", icon: CreditCard, status: featureLabel(features.cashOnDelivery || features.onlinePayment || features.storePickup) },
    { href: "/admin/seo", label: "SEO", permission: "seo.manage", icon: Search },
  ] },
];

export default async function AdminShell({ active, children }: { active: string; children: React.ReactNode; name?: string; email?: string; role?: string }) {
  const user = await getSession();
  const [settings, notificationUser] = await Promise.all([
    prisma.storeSettings.findUnique({ where: { singletonKey: "main" }, select: { features: true } }).catch(() => null),
    user?.userId && can(user, "orders.view") ? prisma.user.findUnique({ where: { id: user.userId }, select: { orderNotificationsSeenAt: true } }).catch(() => null) : Promise.resolve(null),
  ]);
  const newOrderCount = user?.userId && can(user, "orders.view")
    ? await prisma.order.count({ where: notificationUser?.orderNotificationsSeenAt ? { createdAt: { gt: notificationUser.orderNotificationsSeenAt } } : undefined }).catch(() => 0)
    : 0;
  const features = effectiveFeatures(settings?.features);
  const groups = navigation(features);
  const allowed = groups.map((group) => ({ ...group, items: group.items.filter((item) => can(user, item.permission)) })).filter((group) => group.items.length);
  const nav = (
    <nav aria-label="Administration" className="space-y-5">
      {allowed.map((group, groupIndex) => <div key={`${group.label}-${groupIndex}`}>
        {group.label && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500">{group.label}</p>}
        <div className="grid gap-1">
          {group.items.map((item) => {
            const Icon = item.icon;
            const selected = item.href === active;
            const content = <><Icon size={17} aria-hidden/><span>{item.label}</span>{item.status && <span className={`ml-auto rounded px-1.5 py-0.5 text-[9px] uppercase ${item.status === "Activé" ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>{item.status}</span>}</>;
            return item.disabled
              ? <span key={item.label} aria-disabled="true" className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm text-slate-600">{content}</span>
              : <Link key={`${item.href}-${item.label}`} href={item.href!} aria-current={selected ? "page" : undefined} className={`flex min-h-10 items-center gap-3 rounded-lg border-l-2 px-3 text-sm transition ${selected ? "border-violet-500 bg-violet-500/20 font-semibold text-white" : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"}`}>{content}</Link>;
          })}
        </div>
      </div>)}
    </nav>
  );
  const date = new Intl.DateTimeFormat("fr-TN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

  return <div className="admin-surface min-h-screen bg-[#07111d] text-slate-100">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 overflow-y-auto border-r border-slate-800 bg-[#09131f] px-4 py-6 lg:block">
      <Link href="/admin" className="mb-8 flex items-center gap-3 px-2 text-white"><span className="grid h-11 w-11 place-items-center rounded-xl bg-red/15 text-red"><Glasses size={27}/></span><span className="text-xl font-bold leading-tight">InfraRed<span className="block text-sm font-normal text-slate-400">Optic Store</span></span></Link>
      {nav}
      <Link href="/" className="mt-8 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-xs text-slate-300"><span><span className="mb-1 block text-emerald-400">● Boutique en ligne</span>infrared-optic.tn</span><ArrowUpRight size={16}/></Link>
    </aside>
    <div className="min-w-0 lg:pl-64">
      <header className="sticky top-0 z-20 flex min-h-20 items-center gap-4 border-b border-slate-800 bg-[#07111d]/95 px-4 backdrop-blur sm:px-7">
        <form action="/admin" className="relative hidden max-w-xl flex-1 md:block"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/><input name="q" aria-label="Rechercher dans le catalogue" placeholder="Rechercher un article, un modèle, une référence…" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 pl-11 pr-4 text-sm text-white placeholder:text-slate-500"/></form>
        <div className="ml-auto flex items-center gap-3">
          <AdminThemeToggle />
          {can(user, "orders.view") && <Link href="/admin/notifications/commandes" aria-label={`${newOrderCount} nouvelle(s) notification(s) de commande`} className="relative grid h-10 w-10 place-items-center rounded-lg text-slate-300 hover:bg-slate-800"><Bell size={19}/>{newOrderCount>0&&<span className="absolute right-0 top-0 grid min-h-5 min-w-5 place-items-center rounded-full bg-red px-1 text-[10px] font-bold text-white">{newOrderCount>99?"99+":newOrderCount}</span>}</Link>}
          <div className="hidden border-l border-slate-800 pl-4 sm:block"><p className="text-sm font-semibold">{user?.name}</p><p className="text-xs text-slate-400">{ROLE_LABELS[user?.role as StaffRole] ?? "Équipe InfraRed"}</p></div>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-slate-600 to-indigo-700 text-sm font-bold">{user?.name?.split(/\s+/).slice(0,2).map((part) => part[0]).join("").toUpperCase() || "IR"}</div>
          <form action={logoutAction}><button aria-label="Déconnexion" className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red"><LogOut size={18}/></button></form>
        </div>
        <div className="hidden items-center gap-2 text-xs capitalize text-slate-500 xl:flex"><CalendarDays size={15}/>{date}</div>
      </header>
      <details className="border-b border-slate-800 bg-[#09131f] px-5 py-3 text-white lg:hidden"><summary className="flex cursor-pointer items-center gap-2 text-sm"><Menu size={20}/>Menu de gestion</summary><div className="py-5">{nav}</div></details>
      <main className="mx-auto max-w-[1700px] px-4 py-6 sm:px-7">{children}</main>
    </div>
  </div>;
}

