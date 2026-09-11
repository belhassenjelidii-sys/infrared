"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import ImageUploadField from "./ImageUploadField";
import SimilarProductWarning, { type SimilarWarningItem } from "./SimilarProductWarning";

type Props = {
  /** A Server Action already bound to its target id — called with a FormData containing `url`. */
  action: (formData: FormData) => Promise<{ duplicates: SimilarWarningItem[] } | void>;
  label?: string;
};

export default function ProductPhotoUploader({ action, label = "Ajouter une photo" }: Props) {
  const [pending, startTransition] = useTransition();
  const [doneCount, setDoneCount] = useState(0);
  const [duplicates, setDuplicates] = useState<SimilarWarningItem[]>([]);
  const router = useRouter();

  function handleUploaded(urls: string[]) {
    setDoneCount(0);
    setDuplicates([]);
    startTransition(async () => {
      const allDuplicates = new Map<string, SimilarWarningItem>();
      let saved = 0;
      for (const url of urls) {
        const fd = new FormData();
        fd.append("url", url);
        const result = await action(fd);
        saved++;
        result?.duplicates?.forEach((item) => {
          const key = item.productId ?? item.productSlug;
          const previous = allDuplicates.get(key);
          if (!previous || item.similarity > previous.similarity) allDuplicates.set(key, item);
        });
      }
      setDoneCount(saved);
      setDuplicates([...allDuplicates.values()].sort((a, b) => b.similarity - a.similarity));
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <ImageUploadField
        name="url"
        label={label}
        compact
        multiple
        resetAfterUpload
        disabled={pending}
        onUploadedMany={handleUploaded}
      />
      {pending && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red">
          <Loader2 size={12} className="animate-spin" /> Attribution de la photo au produit…
        </p>
      )}
      {doneCount > 0 && !pending && duplicates.length === 0 && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckCircle size={12} /> {doneCount === 1 ? "Photo ajoutée au produit." : `${doneCount} photos ajoutées au produit.`}
        </p>
      )}
      {duplicates.length > 0 && <SimilarProductWarning items={duplicates} />}
    </div>
  );
}
