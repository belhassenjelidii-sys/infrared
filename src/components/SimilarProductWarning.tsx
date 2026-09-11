"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";

export type SimilarWarningItem = { productId?: string; productName: string; productSlug: string; similarity: number };

export default function SimilarProductWarning({ items }: { items: SimilarWarningItem[] }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || items.length === 0) return null;

  return (
    <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900">Produit potentiellement similaire</p>
            <p className="mt-0.5 text-xs text-amber-800">
              La photo ressemble à un ou plusieurs produits déjà en catalogue — vérifiez qu&apos;il ne s&apos;agit pas d&apos;un doublon.
            </p>
            <ul className="mt-2 space-y-1.5">
              {items.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-amber-900">{item.productName}</span>
                  <span className="text-amber-700">Similarité : {item.similarity}%</span>
                  <Link href={`/produit/${item.productSlug}`} target="_blank" className="underline text-amber-800 hover:text-amber-950">
                    Voir le produit
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-full p-1 text-amber-600 hover:bg-amber-100"
          aria-label="Continuer quand même"
          title="Continuer quand même"
        >
          <X size={16} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="mt-2 text-xs font-medium text-amber-800 underline hover:text-amber-950"
      >
        Continuer quand même
      </button>
    </div>
  );
}
