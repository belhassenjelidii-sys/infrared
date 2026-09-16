import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/authz";
import AdminShell from "@/components/AdminShell";
import HeroMediaPicker from "@/components/HeroMediaPicker";
import SmtpSettingsForm from "@/components/SmtpSettingsForm";
import { updateSettingsAction, updateSmtpSettingsAction, sendSmtpTestEmailAction } from "./actions";
import { getSmtpSettingsView } from "@/lib/email";
import HomeSettingsNav from "@/components/HomeSettingsNav";
import ImageUploadField from "@/components/ImageUploadField";

export const dynamic = "force-dynamic";

type StoreHours = { day: string; hours: string };
type AboutStat = { title: string; text: string };

function parseHours(json: string | null | undefined): StoreHours[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const DEFAULT_ABOUT_STATS: AboutStat[] = [
  { title: "10+ ans d'expertise", text: "Une maison reconnue à Tunis." },
  { title: "Grandes marques", text: "Carrera, Ray-Ban, Vogue, Polaroid, Emporio Armani…" },
  { title: "Opticiens diplômés", text: "Examen de vue et montage sur mesure en boutique." },
];

function parseAboutStats(json: string | null | undefined): AboutStat[] {
  if (!json) return DEFAULT_ABOUT_STATS;
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_ABOUT_STATS;
    // Always show exactly 3 rows in the form, padding with blanks if needed.
    return [0, 1, 2].map((i) => parsed[i] ?? { title: "", text: "" });
  } catch {
    return DEFAULT_ABOUT_STATS;
  }
}

export default async function AdminSettingsPage() {
  const session = await requirePagePermission("content.manage");
  const s = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" } });
  const trend = s as (typeof s & { homeTrendEyebrow?: string | null; homeTrendTitle?: string | null; homeTrendProductIds?: string | null }) | null;
  const hours = parseHours(s?.hoursJson);
  const hoursWeekdays = hours.find((h) => h.day.toLowerCase().includes("samedi"))?.hours ?? "";
  const hoursSunday = hours.find((h) => h.day.toLowerCase().includes("dimanche"))?.hours ?? "";
  const aboutStats = parseAboutStats(s?.aboutStatsJson);
  const smtp = await getSmtpSettingsView();
  const canManageSmtp = can(session, "settings.critical");

  return (
    <AdminShell active="/admin/parametres" name={session?.name} email={session?.email} role={session?.role}>
      <p className="eyebrow text-red">Gestion</p>
      <h1 className="font-display mt-2 text-3xl">Accueil & paramètres</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone">
        Modifiez l&apos;affiche d&apos;accueil, les titres des catégories, la visibilité des prix et les coordonnées sans toucher au code.
      </p>
      <div className="mt-7 max-w-6xl rounded-2xl border border-line bg-white p-5">
        <p className="mb-4 text-sm font-medium">Gestion complète de la page d&apos;accueil</p>
        <HomeSettingsNav />
      </div>

      <form action={updateSettingsAction} className="mt-8 grid max-w-4xl gap-5 rounded-2xl border border-line bg-white p-5 sm:p-7">
        <h2 className="font-display text-xl">Accueil</h2>

        <HeroMediaPicker
          initialMediaType={s?.heroMediaType === "video" ? "video" : "image"}
          initialImageUrl={s?.heroImageUrl ?? null}
          initialVideoUrl={s?.heroVideoUrl ?? null}
          initialScale={s?.heroMediaScale ?? 125}
          initialX={s?.heroMediaX ?? 0}
          initialY={s?.heroMediaY ?? 0}
          initialTitle={s?.heroTitle}
          initialSubtitle={s?.heroSubtitle}
          initialCta={s?.heroCtaLabel}
        />

        <div>
          <label className="text-sm font-medium">Titre principal</label>
          <input name="heroTitle" defaultValue={s?.heroTitle ?? "Découvrez votre prochaine paire."} className="mt-1 min-h-11 w-full rounded-lg border border-line px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium">Sous-titre</label>
          <textarea name="heroSubtitle" defaultValue={s?.heroSubtitle ?? ""} rows={3} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Texte du bouton principal</label>
            <input name="heroCtaLabel" defaultValue={s?.heroCtaLabel ?? "Découvrir nos lunettes"} className="mt-1 min-h-11 w-full rounded-lg border border-line px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Couleur d&apos;accent</label>
            <input type="color" name="accentColor" defaultValue={s?.accentColor ?? "#E0122C"} className="mt-1 h-11 w-full rounded-lg border border-line" />
          </div>
        </div>

        <div className="border-t border-line pt-5">
          <h3 className="font-display text-lg">Bloc « Dernières tendances »</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input name="homeTrendEyebrow" defaultValue={trend?.homeTrendEyebrow ?? "Mode"} placeholder="Petit titre" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
            <input name="homeTrendTitle" defaultValue={trend?.homeTrendTitle ?? "Les dernières tendances"} placeholder="Titre" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
          </div>
          <input name="homeTrendProductIds" defaultValue={trend?.homeTrendProductIds ?? ""} placeholder="Slugs de 2 produits, séparés par des virgules" className="mt-4 min-h-11 w-full rounded-lg border border-line px-3 py-2 text-sm" />
          <p className="mt-1 text-xs text-stone">L’ordre saisi détermine l’ordre d’affichage.</p>
        </div>

        <div className="border-t border-line pt-5">
          <h3 className="font-display text-lg">Titres des cartes d&apos;accueil</h3>
          <p className="mt-1 text-xs text-stone">Ces titres peuvent être changés sans renommer les catégories internes.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <input name="categoryTitleSolaires" defaultValue={s?.categoryTitleSolaires ?? "Lunettes solaires"} placeholder="Lunettes solaires" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
            <input name="categoryTitleOptiques" defaultValue={s?.categoryTitleOptiques ?? "Lunettes optiques"} placeholder="Lunettes optiques" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
            <input name="categoryTitleNouveautes" defaultValue={s?.categoryTitleNouveautes ?? "Nouveautés"} placeholder="Nouveautés" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
          </div>
        </div>

        {can(session,"prices.edit") && <label className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-line bg-mist px-4">
          <span>
            <span className="block text-sm font-medium">Afficher les prix sur le site</span>
            <span className="block text-xs text-stone">Désactivez pour cacher les prix sur les pages publiques.</span>
          </span>
          <input type="checkbox" name="showPrices" defaultChecked={s?.showPrices ?? true} className="h-5 w-5 accent-red" />
        </label>}

        <div className="border-t border-line pt-5">
          <h3 className="font-display text-lg">Coordonnées</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input name="phone" defaultValue={s?.phone ?? ""} placeholder="Téléphone principal" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
            <input name="whatsapp" defaultValue={s?.whatsapp ?? ""} placeholder="WhatsApp : 216XXXXXXXX" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
            <input name="instagram" defaultValue={s?.instagram ?? ""} placeholder="Instagram URL" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
            <input name="facebook" defaultValue={s?.facebook ?? ""} placeholder="Facebook URL" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
            <input name="address" defaultValue={s?.address ?? ""} placeholder="Adresse principale" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm sm:col-span-2" />
            <input name="mapsUrl" defaultValue={s?.mapsUrl ?? ""} placeholder="Lien Google Maps" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm sm:col-span-2" />
          </div>
          <div className="mt-5 grid gap-4 rounded-xl border border-line bg-mist p-4">
            <ImageUploadField name="logoUrl" initialUrl={s?.logoUrl} label="Logo principal du site (HD)" folder="settings" preserveOriginal compact />
            <label className="grid gap-2 text-sm font-medium">Taille du logo dans l’en-tête : {s?.logoHeight ?? 42}px<input type="range" name="logoHeight" min="28" max="80" defaultValue={s?.logoHeight ?? 42} className="accent-red" /></label>
            <p className="text-xs text-stone">Le fichier original haute définition est conservé. Le réglage change uniquement sa taille d’affichage.</p>
          </div>
        </div>

        <div className="border-t border-line pt-5">
          <h3 className="font-display text-lg">Horaires</h3>
          <p className="mt-1 text-xs text-stone">Affichés sur le footer, la page Boutiques et la page Contact.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input name="hoursWeekdays" defaultValue={hoursWeekdays || "9h30 – 19h30"} placeholder="Lundi – Samedi" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
            <input name="hoursSunday" defaultValue={hoursSunday || "Fermé"} placeholder="Dimanche" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="border-t border-line pt-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg">Bandeau &laquo; Pourquoi InfraRed &raquo;</h3>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="aboutEnabled" defaultChecked={s?.aboutEnabled ?? true} />
              Afficher sur le site
            </label>
          </div>
          <p className="mt-1 text-xs text-stone">
            Affiché en haut du footer, sur toutes les pages du site — décochez pour le masquer complètement sans perdre le contenu ci-dessous.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input name="aboutEyebrow" defaultValue={s?.aboutEyebrow ?? "Depuis 2012"} placeholder="Petit texte (ex. Depuis 2012)" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
            <input name="aboutTitle" defaultValue={s?.aboutTitle ?? "L'opticien InfraRed, à Tunis"} placeholder="Titre" className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm" />
          </div>
          <textarea
            name="aboutText"
            defaultValue={
              s?.aboutText ??
              "Plus de 10 ans d'expertise optique, une sélection exigeante des plus grandes marques et un conseil personnalisé dans chacune de nos boutiques."
            }
            rows={2}
            placeholder="Paragraphe"
            className="mt-4 w-full rounded-lg border border-line px-3 py-2 text-sm"
          />

          <p className="mt-5 text-xs font-medium text-stone">3 points forts affichés à côté</p>
          <div className="mt-2 space-y-3">
            {aboutStats.map((stat, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr]">
                <input
                  name={`aboutStatTitle${i}`}
                  defaultValue={stat.title}
                  placeholder={`Titre point ${i + 1}`}
                  className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm"
                />
                <input
                  name={`aboutStatText${i}`}
                  defaultValue={stat.text}
                  placeholder={`Description point ${i + 1}`}
                  className="min-h-11 rounded-lg border border-line px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <button className="min-h-12 rounded-full bg-red px-6 text-sm font-medium text-white hover:bg-red-dark">Enregistrer les modifications</button>
      </form>

      {canManageSmtp && (
        <div className="mt-5 max-w-4xl">
          <SmtpSettingsForm
            action={updateSmtpSettingsAction}
            testAction={sendSmtpTestEmailAction}
            initialProvider={smtp.provider}
            initialHost={smtp.host}
            initialPort={smtp.port}
            initialSecure={smtp.secure}
            initialUser={smtp.user}
            initialFromEmail={smtp.fromEmail}
            initialFromName={smtp.fromName}
            passwordConfigured={smtp.passwordConfigured}
          />
        </div>
      )}
    </AdminShell>
  );
}
