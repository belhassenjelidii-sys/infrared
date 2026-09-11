"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, HelpCircle, MapPin, MessageCircle, Search, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import Logo from "./Logo";
import SearchBox from "./SearchBox";
import type { Brand, CatalogProduct } from "@/types";
import type { DbStore } from "@/lib/site-data";
import { buildWhatsAppLink, generateGeneralWhatsAppMessage } from "@/lib/whatsapp";

type HeaderProps = {
  brands: Brand[];
  stores: DbStore[];
  newProducts: CatalogProduct[];
  promoProducts: CatalogProduct[];
  showPrices: boolean;
  whatsapp: string | null;
  cartEnabled: boolean;
  cartCount: number;
  logoUrl?: string | null;
  logoHeight?: number;
};

const PUBLIC = [
  { label: "Femme", href: "/catalogue?target=Femme" },
  { label: "Homme", href: "/catalogue?target=Homme" },
  { label: "Enfant", href: "/catalogue?target=Enfant" },
  { label: "Mixte", href: "/catalogue?target=Mixte" },
];

export default function Header({ brands, stores, showPrices, whatsapp, cartEnabled, cartCount, logoUrl, logoHeight = 42 }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuPage, setMenuPage] = useState<MenuPage>("root");
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const whatsappLink = buildWhatsAppLink(whatsapp, generateGeneralWhatsAppMessage());

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white">
      <div className="relative mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-4 sm:px-7 lg:h-[114px]">
        <div className="flex items-center gap-5 lg:gap-8">
          <button type="button" onClick={() => { setMenuPage("root"); setOpen(true); }} className="group flex items-center gap-3 text-[13px] text-black/80" aria-label="Ouvrir le menu">
            <svg aria-hidden="true" viewBox="0 0 32 24" width="29" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" shapeRendering="geometricPrecision"><path d="M1 2.5h30M1 12h30M1 21.5h30" /></svg>
            <span className="hidden lg:inline group-hover:text-red">Menu</span>
          </button>
          <div className="hidden items-center lg:flex">
            <AnimatePresence initial={false} mode="wait">
              {searchOpen ? <motion.div key="search-field" initial={{ opacity: 0, width: 90 }} animate={{ opacity: 1, width: 245 }} exit={{ opacity: 0, width: 90 }} className="overflow-visible"><SearchBox variant="compact" showPrices={showPrices} autoFocus /></motion.div> : <motion.button key="search-trigger" type="button" onClick={() => setSearchOpen(true)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 py-2 text-[13px] text-black/80 hover:text-red" aria-label="Ouvrir la recherche"><Search size={25} strokeWidth={1.35}/><span>Rechercher</span></motion.button>}
            </AnimatePresence>
          </div>
        </div>

        <Link href="/" aria-label="Accueil InfraRed Optic-Store" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Logo src={logoUrl} height={logoHeight} />
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/contact" className="hidden text-black/60 transition-colors hover:text-red sm:block" aria-label="Aide et contact"><HelpCircle size={25} strokeWidth={1.25} /></Link>
          {whatsappLink && <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hidden text-black/60 transition-colors hover:text-red sm:block" aria-label="WhatsApp"><MessageCircle size={26} strokeWidth={1.25} /></a>}
          {cartEnabled && <Link href="/panier" className="relative text-black/60 transition-colors hover:text-red" aria-label={`Panier, ${cartCount} article(s)`}><svg aria-hidden="true" viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>{cartCount > 0 && <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-red px-1 text-[10px] font-semibold text-white">{Math.min(cartCount,99)}</span>}</Link>}
          <Link href="/boutique" className="text-black/60 transition-colors hover:text-red" aria-label="Nos boutiques"><MapPin size={26} strokeWidth={1.25} /></Link>
        </div>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.button type="button" aria-label="Fermer le menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-[9998] bg-black/35" />
              <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-y-0 left-0 z-[9999] w-full overflow-y-auto bg-white shadow-[18px_0_50px_rgba(0,0,0,.12)] sm:max-w-[420px]">
                <div className="flex h-[86px] items-center justify-between border-b border-black/10 px-6 sm:px-8">
                  <Logo src={logoUrl} height={36} />
                  <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center text-black/70 transition-colors hover:text-red" aria-label="Fermer"><X size={25} strokeWidth={1.25} /></button>
                </div>
                <div className="border-b border-black/10 lg:hidden"><SearchBox variant="full" showPrices={showPrices} onNavigate={() => setOpen(false)} /></div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={menuPage} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: .18 }} className="px-6 py-7 sm:px-8 sm:py-9">
                    {menuPage === "root" ? <RootMenu onOpen={setMenuPage} onNavigate={() => setOpen(false)} showPrices={showPrices} /> : <SubMenu page={menuPage} brands={brands} stores={stores} onBack={() => setMenuPage("root")} onNavigate={() => setOpen(false)} />}
                  </motion.div>
                </AnimatePresence>
              </motion.aside>
            </>
          )}
        </AnimatePresence>, document.body
      )}
    </header>
  );
}

type MenuPage = "root" | "new" | "solar" | "optical" | "public" | "brands" | "stores";
function RootMenu({ onOpen, onNavigate, showPrices }: { onOpen: (page: Exclude<MenuPage, "root">) => void; onNavigate: () => void; showPrices: boolean }) {
  return <nav aria-label="Menu principal" className="grid">{[
    { label: "Nouveautés", page: "new" as const },
    { label: "Lunettes de soleil", page: "solar" as const },
    { label: "Lunettes de vue", page: "optical" as const },
    { label: "Pour qui ?", page: "public" as const },
    { label: "Marques", page: "brands" as const },
    { label: "Nos boutiques", page: "stores" as const },
  ].map((item) => <button key={item.label} type="button" onClick={() => onOpen(item.page)} className="group flex items-center justify-between border-b border-black/10 py-[19px] text-left text-[13px] tracking-[0.12em] text-black/80 transition-colors hover:text-red"><span>{item.label}</span><ChevronRight size={17} strokeWidth={1.3} className="transition-transform group-hover:translate-x-1" /></button>)}
    <div className="mt-8 grid gap-4 border-t border-black/10 pt-7">{showPrices && <Link href="/promotions" onClick={onNavigate} className="text-[12px] tracking-[0.12em] text-red hover:underline">Promotions</Link>}<Link href="/contact" onClick={onNavigate} className="text-[12px] tracking-[0.12em] text-black/70 hover:text-red">Contact</Link></div>
  </nav>;
}

function SubMenu({ page, brands, stores, onBack, onNavigate }: { page: Exclude<MenuPage, "root">; brands: Brand[]; stores: DbStore[]; onBack: () => void; onNavigate: () => void }) {
  const category = page === "solar" ? "solaires" : page === "optical" ? "optiques" : "";
  const title = page === "new" ? "Nouveautés" : page === "solar" ? "Lunettes de soleil" : page === "optical" ? "Lunettes de vue" : page === "public" ? "Pour qui ?" : page === "brands" ? "Marques" : "Nos boutiques";
  const directLinks = page === "new" ? [
    { label: "Toutes les nouveautés", href: "/nouveautes" },
    { label: "Nouveautés solaires", href: "/catalogue?category=solaires&isNew=true" },
    { label: "Nouveautés optiques", href: "/catalogue?category=optiques&isNew=true" },
  ] : page === "public" ? PUBLIC : [];
  return <div><button type="button" onClick={onBack} className="mb-7 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-black/50 hover:text-red"><ChevronLeft size={16} /> Retour</button><div className="mb-5 flex items-end justify-between border-b border-black/15 pb-4"><h2 className="text-[13px] font-semibold uppercase tracking-[0.18em]">{title}</h2>{page === "brands" && <Link href="/marques" onClick={onNavigate} className="text-[10px] text-black/45 hover:text-red">Toutes</Link>}</div>{page === "brands" ? <div className="grid grid-cols-2">{brands.map((b) => <Link key={b.slug} href={`/marques/${b.slug}`} onClick={onNavigate} className="border-b border-black/8 py-3.5 text-[12px] uppercase tracking-[0.08em] text-black/75 hover:text-red">{b.name}</Link>)}</div> : page === "solar" || page === "optical" ? <div><Link href={`/catalogue?category=${category}`} onClick={onNavigate} className="flex items-center justify-between border-b border-black/10 py-4 text-[12px] font-semibold uppercase tracking-[0.1em] hover:text-red"><span>Voir toute la collection</span><ChevronRight size={16} /></Link><div className="grid grid-cols-2">{brands.map((brand) => <Link key={brand.slug} href={`/catalogue?category=${category}&brand=${brand.slug}`} onClick={onNavigate} className="border-b border-black/8 py-3.5 text-[12px] uppercase tracking-[0.08em] text-black/75 hover:text-red">{brand.name}</Link>)}</div></div> : page === "stores" ? <div className="grid gap-0">{stores.map((s) => <Link key={s.id} href={`/boutique/${s.slug}`} onClick={onNavigate} className="border-b border-black/8 py-4 text-[13px] text-black/70 hover:text-red">{s.name}</Link>)}</div> : <div className="grid">{directLinks.map((link) => <Link key={link.href} href={link.href} onClick={onNavigate} className="border-b border-black/8 py-4 text-[13px] uppercase tracking-[0.08em] text-black/75 hover:text-red">{link.label}</Link>)}</div>}</div>;
}
