import Link from "next/link";
import { LogOut } from "lucide-react";
import Logo from "./Logo";
import { logoutAction } from "@/app/login/actions";

type Role = "ADMIN" | "COMMERCIAL" | "DEVELOPER";

// ADMIN/DEVELOPER see the full back office. COMMERCIAL (Marketing Digital
// & Commercial) only sees the content/marketing sections — pricing lives
// on /commercial, not here.
const NAV: { href: string; label: string; roles: Role[] }[] = [
  { href: "/admin", label: "Produits", roles: ["ADMIN", "DEVELOPER"] },
  { href: "/admin/marques", label: "Marques", roles: ["ADMIN", "DEVELOPER"] },
  { href: "/admin/categories", label: "Catégories", roles: ["ADMIN", "DEVELOPER"] },
  { href: "/admin/promotions", label: "Promotions", roles: ["ADMIN", "DEVELOPER"] },
  { href: "/admin/boutiques", label: "Boutiques", roles: ["ADMIN", "DEVELOPER", "COMMERCIAL"] },
  { href: "/admin/parametres", label: "Paramètres", roles: ["ADMIN", "DEVELOPER", "COMMERCIAL"] },
  { href: "/admin/utilisateurs", label: "Utilisateurs", roles: ["ADMIN", "DEVELOPER"] },
];

export default function AdminShell({
  active,
  name,
  email,
  role,
  children,
}: {
  active: string;
  name?: string;
  email?: string;
  role?: string;
  children: React.ReactNode;
}) {
  const items = NAV.filter((i) => !role || i.roles.includes(role as Role));

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-mist">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-white lg:block">
        <div className="border-b border-line px-5 py-5">
          <Logo mark />
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                item.href === active ? "bg-red-soft text-red" : "text-ink/70 hover:bg-mist"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <div className="flex items-center justify-between border-b border-line bg-white px-5 py-4 sm:px-8">
          <div>
            <p className="text-sm font-medium">
              {role === "DEVELOPER" ? "Développeur" : role === "COMMERCIAL" ? "Marketing Digital & Commercial" : "Administrateur"} — {name}
            </p>
            <p className="text-xs text-stone">{email}</p>
          </div>
          <form action={logoutAction}>
            <button className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-stone hover:border-red hover:text-red">
              <LogOut size={13} /> Déconnexion
            </button>
          </form>
        </div>
        <div className="px-5 py-8 sm:px-8">{children}</div>
      </div>
    </div>
  );
}
