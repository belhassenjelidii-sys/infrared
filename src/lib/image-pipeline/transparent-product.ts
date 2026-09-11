import { analyzeTransparency, isVerifiedTransparentPng } from "./background-remover";
import type { GeneratedAsset } from "./types";

const MAX_DIMENSION = 2400;
const SUBJECT_FILL = 0.84;
const MIN_ALPHA_FOR_BOUNDS = 12;

/**
 * Centers an already-cut-out product on a fully transparent canvas while
 * preserving its aspect ratio. The final verification makes it impossible
 * to store a plain RGB PNG or a file whose alpha never becomes transparent.
 */
export async function prepareTransparentProductPng(buffer: Buffer): Promise<GeneratedAsset> {
  const sharp = (await import("sharp")).default;
  const orientedBuffer = await sharp(buffer, { limitInputPixels: 40_000 * 40_000 })
    .rotate()
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();

  const { data, info } = await sharp(orientedBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if (alpha < MIN_ALPHA_FOR_BOUNDS) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    throw new Error("Le détourage ne contient aucun sujet visible.");
  }

  const subject = await sharp(orientedBuffer)
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .resize(Math.max(1, Math.floor(info.width * SUBJECT_FILL)), Math.max(1, Math.floor(info.height * SUBJECT_FILL)), {
      fit: "inside",
      withoutEnlargement: false,
      kernel: "lanczos3",
    })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer({ resolveWithObject: true });

  const left = Math.floor((info.width - subject.info.width) / 2);
  const top = Math.floor((info.height - subject.info.height) / 2);
  const finalBuffer = await sharp({
    create: {
      width: info.width,
      height: info.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: subject.data, left, top }])
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();

  const analysis = await analyzeTransparency(finalBuffer);
  if (!isVerifiedTransparentPng(analysis)) {
    throw new Error("Le fichier généré ne contient pas un canal alpha transparent valide.");
  }

  return {
    buffer: finalBuffer,
    format: "png",
    width: info.width,
    height: info.height,
    size: finalBuffer.length,
  };
}
