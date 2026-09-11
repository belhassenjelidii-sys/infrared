import { GLASSES_SHAPES } from "./glasses-attributes";
export const SHAPES = [...new Set([...GLASSES_SHAPES, "Aviateur / Pilote", "Rectangle", "Clubmaster", "Pantos", "Œil de chat", "Masque", "Hexagonale", "Octogonale", "Pillow", "Sans contour"])];
export const MATERIALS = ["Métal", "Acétate", "Plastique", "Nylon", "Titane", "Acier", "Métal + Acétate", "Acétate recyclé", "Autre"];
export const COLOR_FAMILIES = ["Noir", "Blanc", "Gris", "Marron", "Beige", "Or", "Argent", "Écaille", "Bleu", "Rouge", "Bordeaux", "Vert", "Rose", "Violet", "Rose/Violet", "Jaune", "Orange", "Transparent", "Multicolore"];
export const FRAME_TYPES = ["Cerclée", "Demi-cerclée", "Percée / sans contour"];
export function parseSize(raw: string) {
  const value = raw.trim();
  if (!value) return { size: null, lensWidth: null, bridgeWidth: null, templeLength: null };
  const match = value.match(/^(\d{2,3})\s*[-–]\s*(\d{1,2})(?:\s*[-–]\s*(\d{2,3}))?$/);
  if (!match) throw new Error("Taille invalide : utilisez 58-14-135 ou 51-19.");
  const lensWidth = Number(match[1]), bridgeWidth = Number(match[2]), templeLength = match[3] ? Number(match[3]) : null;
  if (lensWidth < 20 || lensWidth > 100 || bridgeWidth < 5 || bridgeWidth > 40 || (templeLength !== null && (templeLength < 80 || templeLength > 180))) throw new Error("Vérifiez les dimensions de la monture.");
  return { size: [lensWidth,bridgeWidth,templeLength].filter((v)=>v!==null).join("-"), lensWidth, bridgeWidth, templeLength };
}
export function validEan(value: string) {
  if (!value) return true;
  if (!/^\d{13}$/.test(value)) return false;
  const sum = [...value.slice(0,12)].reduce((n,d,i)=>n+Number(d)*(i%2?3:1),0);
  return (10-sum%10)%10===Number(value[12]);
}
export function optionalNumber(raw: unknown, label: string, min: number, max: number, integer = true): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new Error(`${label} doit être compris entre ${min} et ${max}.`);
  return value;
}
export function resolveCharacteristics(variant: {shapeOverride?:string|null; materialOverride?:string|null; materialFamilyOverride?:string|null; genderOverride?:string|null; frameTypeOverride?:string|null; styleOverride?:string|null; shape?:string|null; target?:string|null}, model?: {shape?:string|null; materialLabel?:string|null; materialFamily?:string|null; gender?:string|null; frameType?:string|null; style?:string|null}|null) {
  return { shape: variant.shapeOverride ?? model?.shape ?? variant.shape ?? null, materialLabel: variant.materialOverride ?? model?.materialLabel ?? null, materialFamily: variant.materialFamilyOverride ?? model?.materialFamily ?? null, gender: variant.genderOverride ?? model?.gender ?? variant.target ?? null, frameType: variant.frameTypeOverride ?? model?.frameType ?? null, style: variant.styleOverride ?? model?.style ?? null };
}
