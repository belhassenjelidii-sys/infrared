"use client";

import { useActionState } from "react";
import { submitContactAction, type ContactFormState } from "@/app/contact/actions";

const initialState: ContactFormState = { ok: false };

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactAction, initialState);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-line bg-mist p-8 text-center">
        <p className="font-display text-xl">Message envoyé</p>
        <p className="mt-2 text-sm text-stone">
          Merci, notre équipe vous répondra rapidement.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-line p-6">
      {/* Honeypot — hidden from real users via CSS, invisible to screen readers via aria-hidden+tabIndex. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Site web</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="name">Nom</label>
        <input id="name" name="name" required minLength={2} maxLength={120} className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="phone">Téléphone</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" placeholder="+216 12 345 678" required pattern="\+?216[\s.-]?([2-9]\d{7})|[2-9]\d{7}" title="Entrez un numéro tunisien au format +216 12 345 678" className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="message">Message</label>
        <textarea id="message" name="message" required minLength={10} maxLength={4000} rows={4} className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red" />
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-red-soft px-3.5 py-2.5 text-sm font-medium text-red">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-red py-3.5 text-sm font-medium text-white transition-colors hover:bg-red-dark disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Envoyer le message"}
      </button>
    </form>
  );
}
