"use client";

import { useState, useTransition } from "react";
import { Wand2, Loader2, Pencil, Check } from "lucide-react";
import { regenerateProductMetadataAction } from "@/app/admin/produits/[id]/metadata-actions";
import type { ProductMetadataSuggestion } from "@/lib/product-intelligence/types";

type Props = {
  productId: string;
  initial: {
    metaTitle: string;
    metaDescription: string;
    tags: string;
    whatsappTitle: string;
  };
};

export default function ProductMetadataPanel({ productId, initial }: Props) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [suggestedSlug, setSuggestedSlug] = useState<string | null>(null);
  const [values, setValues] = useState(initial);

  function regenerate() {
    startTransition(async () => {
      const result: ProductMetadataSuggestion | null = await regenerateProductMetadataAction(productId);
      if (!result) return;
      setValues({
        metaTitle: result.seoTitle,
        metaDescription: result.metaDescription,
        tags: result.tags.join(", "),
        whatsappTitle: result.whatsappTitle,
      });
      setSuggestedSlug(result.slug);
      setEditing(true);
    });
  }

  return (
    <div className="border-t border-line pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Métadonnées (SEO, tags, WhatsApp)</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={regenerate}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium hover:border-red hover:text-red disabled:opacity-50"
          >
            {pending ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
            Régénérer
          </button>
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium hover:border-ink"
          >
            {editing ? <Check size={12} /> : <Pencil size={12} />}
            {editing ? "Terminé" : "Modifier"}
          </button>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-stone">
        Généré localement à partir des champs du produit (marque, référence, catégorie, forme,
        couleur, prix) — jamais inventé. Enregistré avec le formulaire ci-dessus.
      </p>

      {suggestedSlug && (
        <p className="mt-2 rounded-lg bg-mist px-2.5 py-1.5 text-[11px] text-stone">
          Slug suggéré (informatif, non appliqué automatiquement) : <code className="text-ink">{suggestedSlug}</code>
        </p>
      )}

      <div className="mt-3 space-y-2.5">
        <div>
          <label className="text-[11px] font-medium text-stone">Titre SEO</label>
          {editing ? (
            <input name="metaTitle" value={values.metaTitle} onChange={(e) => setValues((v) => ({ ...v, metaTitle: e.target.value }))} className="mt-1 w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
          ) : (
            <>
              <input type="hidden" name="metaTitle" value={values.metaTitle} />
              <p className="mt-1 text-xs">{values.metaTitle || <span className="text-stone">— vide —</span>}</p>
            </>
          )}
        </div>
        <div>
          <label className="text-[11px] font-medium text-stone">Meta description</label>
          {editing ? (
            <textarea name="metaDescription" value={values.metaDescription} onChange={(e) => setValues((v) => ({ ...v, metaDescription: e.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
          ) : (
            <>
              <input type="hidden" name="metaDescription" value={values.metaDescription} />
              <p className="mt-1 text-xs">{values.metaDescription || <span className="text-stone">— vide —</span>}</p>
            </>
          )}
        </div>
        <div>
          <label className="text-[11px] font-medium text-stone">Tags</label>
          {editing ? (
            <input name="tags" value={values.tags} onChange={(e) => setValues((v) => ({ ...v, tags: e.target.value }))} className="mt-1 w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
          ) : (
            <>
              <input type="hidden" name="tags" value={values.tags} />
              <p className="mt-1 text-xs">{values.tags || <span className="text-stone">— vide —</span>}</p>
            </>
          )}
        </div>
        <div>
          <label className="text-[11px] font-medium text-stone">Titre WhatsApp</label>
          {editing ? (
            <input name="whatsappTitle" value={values.whatsappTitle} onChange={(e) => setValues((v) => ({ ...v, whatsappTitle: e.target.value }))} className="mt-1 w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
          ) : (
            <>
              <input type="hidden" name="whatsappTitle" value={values.whatsappTitle} />
              <p className="mt-1 text-xs">{values.whatsappTitle || <span className="text-stone">— vide —</span>}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
