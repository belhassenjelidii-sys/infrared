import { notFound } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import HomeSettingsNav, { HOME_ADMIN_SECTIONS } from "@/components/HomeSettingsNav";
import ImageUploadField from "@/components/ImageUploadField";
import InspirationForm from "@/components/InspirationForm";
import HeroMediaPicker from "@/components/HeroMediaPicker";
import { requirePagePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getHomeContent, HOME_SECTION_IDS } from "@/lib/home-content";
import { saveHomeSectionAction } from "../home-actions";

export const dynamic = "force-dynamic";

const SECTION_LABELS: Record<string, string> = { intro: "Introduction", brands: "Nos maisons", categories: "Solaires & vue", new: "Nouveautés", trends: "Dernières tendances", selection: "Notre sélection", inspiration: "Inspirez-moi", contact: "Footer & contact" };

function Field({ name, label, value }: { name: string; label: string; value: string }) { return <label className="grid gap-1 text-sm font-medium">{label}<input name={name} defaultValue={value} className="min-h-11 rounded-lg border border-line px-3 text-sm" /></label>; }
function ProductSlots({ products, values, count }: { products: { slug: string; name: string; brand: { name: string } | null }[]; values: string[]; count: number }) { return <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: count }, (_, i) => <label key={i} className="grid gap-1 text-sm font-medium">Position {i + 1}<select name={`product${i}`} defaultValue={values[i] ?? ""} className="min-h-11 rounded-lg border border-line bg-white px-3 text-sm"><option value="">Automatique / vide</option>{products.map((p) => <option key={p.slug} value={p.slug}>{p.brand?.name} — {p.name}</option>)}</select></label>)}</div>; }

function parseHours(raw?: string | null) {
  try {
    const rows = raw ? JSON.parse(raw) : [];
    return Array.isArray(rows) ? rows as { day?: string; hours?: string }[] : [];
  } catch { return []; }
}

export default async function HomeSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!HOME_ADMIN_SECTIONS.some((x) => x.slug === section)) notFound();
  const session = await requirePagePermission("content.manage");
  const [content, settings, products] = await Promise.all([
    getHomeContent(),
    prisma.storeSettings.findUnique({ where: { singletonKey: "main" } }),
    prisma.product.findMany({ where: { archived: false, published: true }, select: { slug: true, name: true, brand: { select: { name: true } } }, orderBy: [{ brand: { name: "asc" } }, { name: "asc" }] }),
  ]);
  const action = saveHomeSectionAction.bind(null, section);
  const hours = parseHours(settings?.hoursJson);
  const weekdays = hours.find((item) => item.day?.includes("Samedi"))?.hours ?? "";
  const sunday = hours.find((item) => item.day?.includes("Dimanche"))?.hours ?? "";

  return <AdminShell active="/admin/parametres" name={session.name} email={session.email} role={session.role}>
    <p className="eyebrow text-red">Page d’accueil</p><h1 className="font-display mt-2 text-3xl">{HOME_ADMIN_SECTIONS.find((x) => x.slug === section)?.label}</h1><p className="mt-2 text-sm text-stone">Chaque bloc est enregistré séparément et apparaît immédiatement sur la home.</p>
    <div className="mt-7"><HomeSettingsNav active={section} /></div>
    {section === "hero" ? <form action={action} className="grid max-w-4xl gap-5 rounded-2xl border border-line bg-white p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2"><Field name="heroTitle" label="Titre principal" value={settings?.heroTitle ?? ""} /><Field name="heroCtaLabel" label="Texte du bouton" value={settings?.heroCtaLabel ?? ""} /></div>
      <label className="grid gap-1 text-sm font-medium">Sous-titre<textarea name="heroSubtitle" defaultValue={settings?.heroSubtitle ?? ""} rows={3} className="rounded-lg border border-line p-3 text-sm" /></label>
      <HeroMediaPicker initialMediaType={settings?.heroMediaType === "video" ? "video" : "image"} initialImageUrl={settings?.heroImageUrl ?? null} initialVideoUrl={settings?.heroVideoUrl ?? null} initialScale={settings?.heroMediaScale ?? 125} initialX={settings?.heroMediaX ?? 0} initialY={settings?.heroMediaY ?? 0} />
      <button className="min-h-12 rounded-full bg-red px-6 text-sm font-medium text-white hover:bg-red-dark">Enregistrer le texte du Hero</button>
    </form> : section === "inspiration" ? <InspirationForm content={content} /> :
    <form action={action} className="grid max-w-4xl gap-5 rounded-2xl border border-line bg-white p-6 sm:p-8">
      {section === "introduction" && <><Field name="introEyebrow" label="Petit texte" value={content.introEyebrow} /><Field name="introTitle" label="Titre" value={content.introTitle} /></>}
      {section === "nos-maisons" && <><p className="rounded-xl bg-mist px-4 py-3 text-sm text-stone">Les logos et les photos de chaque marque se gèrent uniquement dans <strong>Marques</strong>. Ce réglage agit seulement sur la vitesse de défilement.</p><label className="grid gap-2 text-sm font-medium">Vitesse de la barre : {content.brandsSpeed} secondes<input type="range" name="brandsSpeed" min="6" max="80" defaultValue={content.brandsSpeed} /></label></>}
      {section === "categories" && <><div className="grid gap-4 sm:grid-cols-2"><Field name="solarTitle" label="Titre lunettes de soleil" value={content.solarTitle} /><Field name="opticalTitle" label="Titre lunettes de vue" value={content.opticalTitle} /></div><Field name="categoryCta" label="Texte Découvrir" value={content.categoryCta} /><div className="grid gap-6 sm:grid-cols-2"><ImageUploadField name="solarImage" initialUrl={content.solarImage} label="Affiche lunettes de soleil" folder="settings" /><ImageUploadField name="opticalImage" initialUrl={content.opticalImage} label="Affiche lunettes de vue" folder="settings" /></div></>}
      {section === "nouveautes" && <><div className="grid gap-4 sm:grid-cols-2"><Field name="newEyebrow" label="Petit titre" value={content.newEyebrow} /><Field name="newTitle" label="Titre" value={content.newTitle} /></div><ProductSlots products={products} values={content.newProductSlugs} count={12} /></>}
      {section === "tendances" && <>
        <div className="grid gap-4 sm:grid-cols-2"><Field name="trendsEyebrow" label="Petit titre" value={content.trendsEyebrow} /><Field name="trendsTitle" label="Titre" value={content.trendsTitle} /></div>
        <p className="rounded-xl bg-mist px-4 py-3 text-sm text-stone">Pour chaque emplacement, choisissez un article pour reprendre automatiquement sa photo, ou importez votre propre visuel. Le lien peut être différent pour chacun.</p>
        {[0, 1, 2].map((i) => <div key={i} className="grid gap-4 rounded-2xl border border-line p-5"><h3 className="font-display text-lg">Emplacement {i + 1} — {i < 2 ? (i === 0 ? "gauche en haut" : "gauche en bas") : "droite"}</h3><label className="grid gap-1 text-sm font-medium">Article du catalogue<select name={`product${i}`} defaultValue={content.trendProductSlugs[i] ?? ""} className="min-h-11 rounded-lg border border-line bg-white px-3 text-sm"><option value="">Aucun article / média personnalisé</option>{products.map((p) => <option key={p.slug} value={p.slug}>{p.brand?.name} — {p.name}</option>)}</select></label>{i === 0 ? <ImageUploadField name="trendImage1" initialUrl={content.trendImage1} label="Image personnalisée (prioritaire)" folder="settings" /> : i === 1 ? <ImageUploadField name="trendImage2" initialUrl={content.trendImage2} label="Image personnalisée (prioritaire)" folder="settings" /> : <ImageUploadField name="trendVideo" initialUrl={content.trendVideo} label="Vidéo personnalisée (prioritaire)" folder="settings" kind="video" />}<Field name={`trendLink${i}`} label="Lien spécifique au clic (vide = page de l’article)" value={content.trendLinks[i] ?? ""} /></div>)}
      </>}
      {section === "notre-selection" && <><div className="grid gap-4 sm:grid-cols-2"><Field name="selectionTitle" label="Titre" value={content.selectionTitle} /><Field name="selectionLinkLabel" label="Texte du lien" value={content.selectionLinkLabel} /></div><ProductSlots products={products} values={content.selectionProductSlugs} count={4} /></>}
      {section === "classement" && <><p className="text-sm text-stone">Choisissez l’ordre vertical des blocs de la home.</p>{Array.from({ length: HOME_SECTION_IDS.length }, (_, i) => <label key={i} className="grid gap-1 text-sm font-medium">Position {i + 1}<select name={`section${i}`} defaultValue={content.sectionOrder[i]} className="min-h-11 rounded-lg border border-line bg-white px-3">{HOME_SECTION_IDS.map((id) => <option key={id} value={id}>{SECTION_LABELS[id]}</option>)}</select></label>)}</>}
      {section === "footer" && <><div className="grid gap-4 sm:grid-cols-2"><Field name="contactEyebrow" label="Petit titre de contact" value={content.contactEyebrow} /><Field name="contactTitle" label="Titre de contact" value={content.contactTitle} /></div><label className="grid gap-1 text-sm font-medium">Texte de contact<textarea name="contactText" defaultValue={content.contactText} rows={4} className="rounded-lg border border-line p-3 text-sm" /></label><div className="border-t border-line pt-5"><h2 className="font-display text-xl">Coordonnées du footer</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field name="phone" label="Téléphone" value={settings?.phone ?? ""} /><Field name="whatsapp" label="WhatsApp" value={settings?.whatsapp ?? ""} /><Field name="instagram" label="Instagram" value={settings?.instagram ?? ""} /><Field name="facebook" label="Facebook" value={settings?.facebook ?? ""} /><Field name="address" label="Adresse" value={settings?.address ?? ""} /><Field name="mapsUrl" label="Lien Google Maps" value={settings?.mapsUrl ?? ""} /><Field name="hoursWeekdays" label="Horaires lundi–samedi" value={weekdays} /><Field name="hoursSunday" label="Horaires dimanche" value={sunday} /></div></div></>}
      <button className="min-h-12 rounded-full bg-red px-6 text-sm font-medium text-white hover:bg-red-dark">Enregistrer ce bloc</button>
    </form>}
  </AdminShell>;
}
