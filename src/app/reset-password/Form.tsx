"use client";

import { useActionState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-mist px-5">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 shadow-sm">
        <div className="flex justify-center"><Logo /></div>
        <h1 className="font-display mt-6 text-center text-2xl">Nouveau mot de passe</h1>
        <p className="mt-1 text-center text-sm text-stone">Choisissez un nouveau mot de passe pour votre compte.</p>

        {state.ok ? (
          <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Mot de passe modifié. Vous pouvez maintenant vous connecter.</div>
        ) : (
          <form action={formAction} className="mt-6 space-y-4">
            <input type="hidden" name="token" value={token} />
            <div>
              <label className="text-sm font-medium" htmlFor="password">Nouveau mot de passe</label>
              <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red" />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red" />
            </div>
            {state.error && <p className="rounded-lg bg-red-soft px-3 py-2 text-sm text-red">{state.error}</p>}
            <button type="submit" disabled={pending || !token} className="w-full rounded-full bg-red py-3 text-sm font-medium text-white hover:bg-red-dark disabled:opacity-60">
              {pending ? "Modification…" : "Changer le mot de passe"}
            </button>
          </form>
        )}

        <Link href="/login" className="mt-6 block text-center text-xs text-stone hover:text-red">← Retour à la connexion</Link>
      </div>
    </div>
  );
}
