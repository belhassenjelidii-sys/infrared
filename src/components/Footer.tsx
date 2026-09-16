import Link from "next/link";
import { AtSign, MapPin, Phone, MessageCircle, Award, Glasses, ShieldCheck } from "lucide-react";
import Logo from "./Logo";
import { getSiteSettings, getDbStores } from "@/lib/site-data";
import { buildWhatsAppLink, generateGeneralWhatsAppMessage } from "@/lib/whatsapp";

const STAT_ICONS = [Award, Glasses, ShieldCheck];

export default async function Footer() {
  const settings = await getSiteSettings();
  const stores = await getDbStores({ fallbackHours: settings.hours });
  const phoneDisplay = settings.phone || stores[0]?.mobile || "";
  const telHref = (settings.phone || stores[0]?.mobile || "").replace(/[^0-9+]/g, "");
  const waLink = buildWhatsAppLink(settings.whatsapp, generateGeneralWhatsAppMessage());

  return (
    <footer className="border-t border-black/70 bg-[#0c1016] text-white">
      {/* "Pourquoi InfraRed" — entièrement modifiable (et masquable) depuis /admin/parametres */}
      {settings.aboutEnabled && (
        <div className="border-b border-white/10 bg-white/[0.02]">
          <div className="mx-auto grid max-w-[1400px] gap-5 px-5 py-6 sm:px-8 lg:grid-cols-3">
            <div>
              <p className="eyebrow text-red">{settings.aboutEyebrow}</p>
              <h2 className="font-display mt-2 text-2xl sm:text-3xl">{settings.aboutTitle}</h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">{settings.aboutText}</p>
            </div>
            {settings.aboutStats.map((stat, i) => {
              const Icon = STAT_ICONS[i % STAT_ICONS.length];
              return (
                <div key={stat.title} className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-red">
                    <Icon size={19} />
                  </div>
                  <div>
                    <p className="font-display text-sm">{stat.title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/70">{stat.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-[1400px] items-start gap-x-7 gap-y-6 px-5 py-7 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.05fr_0.78fr_1.3fr_0.95fr] lg:gap-x-8 lg:gap-y-5">
        <div>
          <Logo variant="reversed" src={settings.logoUrl} height={Math.min(settings.logoHeight, 48)} />
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/80">
            Opticien premium. Montures solaires et optiques
            sélectionnées avec exigence, conseil personnalisé dans nos
            boutiques.
          </p>
          <div className="mt-4 flex gap-3">
            {settings.facebook && (
              <a
                href={settings.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook InfraRed Optic-Store"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 transition-all duration-300 hover:border-red hover:bg-red hover:-translate-y-0.5"
              >
                <span className="text-sm font-semibold">f</span>
              </a>
            )}
            {settings.instagram && (
              <a
                href={settings.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram InfraRed Optic-Store"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 transition-all duration-300 hover:border-red hover:bg-red hover:-translate-y-0.5"
              >
                <AtSign size={15} />
              </a>
            )}
          </div>
        </div>

        <div>
          <p className="eyebrow text-white/85">Navigation</p>
          <ul className="mt-3 space-y-2.5 text-sm text-white/85">
            <li><Link href="/catalogue" className="transition-colors hover:text-red">Lunettes</Link></li>
            <li><Link href="/marques" className="transition-colors hover:text-red">Marques</Link></li>
            {settings.showPrices && <li><Link href="/promotions" className="transition-colors hover:text-red">Promotions</Link></li>}
            <li><Link href="/nouveautes" className="transition-colors hover:text-red">Nouveautés</Link></li>
            <li><Link href="/guide" className="transition-colors hover:text-red">Guide des tailles</Link></li>
            <li><Link href="/boutique" className="transition-colors hover:text-red">Nos boutiques</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow text-white/85">Nos boutiques</p>
          <ul className="mt-3 space-y-1.5 text-sm leading-5 text-white/85">
            {stores.length === 0 && (
              <li className="text-white/40">Boutiques à venir — ajoutez-les depuis /admin/boutiques.</li>
            )}
            {stores.map((s) => (
              <li key={s.id}>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="shrink-0 text-red" />
                  <Link href={`/boutique/${s.slug}`} className="font-medium text-white transition-colors hover:text-red">{s.name}</Link>
                  <span className={`ml-auto inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.liveStatus === "open" ? "bg-emerald-400/15 text-emerald-300" : s.liveStatus === "closed" ? "bg-red/15 text-red" : "bg-white/10 text-white/50"}`}>{s.statusLabel}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow text-white/85">Contact</p>
          <ul className="mt-3 space-y-1.5 text-sm text-white/85">
            {phoneDisplay && (
              <li className="flex items-center gap-2">
                <Phone size={16} className="shrink-0 text-red" />
                <a href={`tel:${telHref}`} className="transition-colors hover:text-red">
                  {phoneDisplay}
                </a>
              </li>
            )}
            {waLink && (
              <li className="flex items-center gap-2">
                <MessageCircle size={16} className="shrink-0 text-red" />
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-red"
                >
                  WhatsApp
                </a>
              </li>
            )}
          </ul>

        </div>
      </div>

      <div className="border-t border-white/10 bg-black/20 px-5 py-3 text-center text-xs text-white/65 sm:px-8">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between sm:px-2">
          <span>© {new Date().getFullYear()} InfraRed Optic-Store. Tous droits réservés.</span>
          <span className="flex gap-4">
            <Link href="/mentions-legales" className="hover:text-white/70">Mentions légales</Link>
            <Link href="/confidentialite" className="hover:text-white/70">Confidentialité</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
