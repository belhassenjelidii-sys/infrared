"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ManagedImage from "@/components/ManagedImage";
import { Wand2, Loader2, Check, X, RotateCcw } from "lucide-react";

type Props = {
  imageId: string;
  originalUrl: string;
  replaceAction: (productId: string, imageId: string, newUrl: string) => Promise<void>;
  discardAction: (url: string) => Promise<void>;
  productId: string;
};

export default function BackgroundRemovalTool({ imageId, originalUrl, replaceAction, discardAction, productId }: Props) {
  const [pending, startTransition] = useTransition();
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  async function run() {
    setProcessing(true);
    setError("");
    setResultUrl(null);
    try {
      const res = await fetch("/api/image-pipeline/remove-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: originalUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Suppression du fond impossible pour cette photo.");
      setResultUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setProcessing(false);
    }
  }

  function useResult() {
    if (!resultUrl) return;
    startTransition(async () => {
      await replaceAction(productId, imageId, resultUrl);
      setResultUrl(null);
      router.refresh();
    });
  }

  function keepOriginal() {
    if (!resultUrl) return;
    const discardUrl = resultUrl;
    setResultUrl(null);
    startTransition(async () => {
      await discardAction(discardUrl);
    });
  }

  function retry() {
    if (resultUrl) {
      const discardUrl = resultUrl;
      startTransition(() => discardAction(discardUrl));
    }
    setResultUrl(null);
    void run();
  }

  if (!resultUrl && !processing) {
    return (
      <button
        type="button"
        onClick={run}
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-ink/70 hover:border-red hover:text-red"
      >
        <Wand2 size={12} /> Retirer le fond
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-line bg-mist p-3">
      {processing ? (
        <p className="flex items-center gap-2 text-xs text-stone">
          <Loader2 size={14} className="animate-spin" /> Suppression du fond en cours (traitement local)…
        </p>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-red">{error}</p>
          <p className="text-[11px] text-stone">L&apos;original est conservé — rien n&apos;a été modifié.</p>
          <button type="button" onClick={run} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium hover:border-red hover:text-red">
            <RotateCcw size={11} /> Réessayer
          </button>
        </div>
      ) : resultUrl ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-stone">Original</p>
              <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-white">
                <ManagedImage src={originalUrl} alt="Original" fill className="object-contain p-2" unoptimized={originalUrl.startsWith("/uploads/")} />
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-stone">Résultat (fond transparent)</p>
              <div
                className="relative aspect-square overflow-hidden rounded-lg border border-line"
                style={{ backgroundImage: "conic-gradient(#e5e7eb 0.25turn, #fff 0.25turn 0.5turn, #e5e7eb 0.5turn 0.75turn, #fff 0.75turn)", backgroundSize: "16px 16px" }}
              >
                <ManagedImage src={resultUrl} alt="Résultat sans fond" fill className="object-contain p-2" unoptimized={resultUrl.startsWith("/uploads/")} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={useResult}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-full bg-red px-3 py-1.5 text-xs font-medium text-white hover:bg-red-dark disabled:opacity-50"
            >
              <Check size={13} /> Utiliser le résultat
            </button>
            <button
              type="button"
              onClick={keepOriginal}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-ink disabled:opacity-50"
            >
              <X size={13} /> Conserver l&apos;original
            </button>
            <button
              type="button"
              onClick={retry}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-ink disabled:opacity-50"
            >
              <RotateCcw size={13} /> Recommencer
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
