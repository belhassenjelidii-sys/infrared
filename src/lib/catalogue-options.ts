export type ColorOption = { label: string; swatch: string };

export const FRAME_COLORS: ColorOption[] = [
  { label: "Noir", swatch: "#111111" }, { label: "Blanc", swatch: "#ffffff" }, { label: "Or", swatch: "#c9a227" }, { label: "Argent", swatch: "#b7bcc2" },
  { label: "Havane", swatch: "linear-gradient(135deg,#5a2d18,#d09a57,#6d3820)" }, { label: "Écaille", swatch: "linear-gradient(135deg,#2b170d 0 28%,#b97832 28% 48%,#4d2713 48% 70%,#d5a05c 70%)" },
  { label: "Transparent", swatch: "linear-gradient(135deg,#fff,#dbeafe)" }, { label: "Gris", swatch: "#7b8188" }, { label: "Bleu", swatch: "#2855a5" }, { label: "Vert", swatch: "#357a4a" },
  { label: "Marron", swatch: "#6b4423" }, { label: "Rouge", swatch: "#b4232d" }, { label: "Rose", swatch: "#d9829b" }, { label: "Violet", swatch: "#74449b" },
  { label: "Beige", swatch: "#d7c5a5" }, { label: "Orange", swatch: "#df7b22" }, { label: "Multicolore", swatch: "conic-gradient(#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7,#ef4444)" },
];
export const LENS_COLORS: ColorOption[] = FRAME_COLORS.map((color) => color.label === "Gris" ? { ...color, swatch: "#6f7478" } : color);
export const FRAME_SIZES = ["47-19","48-20","49-20","50-20","51-19","51-20","52-18","52-19","52-20","53-18","53-19","53-20","54-17","54-18","54-19","54-20","55-14","55-17","55-18","55-19","56-16","56-17","56-18","57-16","57-17","58-14","58-15","58-16","59-14","60-14","62-14"] as const;
export const TEMPLE_LENGTHS = [125,130,135,140,145,150,155] as const;
export const COMMERCIAL_SIZES = ["Small","Medium","Large","XL"] as const;
export function commercialSizeFor(size: string) { const width = Number(size.split("-")[0]); if (!Number.isFinite(width)) return ""; if (width <= 50) return "Small"; if (width <= 56) return "Medium"; if (width <= 59) return "Large"; return "XL"; }
export function colorSwatch(label: string | null | undefined, lens = false) { const options = lens ? LENS_COLORS : FRAME_COLORS; const aliases: Record<string,string> = { "doré": "or", "argenté": "argent" }; const lower = label?.toLocaleLowerCase("fr") ?? ""; return options.find((option) => option.label.toLocaleLowerCase("fr") === (aliases[lower] ?? lower))?.swatch ?? "#d1d5db"; }

/** Compatibility helper for existing imports; new variants store the family directly. */
export function colorFamilyFor(label: string, lens = false) { const normalized=label.toLocaleLowerCase("fr"); if(normalized==="havane") return "Écaille"; if(lens&&normalized==="gris foncé") return "Gris"; const options=lens?LENS_COLORS:FRAME_COLORS; return options.find((option)=>option.label.toLocaleLowerCase("fr")===normalized)?.label ?? null; }
