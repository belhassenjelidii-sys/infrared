"use client";

import { useActionState } from "react";
import { saveInspirationSectionAction } from "@/app/admin/parametres/home-actions";
import type { HomeContent } from "@/lib/home-content";
import InspirationSettings from "./InspirationSettings";

export default function InspirationForm({ content }: { content: HomeContent }) {
  const [result, action, pending] = useActionState(saveInspirationSectionAction, { error: "", saved: false });
  return <form action={action} className="grid max-w-4xl gap-5 rounded-2xl border border-line bg-white p-6 sm:p-8">
    <fieldset disabled={pending} className="grid gap-5">
      <label className="flex min-h-11 items-center gap-2 rounded-xl bg-mist px-4 text-sm font-medium"><input type="checkbox" name="inspirationEnabled" defaultChecked={content.inspirationEnabled} /> Afficher la section sur la page d&apos;accueil</label>
      <label className="grid gap-1 text-sm font-medium">Titre de la section<input name="inspirationTitle" defaultValue={content.inspirationTitle} maxLength={120} className="min-h-11 rounded-lg border border-line px-3 text-sm" /></label>
      <label className="grid gap-1 text-sm font-medium">Texte<textarea name="inspirationText" defaultValue={content.inspirationText} maxLength={600} rows={3} className="rounded-lg border border-line p-3 text-sm" /></label>
      <InspirationSettings key={JSON.stringify(content.inspirationItems)} initialItems={content.inspirationItems} />
      <button disabled={pending} className="min-h-12 rounded-full bg-red px-6 text-sm font-medium text-white hover:bg-red-dark disabled:opacity-50">{pending ? "Enregistrement…" : "Enregistrer ce bloc"}</button>
    </fieldset>
    {result.error && <p role="alert" className="text-sm text-red">{result.error}</p>}
    {result.saved && <p role="status" className="text-sm text-green-700">Modifications enregistrées.</p>}
  </form>;
}
