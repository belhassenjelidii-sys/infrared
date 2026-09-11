import Link from "next/link";

export const HOME_ADMIN_SECTIONS = [
  { slug: "hero", label: "Hero" },
  { slug: "introduction", label: "Introduction" },
  { slug: "nos-maisons", label: "Nos maisons" },
  { slug: "categories", label: "Solaires & vue" },
  { slug: "nouveautes", label: "Nouveautés" },
  { slug: "tendances", label: "Dernières tendances" },
  { slug: "notre-selection", label: "Notre sélection" },
  { slug: "inspiration", label: "Inspirez-moi" },
  { slug: "classement", label: "Classement des blocs" },
  { slug: "footer", label: "Footer & contact" },
] as const;

export default function HomeSettingsNav({ active }: { active?: string }) {
  return <nav className="mb-7 flex gap-2 overflow-x-auto pb-2" aria-label="Réglages de la page d'accueil">
    {HOME_ADMIN_SECTIONS.map((item) => <Link key={item.slug} href={`/admin/parametres/${item.slug}`} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-colors ${active === item.slug ? "border-red bg-red text-white" : "border-line bg-white text-stone hover:border-red hover:text-red"}`}>{item.label}</Link>)}
  </nav>;
}
