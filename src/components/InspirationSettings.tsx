"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { DEFAULT_INSPIRATION_ITEMS, MAX_INSPIRATION_ITEMS, MAX_SVG_LENGTH, inspirationSvgUrl, validateInspirationSvg, type InspirationItem } from "@/lib/inspiration";

export default function InspirationSettings({ initialItems }: { initialItems: InspirationItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState("");
  const { pending } = useFormStatus();
  function update(id: string, patch: Partial<InspirationItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }
  return <fieldset disabled={pending} className="grid gap-4">
    <legend className="mb-2 font-semibold">Pictogrammes et titres</legend>
    <p className="text-sm text-stone">Modifiez le titre et le SVG de chaque élément. Les changements seront appliqués avec « Enregistrer ce bloc ».</p>
    <input type="hidden" name="inspirationItems" value={JSON.stringify(items)} />
    {error && <p role="alert" className="text-sm text-red">{error}</p>}
    {items.length === 0 && <p className="rounded-lg bg-mist p-4 text-sm">Aucun pictogramme. Ajoutez un élément pour compléter cette section.</p>}
    {items.map((item, index) => <div key={item.id} className="grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-[140px_1fr]">
      <div className="flex flex-col items-center gap-3 rounded-lg bg-mist p-4 text-center">
        {/* SVG is deliberately isolated in an image document. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={inspirationSvgUrl(item.svg)} alt="" width={50} height={50} className="h-[50px] w-[50px] object-contain" />
        <p className="whitespace-pre-line text-sm leading-5">{item.title}</p>
        <span className="text-xs text-stone">{item.visible ? "Affiché" : "Masqué"}</span>
      </div>
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm font-medium">Titre du pictogramme {index + 1}<textarea required maxLength={200} rows={2} value={item.title} onChange={(event) => update(item.id, { title: event.target.value })} className="rounded-lg border border-line p-3 font-normal" /></label>
        <label className="grid gap-2 text-sm font-medium">Remplacer le SVG<input type="file" accept=".svg,image/svg+xml" className="text-sm" onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          try {
            if (file.size > MAX_SVG_LENGTH) throw new Error("Le SVG doit faire moins de 50 Ko.");
            const svg = validateInspirationSvg(await file.text());
            if (new DOMParser().parseFromString(svg, "image/svg+xml").querySelector("parsererror")) throw new Error("Le fichier SVG est mal formé.");
            update(item.id, { svg }); setError("");
          } catch (failure) { setError(failure instanceof Error ? failure.message : "SVG invalide."); }
        }} /></label>
        <details className="text-sm"><summary className="cursor-pointer">Modifier le code SVG</summary><textarea aria-label={`Code SVG du pictogramme ${index + 1}`} rows={4} maxLength={MAX_SVG_LENGTH} value={item.svg} onChange={(event) => update(item.id, { svg: event.target.value })} className="mt-2 w-full rounded-lg border border-line p-2 font-mono text-xs" /></details>
        <div className="flex flex-wrap gap-3">
          <button type="button" aria-pressed={!item.visible} onClick={() => update(item.id, { visible: !item.visible })} className="min-h-11 rounded-lg border border-line px-4 text-sm">{item.visible ? "Masquer" : "Afficher"}</button>
          <button type="button" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} className="min-h-11 rounded-lg border border-red/30 px-4 text-sm text-red">Supprimer</button>
        </div>
      </div>
    </div>)}
    <button type="button" disabled={items.length >= MAX_INSPIRATION_ITEMS} onClick={() => setItems((current) => [...current, { ...DEFAULT_INSPIRATION_ITEMS[0], id: crypto.randomUUID(), title: "Nouveau service" }])} className="min-h-11 justify-self-start rounded-lg border border-line px-4 text-sm disabled:opacity-40">Ajouter un pictogramme</button>
  </fieldset>;
}
