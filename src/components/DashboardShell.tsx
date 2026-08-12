import { AlertTriangle, LogOut } from "lucide-react";
import Logo from "./Logo";

export type DashboardNavItem = {
  label: string;
  active?: boolean;
};

export default function DashboardShell({
  role,
  nav,
  notice,
  children,
}: {
  role: string;
  nav: DashboardNavItem[];
  notice: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-mist">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-white lg:block">
        <div className="border-b border-line px-5 py-5">
          <Logo mark className="h-8" />
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          {nav.map((item) => (
            <span
              key={item.label}
              title={item.active ? undefined : "Bientôt — nécessite le backend"}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                item.active
                  ? "bg-red-soft text-red"
                  : "cursor-not-allowed text-ink/35"
              }`}
            >
              {item.label}
            </span>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <div className="flex items-center justify-between border-b border-line bg-white px-5 py-4 sm:px-8">
          <div>
            <p className="text-sm font-medium">{role} — accès de démonstration</p>
            <p className="text-xs text-stone">Aucune vraie session, données en lecture seule</p>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-stone">
            <LogOut size={13} /> Déconnexion (désactivé)
          </span>
        </div>

        <div className="px-5 py-8 sm:px-8">
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red/30 bg-red-soft p-4 text-sm">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red" />
            <p className="text-ink/80">{notice}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
