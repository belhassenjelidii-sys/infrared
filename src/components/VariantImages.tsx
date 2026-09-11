"use client";

import { useState } from "react";
import ManagedImage from "@/components/ManagedImage";
import ImageUploadField from "./ImageUploadField";

type Photo = { id?: string; url: string; alt: string };

export default function VariantImages({ initial }: { initial: Photo[] }) {
  const [images, setImages] = useState(initial);
  const [dragging, setDragging] = useState<number | null>(null);
  function move(index: number, offset: number) {
    setImages((current) => {
      const next = [...current];
      const to = index + offset;
      if (to < 0 || to >= next.length) return current;
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  }
  function dropAt(target: number) {
    if (dragging === null || dragging === target) return setDragging(null);
    setImages((current) => {
      const next = [...current];
      const [item] = next.splice(dragging, 1);
      next.splice(target, 0, item);
      return next;
    });
    setDragging(null);
  }
  return <div className="grid gap-4">
    <input type="hidden" name="images" value={JSON.stringify(images)}/>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{images.map((image, index) => <div key={image.id ?? `${image.url}-${index}`} draggable onDragStart={() => setDragging(index)} onDragEnd={() => setDragging(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropAt(index)} className={`cursor-grab rounded-lg border border-line p-3 transition ${dragging === index ? "opacity-50 ring-2 ring-violet-500" : ""}`}><div className="relative aspect-[4/3] bg-mist"><ManagedImage src={image.url} alt={image.alt} fill sizes="240px" className="object-contain"/></div><p className="mt-2 text-xs font-semibold">{index === 0 ? "Image principale" : `Image ${index + 1}`}</p><label className="mt-2 grid gap-1 text-xs">Texte alternatif<input value={image.alt} maxLength={300} onChange={(event) => setImages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, alt: event.target.value } : item))} className="min-h-10 rounded border border-line px-2"/></label><div className="mt-2 flex flex-wrap gap-2 text-xs"><button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="min-h-10 rounded border px-2 disabled:opacity-30" aria-label={`Avancer l’image ${index + 1}`}>←</button><button type="button" disabled={index === images.length - 1} onClick={() => move(index, 1)} className="min-h-10 rounded border px-2 disabled:opacity-30" aria-label={`Reculer l’image ${index + 1}`}>→</button><button type="button" onClick={() => setImages((current) => [current[index], ...current.filter((_, itemIndex) => itemIndex !== index)])} className="min-h-10 px-2">Principale</button><button type="button" onClick={() => { if (window.confirm("Retirer cette image de l’article lors de l’enregistrement ?")) setImages((current) => current.filter((_, itemIndex) => itemIndex !== index)); }} className="min-h-10 text-red">Retirer</button></div><p className="mt-2 text-[11px] text-stone">Glissez cette carte pour réorganiser.</p></div>)}</div>
    <ImageUploadField name="uploadedImage" label="Ajouter des photos ou glisser-déposer" folder="products" multiple resetAfterUpload onUploadedMany={(urls) => setImages((current) => [...current, ...urls.map((url) => ({ url, alt: "" }))])}/>
    <p className="text-xs text-stone">L’ordre, les textes et les retraits sont appliqués à l’enregistrement de l’article.</p>
  </div>;
}
