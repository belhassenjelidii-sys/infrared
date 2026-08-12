"use client";

import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to an API route (e.g. src/app/api/contact/route.ts) that
    // sends an email or stores the message once the backend is connected.
    setSent(true);
  }

  if (sent) {
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-line p-6">
      <div>
        <label className="text-sm font-medium" htmlFor="name">Nom</label>
        <input id="name" required className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium" htmlFor="email">Email</label>
          <input id="email" type="email" required className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="phone">Téléphone</label>
          <input id="phone" className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="message">Message</label>
        <textarea id="message" required rows={4} className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red" />
      </div>
      <button type="submit" className="w-full rounded-full bg-red py-3.5 text-sm font-medium text-white transition-colors hover:bg-red-dark">
        Envoyer le message
      </button>
    </form>
  );
}
