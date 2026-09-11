"use client";

import { useState, useTransition } from "react";
import { KeyRound, Loader2, X } from "lucide-react";

type PasswordAction = (formData: FormData) => Promise<void>;

type Props = {
  name: string;
  email: string;
  action: PasswordAction;
};

export default function UserPasswordButton({ name, email, action }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function submit(formData: FormData) {
    setError("");
    startTransition(async () => {
      try {
        await action(formData);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de modifier le mot de passe.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setError(""); setOpen(true); }}
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-red hover:text-red"
      >
        <KeyRound size={13} />
        Changer le mot de passe
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={`Changer le mot de passe de ${name}`}>
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-red">Sécurité</p>
                <h2 className="font-display mt-1 text-xl">Changer le mot de passe</h2>
                <p className="mt-1 text-xs text-stone">{name} · {email}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} disabled={pending} className="rounded-full p-2 text-stone hover:bg-mist hover:text-ink" aria-label="Fermer">
                <X size={17} />
              </button>
            </div>

            <form action={submit} className="mt-5 space-y-3">
              <label className="block text-xs font-medium text-stone">
                Nouveau mot de passe
                <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="8 caractères minimum" className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-red" />
              </label>
              <label className="block text-xs font-medium text-stone">
                Confirmer le mot de passe
                <input name="passwordConfirmation" type="password" required minLength={8} autoComplete="new-password" placeholder="Répéter le mot de passe" className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-red" />
              </label>

              {error && <p className="rounded-lg bg-red-soft px-3 py-2 text-xs font-medium text-red">{error}</p>}
              <p className="text-[11px] text-stone">Toutes les anciennes sessions de cet utilisateur seront invalidées.</p>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} disabled={pending} className="rounded-full border border-line px-4 py-2 text-xs font-medium text-stone hover:border-red hover:text-red">
                  Annuler
                </button>
                <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-red px-4 py-2 text-xs font-medium text-white hover:bg-red-dark disabled:opacity-60">
                  {pending && <Loader2 size={13} className="animate-spin" />}
                  {pending ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
