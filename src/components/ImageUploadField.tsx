"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, UploadCloud, X, CheckCircle } from "lucide-react";

type Props = {
  name: string;
  initialUrl?: string | null;
  label?: string;
  accept?: string;
  compact?: boolean;
  /** Groups uploads in Supabase Storage — must match ALLOWED_FOLDERS in /api/uploads. */
  folder?: "products" | "brands" | "categories" | "stores" | "settings";
  /** "video" enables MP4/WEBM upload (40 Mo max) instead of JPG/PNG/WEBP — used only for the homepage hero. */
  kind?: "image" | "video";
  /** Called right after a successful upload, with the new permanent URL. */
  onUploaded?: (url: string) => void;
  /** Enables selecting/dropping several images in one batch. */
  multiple?: boolean;
  /** Called once after a batch, with every successfully stored URL. */
  onUploadedMany?: (urls: string[]) => void;
  /** Clears the preview after upload — useful when the image is attached elsewhere immediately. */
  resetAfterUpload?: boolean;
  /** Temporarily locks the picker while its parent saves uploaded URLs. */
  disabled?: boolean;
  /** Stores the archival high-definition version as the display URL. */
  preserveOriginal?: boolean;
};

export default function ImageUploadField({
  name,
  initialUrl = null,
  label = "Photo",
  accept,
  compact = false,
  folder = "products",
  kind = "image",
  onUploaded,
  multiple = false,
  onUploadedMany,
  resetAfterUpload = false,
  disabled = false,
  preserveOriginal = false,
}: Props) {
  const resolvedAccept = accept ?? (kind === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp");
  const [url, setUrl] = useState(initialUrl ?? "");
  const [sourceUrl, setSourceUrl] = useState("");
  const [preview, setPreview] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [preserveBackground, setPreserveBackground] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Prevents the classic race condition: clicking the surrounding form's
  // "Enregistrer"/"Créer" button before an in-flight upload has finished
  // writing the URL into the hidden field below — which used to silently
  // save/create the record with no image at all. We disable every submit
  // button in the owning <form> while an upload is in progress.
  function setFormBusy(busy: boolean) {
    const form = inputRef.current?.form;
    if (!form) return;
    form.querySelectorAll("button").forEach((btn) => {
      const el = btn as HTMLButtonElement;
      if (el.type === "button") return; // our own Retirer/Importer buttons
      el.disabled = busy;
      el.classList.toggle("opacity-50", busy);
      el.classList.toggle("cursor-not-allowed", busy);
    });
  }

  async function uploadOne(form: FormData) {
    form.append("folder", folder);
    form.append("kind", kind);
    if (preserveOriginal) form.append("preserveOriginal", "true");
    if (folder === "products" && preserveBackground) form.append("preserveBackground", "true");
    const response = await fetch("/api/uploads", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Upload impossible.");
    return String(data.url);
  }

  async function upload(forms: FormData[]) {
    setBusy(true);
    setFormBusy(true);
    setError("");
    setSuccess(false);
    setProgress(forms.length > 1 ? { current: 0, total: forms.length } : null);
    const uploadedUrls: string[] = [];
    const failures: string[] = [];
    try {
      for (let index = 0; index < forms.length; index++) {
        setProgress(forms.length > 1 ? { current: index + 1, total: forms.length } : null);
        try {
          uploadedUrls.push(await uploadOne(forms[index]));
        } catch (e) {
          failures.push(e instanceof Error ? e.message : "Erreur d'upload.");
        }
      }

      if (uploadedUrls.length > 0) {
        const lastUrl = uploadedUrls[uploadedUrls.length - 1];
        setSourceUrl("");
        setSuccess(true);
        if (resetAfterUpload) {
          setUrl("");
          setPreview("");
        } else {
          setUrl(lastUrl);
          setPreview(lastUrl);
        }
        if (onUploadedMany) onUploadedMany(uploadedUrls);
        else uploadedUrls.forEach((uploadedUrl) => onUploaded?.(uploadedUrl));
        if (preserveBackground) setPreserveBackground(false);
      }

      if (failures.length > 0) {
        const prefix = forms.length > 1
          ? `${failures.length} image(s) sur ${forms.length} n'ont pas été importées. `
          : "";
        setError(`${prefix}${failures[0]}`);
      }
    } finally {
      if (inputRef.current) inputRef.current.value = "";
      setProgress(null);
      setBusy(false);
      setFormBusy(false);
    }
  }

  function handleFiles(files?: FileList | File[]) {
    if (disabled || busy) return;
    const selected = Array.from(files ?? []);
    if (selected.length === 0) return;
    const forms = selected.map((file) => {
      const form = new FormData();
      form.append("file", file);
      return form;
    });
    void upload(forms);
  }

  function handleUrl(e?: React.KeyboardEvent | React.MouseEvent) {
    e?.preventDefault(); // avoid an accidental implicit form submit on Enter
    if (disabled || busy) return;
    const value = sourceUrl.trim();
    if (!value) { setError("Collez une URL d'image."); return; }
    const form = new FormData();
    form.append("url", value);
    void upload([form]);
  }

  function clear() {
    setUrl("");
    setPreview("");
    setSourceUrl("");
    setSuccess(false);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={url} />

      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex items-center gap-2">
          {busy && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red">
              <Loader2 size={12} className="animate-spin" />
              {progress ? `Image ${progress.current}/${progress.total}…` : "Envoi en cours…"}
            </span>
          )}
          {preview && !busy && (
            <button type="button" onClick={clear} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-xs text-red hover:bg-red-soft">
              <X size={14} /> Retirer
            </button>
          )}
        </div>
      </div>

      {preview ? (
        <div className={`relative overflow-hidden rounded-xl border border-line bg-mist ${compact ? "h-32" : "aspect-video"}`}>
          {kind === "video" ? (
            <video src={preview} controls muted className="h-full w-full object-contain" />
          ) : preview.startsWith("http") ? (
            // An existing external URL may point to any host. It is shown
            // directly here so editing a legacy logo never depends on the
            // Next.js image-host allow-list. Imported URLs are copied through
            // our image pipeline and then use the optimized local path below.
            <img src={preview} alt="Aperçu" className="h-full w-full object-contain p-2" />
          ) : (
            <Image
              src={preview}
              alt="Aperçu"
              fill
              quality={100}
              className="object-contain p-2"
              unoptimized={preview.startsWith("/uploads/")}
            />
          )}
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-white/80">
              <Loader2 className="animate-spin text-red" />
            </div>
          )}
          {success && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
              <CheckCircle size={12} /> Sauvegardé
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-mist p-3">
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-line bg-white text-center ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-red"}`}
          >
            {busy ? (
              <><Loader2 className="animate-spin text-red" size={24} /><span className="text-sm text-stone">Upload en cours…</span></>
            ) : (
              <><UploadCloud className="text-red" size={24} />
              <span className="text-sm font-medium">Glissez {kind === "video" ? "une vidéo" : multiple ? "vos images" : "une image"} ici ou cliquez pour parcourir</span>
              <span className="text-xs text-stone">{kind === "video" ? "MP4 ou WEBM · 40 Mo max" : "JPG, PNG ou WEBP · 8 Mo max"}</span></>
            )}
            <input ref={inputRef} type="file" accept={resolvedAccept} multiple={multiple && kind === "image"} disabled={disabled || busy} className="sr-only" onChange={(e) => handleFiles(e.target.files ?? undefined)} />
          </label>
        </div>
      )}

      {kind === "image" && folder === "products" && (
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-xs text-stone">
          <input
            type="checkbox"
            checked={preserveBackground}
            onChange={(e) => setPreserveBackground(e.target.checked)}
            disabled={disabled || busy}
            className="mt-0.5"
          />
          <span>
            <strong className="font-medium text-ink">Photo avec personne ou mannequin</strong><br />
            Conserver le fond et la composition, sans appliquer le filtre de transparence.
          </span>
        </label>
      )}

      {kind === "image" && (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3">
            <ImagePlus size={16} className="shrink-0 text-stone" />
            <input
              type="text"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrl(e)}
              disabled={disabled || busy}
              placeholder="Ou collez une URL d'image (https://...)"
              className="min-h-11 min-w-0 w-full bg-transparent text-sm outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleUrl}
            disabled={disabled || busy || !sourceUrl.trim()}
            className="min-h-11 rounded-lg border border-line px-4 text-sm font-medium hover:border-red hover:text-red disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="mx-auto animate-spin" /> : "Importer"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg bg-red-soft px-3 py-2 text-xs font-medium text-red">{error}</p>}
      <p className="text-[11px] text-stone">
        {kind === "video" ? "Vidéo" : preserveBackground ? "Image avec fond conservé" : "Image produit détourée"} stockée sur Supabase Storage — l&apos;URL générée est permanente.
      </p>
    </div>
  );
}
