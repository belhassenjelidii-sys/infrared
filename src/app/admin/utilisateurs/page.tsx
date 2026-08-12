import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import { createUserAction, toggleUserActiveAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getSession();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <AdminShell active="/admin/utilisateurs" name={session?.name} email={session?.email} role={session?.role}>
      <p className="eyebrow text-red">Gestion</p>
      <h1 className="font-display mt-2 text-3xl">Utilisateurs</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-mist text-left text-xs uppercase tracking-wide text-stone">
              <tr><th className="px-4 py-3">Nom</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Rôle</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Action</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-stone">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${u.role === "ADMIN" ? "bg-red-soft text-red" : "bg-mist text-stone"}`}>
                      {u.role === "ADMIN" ? "Admin" : u.role === "DEVELOPER" ? "Développeur" : "Marketing & Commercial"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${u.active ? "bg-emerald-50 text-emerald-700" : "bg-mist text-stone"}`}>{u.active ? "Actif" : "Désactivé"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={toggleUserActiveAction.bind(null, u.id, u.active)}>
                      <button disabled={u.id === session?.userId || u.role === "ADMIN"} className="rounded-full border border-line px-3 py-1.5 text-xs hover:border-red hover:text-red disabled:cursor-not-allowed disabled:opacity-40">
                        {u.active ? "Désactiver" : "Activer"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form action={createUserAction} className="h-fit space-y-3 rounded-2xl border border-line bg-white p-5">
          <h3 className="font-display text-lg">+ Nouvel utilisateur</h3>
          <input name="name" placeholder="Nom complet" required className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
          <input name="email" type="email" placeholder="Email" required className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
          <input name="password" type="password" placeholder="Mot de passe (8+ caractères)" required minLength={8} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
          <select name="role" className="w-full rounded-lg border border-line px-3 py-2 text-sm">
            <option value="COMMERCIAL">Marketing Digital &amp; Commercial</option>
            <option value="DEVELOPER">Développeur (accès complet)</option>
          </select>
          <p className="text-[11px] text-stone">
            Un seul compte Admin existe pour ce projet — il n&apos;est pas
            possible d&apos;en créer un second ici.
          </p>
          <button className="w-full rounded-full bg-red py-2.5 text-sm font-medium text-white hover:bg-red-dark">Créer</button>
        </form>
      </div>
    </AdminShell>
  );
}
