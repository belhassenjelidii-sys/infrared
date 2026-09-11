"use client";

import ImageUploadField from "./ImageUploadField";
import GlassesAttributesPicker from "./GlassesAttributesPicker";

export default function ProductPhotoAndAttributes() {
  return (
    <div className="space-y-6">
      <div>
        <ImageUploadField name="imageUrl" label="Importer / coller l'image" />
        <input name="imageAlt" placeholder="Texte alternatif" className="mt-3 min-h-11 w-full rounded-lg border border-line px-3 py-2 text-sm" />
      </div>
      <div className="border-t border-line pt-5">
        <GlassesAttributesPicker />
      </div>
    </div>
  );
}
