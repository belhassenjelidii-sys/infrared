
"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ManagedImage from "@/components/ManagedImage";
import { CheckCircle, Grip, Loader2, Maximize2, RotateCcw } from "lucide-react";
import ImageUploadField from "./ImageUploadField";
import { updateHeroMediaAction, updateHeroMediaLayoutAction } from "@/app/admin/parametres/actions";

type Props = {
  initialMediaType: "image" | "video";
  initialImageUrl: string | null;
  initialVideoUrl: string | null;
  initialScale?: number;
  initialX?: number;
  initialY?: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function HeroMediaPicker({
  initialMediaType,
  initialImageUrl,
  initialVideoUrl,
  initialScale = 125,
  initialX = 0,
  initialY = 0,
}: Props) {
  const [mediaType, setMediaType] = useState<"image" | "video">(initialMediaType);
  const [imageUrl, setImageUrl] = useState(initialImageUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl ?? "");
  const [scale, setScale] = useState(clamp(initialScale, 80, 160));
  const [x, setX] = useState(clamp(initialX, -60, 60));
  const [y, setY] = useState(clamp(initialY, -60, 60));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; x: number; y: number } | null>(null);
  const router = useRouter();

  function persistLayout(nextScale: number, nextX: number, nextY: number) {
    setSaved(false);
    startTransition(async () => {
      await updateHeroMediaLayoutAction({ scale: nextScale, x: nextX, y: nextY });
      setSaved(true);
      router.refresh();
    });
  }

  function handleUploaded(type: "image" | "video", url: string) {
    setSaved(false);
    startTransition(async () => {
      await updateHeroMediaAction(type, url);
      if (type === "image") setImageUrl(url);
      else setVideoUrl(url);
      setSaved(true);
      router.refresh();
    });
  }

  function selectType(option: "image" | "video") {
    setMediaType(option);
    startTransition(async () => {
      await updateHeroMediaAction(option, option === "image" ? imageUrl : videoUrl);
      router.refresh();
    });
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!imageUrl && !videoUrl) return;
    const preview = previewRef.current;
    if (!preview) return;
    preview.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x, y };
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const preview = previewRef.current;
    if (!drag || !preview) return;
    const rect = preview.getBoundingClientRect();
    const nextX = clamp(Math.round(drag.x + ((event.clientX - drag.startX) / rect.width) * 100), -60, 60);
    const nextY = clamp(Math.round(drag.y + ((event.clientY - drag.startY) / rect.height) * 100), -60, 60);
    setX(nextX);
    setY(nextY);
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
    persistLayout(scale, x, y);
  }

  function resetLayout() {
    setScale(125);
    setX(0);
    setY(0);
    persistLayout(125, 0, 0);
  }

  const previewUrl = mediaType === "video" ? videoUrl : imageUrl;
  const hasMedia = Boolean(previewUrl);
  const transform = `translate(${x}%, ${y}%) scale(${scale / 100})`;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["image", "video"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => selectType(option)}
            className={`flex-1 rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors ${
              mediaType === option ? "border-red bg-red-soft text-red" : "border-line text-stone hover:border-red/40"
            }`}
          >
            {option === "image" ? "Photo" : "Vidéo"}
          </button>
        ))}
      </div>

      {(pending || saved) && (
        <p className={`flex items-center gap-1.5 text-xs font-medium ${pending ? "text-red" : "text-emerald-700"}`}>
          {pending ? <><Loader2 size={12} className="animate-spin" /> Enregistrement…</> : <><CheckCircle size={12} /> Réglages du Hero enregistrés.</>}
        </p>
      )}

      <div className="rounded-2xl border border-line bg-mist p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-lg">Ajustement visuel du Hero</h3>
            <p className="text-xs text-stone">Déplace la photo/vidéo directement avec la souris ou le doigt.</p>
          </div>
          <button type="button" onClick={resetLayout} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-stone hover:border-red hover:text-red">
            <RotateCcw size={13} /> Réinitialiser
          </button>
        </div>

        <div
          ref={previewRef}
          className="relative mx-auto aspect-[16/7] max-w-3xl overflow-hidden rounded-2xl border border-line bg-white select-none touch-none"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={resetLayout}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white via-mist to-[#f0e2e0]" />
          <div className="pointer-events-none absolute left-5 top-5 z-10 max-w-[46%] sm:left-7 sm:top-7">
            <p className="eyebrow text-red">InfraRed Optic-Store</p>
            <p className="font-display mt-2 text-xl leading-tight sm:text-3xl">Découvrez votre<br /><span className="text-red">prochaine paire.</span></p>
            <div className="mt-4 h-2 w-24 rounded-full bg-red/80" />
          </div>

          {hasMedia ? (
            <div className="absolute right-[8%] top-1/2 h-[76%] w-[34%] -translate-y-1/2">
              <div className="h-full w-full origin-center" style={{ transform }}>
                {mediaType === "video" ? (
                  <video src={previewUrl!} muted playsInline autoPlay loop className="h-full w-full rounded-[1.5rem] object-cover" />
                ) : (
                  <ManagedImage src={previewUrl!} alt="Aperçu Hero" fill sizes="34vw" className="rounded-[1.5rem] object-contain bg-white p-2" unoptimized={previewUrl!.startsWith("/uploads/")} />
                )}
              </div>
            </div>
          ) : (
            <div className="absolute right-[8%] top-1/2 flex h-[76%] w-[34%] -translate-y-1/2 items-center justify-center rounded-[1.5rem] border border-dashed border-line bg-white text-center text-xs text-stone">
              Ajoute d&apos;abord une photo ou une vidéo.
            </div>
          )}

          {hasMedia && <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-stone shadow-sm"><Grip size={12} className="mr-1 inline" /> Glisser</div>}
          <div className="pointer-events-none absolute inset-3 rounded-xl border border-dashed border-red/20" />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-xs font-medium text-stone">
            Taille — <span className="text-ink">{scale}%</span>
            <span className="mt-2 flex items-center gap-2"><Maximize2 size={13} />
              <input type="range" min="80" max="160" step="1" value={scale} onChange={(e) => setScale(Number(e.target.value))} onPointerUp={(e) => persistLayout(Number(e.currentTarget.value), x, y)} className="w-full accent-red" />
            </span>
          </label>
          <label className="block text-xs font-medium text-stone">
            Gauche ↔ Droite — <span className="text-ink">{x > 0 ? `+${x}` : x}</span>
            <input type="range" min="-60" max="60" step="1" value={x} onChange={(e) => setX(Number(e.target.value))} onPointerUp={(e) => persistLayout(scale, Number(e.currentTarget.value), y)} className="mt-2 w-full accent-red" />
          </label>
          <label className="block text-xs font-medium text-stone">
            Haut ↕ Bas — <span className="text-ink">{y > 0 ? `+${y}` : y}</span>
            <input type="range" min="-60" max="60" step="1" value={y} onChange={(e) => setY(Number(e.target.value))} onPointerUp={(e) => persistLayout(scale, x, Number(e.currentTarget.value))} className="mt-2 w-full accent-red" />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] text-stone sm:text-xs">
          <span>Taille {scale}%</span><span>X {x}</span><span>Y {y}</span>
        </div>
      </div>

      <div className={mediaType === "image" ? "" : "hidden"}>
        <ImageUploadField
          name="heroImageUrl"
          label="Photo / affiche principale du Hero"
          initialUrl={imageUrl}
          folder="settings"
          preserveOriginal
          onUploaded={(url) => handleUploaded("image", url)}
        />
      </div>
      <div className={mediaType === "video" ? "" : "hidden"}>
        <ImageUploadField
          name="heroVideoUrl"
          label="Vidéo principale du Hero (courte, en boucle)"
          initialUrl={videoUrl}
          folder="settings"
          kind="video"
          onUploaded={(url) => handleUploaded("video", url)}
        />
      </div>

      <input type="hidden" name="heroMediaType" value={mediaType} />
      <input type="hidden" name="heroMediaScale" value={scale} />
      <input type="hidden" name="heroMediaX" value={x} />
      <input type="hidden" name="heroMediaY" value={y} />
    </div>
  );
}
