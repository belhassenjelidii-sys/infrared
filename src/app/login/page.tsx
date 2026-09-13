"use client";

import { useActionState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { loginAction, verifyTwoFactorLoginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [twoFactorState, twoFactorAction, twoFactorPending] = useActionState(verifyTwoFactorLoginAction, initialState);

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-mist px-5">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 shadow-sm">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="font-display mt-6 text-center text-2xl">Connexion</h1>
        <p className="mt-1 text-center text-sm text-stone">
          Accès Admin / Commercial
        </p>

        {state.twoFactorRequired ? <form action={twoFactorAction} className="mt-6 space-y-4">
          <div><label className="text-sm font-medium" htmlFor="code">Code d’authentification</label><input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required autoFocus placeholder="123456 ou code de récupération" className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red"/></div>
          <p className="text-sm text-stone">Ouvrez votre application Authenticator et saisissez le code à 6 chiffres. Un code de récupération peut aussi être utilisé.</p>
          {twoFactorState.error && <p className="rounded-lg bg-red-soft px-3 py-2 text-sm text-red">{twoFactorState.error}</p>}
          <button type="submit" disabled={twoFactorPending} className="w-full rounded-full bg-red py-3 text-sm font-medium text-white transition-colors hover:bg-red-dark disabled:opacity-60">{twoFactorPending ? "Vérification…" : "Vérifier le code"}</button>
        </form> : <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-soft px-3 py-2 text-sm text-red">{state.error}</p>
          )}

          <div className="text-right">
            <Link href="/forgot-password" className="text-xs font-medium text-stone hover:text-red">Mot de passe oublié ?</Link>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-red py-3 text-sm font-medium text-white transition-colors hover:bg-red-dark disabled:opacity-60"
          >
            {pending ? "Connexion…" : "Se connecter"}
          </button>
        </form>}

        <Link href="/" className="mt-6 block text-center text-xs text-stone hover:text-red">
          ← Retour au site
        </Link>
      </div>
    </div>
  );
}
