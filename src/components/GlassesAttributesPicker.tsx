"use client";

import { useState } from "react";
import { GLASSES_COLORS, GLASSES_SHAPES, parseColorValue, joinColorValue } from "@/lib/glasses-attributes";

type Props = {
  initialColor?: string | null;
  initialShape?: string | null;
  colorFieldName?: string;
  shapeFieldName?: string;
};

export default function GlassesAttributesPicker({
  initialColor,
  initialShape,
  colorFieldName = "color",
  shapeFieldName = "shape",
}: Props) {
  const [colors, setColors] = useState<string[]>(parseColorValue(initialColor));
  const [shape, setShape] = useState<string>(initialShape || "");

  function toggleColor(name: string) {
    setColors((prev) => {
      if (prev.includes(name)) return prev.filter((c) => c !== name);
      if (prev.length >= 2) return [prev[1], name]; // keep it to 2 — drop the oldest
      return [...prev, name];
    });
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name={colorFieldName} value={joinColorValue(colors)} />
      <input type="hidden" name={shapeFieldName} value={shape} />

      <label className="text-xs font-medium">Couleur (jusqu&apos;à 2, ex. Noir et Blanc)</label>

      <div className="flex flex-wrap gap-2">
        {GLASSES_COLORS.map((c) => {
          const selected = colors.includes(c.name);
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => toggleColor(c.name)}
              title={c.name}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs transition-colors ${
                selected ? "border-red bg-red-soft text-red font-medium" : "border-line text-ink/70 hover:border-red/40"
              }`}
            >
              <span
                className="h-3.5 w-3.5 rounded-full border border-black/10"
                style={
                  c.name === "Multicolore"
                    ? { background: "conic-gradient(from 0deg, #DC2626, #EAB308, #16A34A, #2563EB, #7C3AED, #DC2626)" }
                    : { backgroundColor: c.hex }
                }
              />
              {c.name}
            </button>
          );
        })}
      </div>

      <div>
        <label className="text-xs font-medium">Forme</label>
        <select
          value={shape}
          onChange={(e) => setShape(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        >
          <option value="">— Choisir —</option>
          {GLASSES_SHAPES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
