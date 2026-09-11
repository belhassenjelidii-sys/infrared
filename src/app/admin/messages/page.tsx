import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/authz";
import AdminShell from "@/components/AdminShell";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { toggleMessageHandledAction, deleteMessageAction } from "./actions";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export default async function AdminMessagesPage() {
  const session = await requirePagePermission("messages.manage");
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <AdminShell active="/admin/messages" name={session?.name} email={session?.email} role={session?.role}>
      <p className="eyebrow text-red">Formulaire de contact</p>
      <h1 className="font-display mt-2 text-3xl">Messages reçus</h1>
      <p className="mt-2 text-sm text-stone">
        Envoyés depuis la page <code>/contact</code>. Marquez un message comme traité une fois la réponse envoyée.
      </p>

      {messages.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line p-8 text-center text-sm text-stone">
          Aucun message pour le moment.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-2xl border p-5 ${m.handled ? "border-line bg-white opacity-70" : "border-red/20 bg-red-soft/30"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {m.name} <span className="font-normal text-stone">— {m.email}</span>
                    {m.phone && <span className="font-normal text-stone"> · {m.phone}</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-stone">{formatDate(m.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <form action={toggleMessageHandledAction.bind(null, m.id, m.handled)}>
                    <button className="rounded-full border border-line px-3 py-1 text-xs hover:border-red hover:text-red">
                      {m.handled ? "Marquer non traité" : "Marquer traité"}
                    </button>
                  </form>
                  <form action={deleteMessageAction.bind(null, m.id)}>
                    <ConfirmSubmitButton
                      confirmMessage="Supprimer ce message ?"
                      className="rounded-full border border-red/30 px-3 py-1 text-xs text-red hover:bg-red hover:text-white"
                    >
                      Supprimer
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-ink/80">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
