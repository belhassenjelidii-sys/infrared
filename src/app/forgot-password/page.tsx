"use client";

import { useActionState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-mist px-5">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 shadow-sm">
        <div className="flex justify-center"><Logo /></div>
        <h1 className="font-display mt-6 text-center text-2xl">Mot de passe oublié</h1>
        <p className="mt-1 text-center text-sm text-stone">Recevez un lien sécurisé par e-mail.</p>

        {state.ok ? (
          <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
            Si cette adresse correspond à un compte actif, un e-mail de réinitialisation vient d&apos;être envoyé. Vérifiez aussi les spams.
          </div>
        ) : (
          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="email">Email du compte</label>
              <input id="email" name="email" type="email" required autoComplete="username" className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red" />
            </div>
            {state.error && <p className="rounded-lg bg-red-soft px-3 py-2 text-sm text-red">{state.error}</p>}
            <button type="submit" disabled={pending} className="w-full rounded-full bg-red py-3 text-sm font-medium text-white hover:bg-red-dark disabled:opacity-60">
              {pending ? "Envoi…" : "Recevoir le lien"}
            </button>
          </form>
        )}

        <Link href="/login" className="mt-6 block text-center text-xs text-stone hover:text-red">← Retour à la connexion</Link>
      </div>
    </div>
  );
}
