import type { BackgroundRemovalResult } from "./types";

const MAX_PROCESSING_DIMENSION = 1600;
const CORNER_PATCH_FRACTION = 0.04;
const MAX_CORNER_DISTANCE_SQUARED = 14_000;
const MIN_VISIBLE_FRACTION = 0.006;
const MAX_VISIBLE_FRACTION = 0.94;

export type TransparencyAnalysis = {
  format: string | undefined;
  hasAlpha: boolean;
  transparentFraction: number;
  partialFraction: number;
  visibleFraction: number;
  lightOpaqueFraction: number;
  transparentBorderFraction: number;
  opaqueBorderFraction: number;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function median(values: number[]) {
  if (values.length === 0) return 255;
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)];
}

function distanceSquared(a: readonly number[], b: readonly number[]) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

function mix(a: number, b: number, amount: number) {
  return a + (b - a) * amount;
}

/**
 * Measures the alpha channel instead of trusting a `.png` extension or
 * `metadata.hasAlpha`. A usable product cutout needs genuinely transparent
 * pixels, visible subject pixels and a transparent outer border.
 */
export async function analyzeTransparency(buffer: Buffer): Promise<TransparencyAnalysis> {
  const sharp = (await import("sharp")).default;
  const metadata = await sharp(buffer, { limitInputPixels: 40_000 * 40_000 }).metadata();
  const { data, info } = await sharp(buffer, { limitInputPixels: 40_000 * 40_000 })
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let transparent = 0;
  let partial = 0;
  let visible = 0;
  let lightOpaque = 0;
  let transparentBorder = 0;
  let opaqueBorder = 0;
  let borderPixels = 0;
  const borderWidth = Math.max(2, Math.round(Math.min(info.width, info.height) * 0.01));

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if (alpha <= 8) transparent++;
      else if (alpha < 247) partial++;
      if (alpha >= 24) visible++;
      const offset = (y * info.width + x) * info.channels;
      if (
        alpha >= 247
        && data[offset] >= 244
        && data[offset + 1] >= 244
        && data[offset + 2] >= 244
      ) {
        lightOpaque++;
      }

      if (x < borderWidth || y < borderWidth || x >= info.width - borderWidth || y >= info.height - borderWidth) {
        borderPixels++;
        if (alpha <= 8) transparentBorder++;
        if (alpha >= 247) opaqueBorder++;
      }
    }
  }

  const pixels = info.width * info.height;
  return {
    format: metadata.format,
    hasAlpha: metadata.hasAlpha === true,
    transparentFraction: transparent / pixels,
    partialFraction: partial / pixels,
    visibleFraction: visible / pixels,
    lightOpaqueFraction: lightOpaque / pixels,
    transparentBorderFraction: borderPixels ? transparentBorder / borderPixels : 0,
    opaqueBorderFraction: borderPixels ? opaqueBorder / borderPixels : 1,
  };
}

/** Strict check used immediately before storing a final product PNG. */
export function isVerifiedTransparentPng(analysis: TransparencyAnalysis) {
  return analysis.format === "png"
    && analysis.hasAlpha
    && analysis.transparentFraction >= 0.05
    && analysis.visibleFraction >= MIN_VISIBLE_FRACTION
    && analysis.visibleFraction <= MAX_VISIBLE_FRACTION
    && analysis.lightOpaqueFraction <= 0.2
    && analysis.transparentBorderFraction >= 0.96
    && analysis.opaqueBorderFraction <= 0.01;
}

/**
 * Looser input check: accepts an existing cutout whose subject touches an
 * edge, because the normalization/storage stage will add a regular margin.
 * It deliberately rejects old files that only made a white rectangle
 * semi-transparent.
 */
export function hasReusableAlpha(analysis: TransparencyAnalysis) {
  return analysis.hasAlpha
    && analysis.transparentFraction >= 0.15
    && analysis.visibleFraction >= MIN_VISIBLE_FRACTION
    && analysis.visibleFraction <= MAX_VISIBLE_FRACTION
    && analysis.lightOpaqueFraction <= 0.18
    && analysis.transparentBorderFraction >= 0.7
    && analysis.opaqueBorderFraction <= 0.2;
}

/**
 * Removes a light studio background with an alpha matte computed from a
 * bilinear four-corner background estimate. Unlike a simple threshold, the
 * matte keeps translucent lenses and reflections partially transparent.
 * Semi-transparent RGB is decontaminated from the estimated background, so
 * compositing on a dark card does not reveal a white fringe.
 */
export async function removeBackground(buffer: Buffer): Promise<BackgroundRemovalResult> {
  const sharp = (await import("sharp")).default;

  const normalized = sharp(buffer, { limitInputPixels: 40_000 * 40_000 })
    .rotate()
    .flatten({ background: "#ffffff" })
    .toColourspace("srgb")
    .resize(MAX_PROCESSING_DIMENSION, MAX_PROCESSING_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    });

  let raw: Buffer;
  let info: { width: number; height: number; channels: number };
  try {
    ({ data: raw, info } = await normalized.clone().removeAlpha().raw().toBuffer({ resolveWithObject: true }));
  } catch {
    return { success: false, reason: "Impossible de décoder cette image." };
  }

  const { width, height, channels } = info;
  if (!width || !height) {
    return { success: false, reason: "Impossible de lire les dimensions de l'image." };
  }

  const patchWidth = Math.max(2, Math.round(width * CORNER_PATCH_FRACTION));
  const patchHeight = Math.max(2, Math.round(height * CORNER_PATCH_FRACTION));
  const cornerPixels: number[][][] = [[], [], [], []];

  for (let y = 0; y < patchHeight; y++) {
    for (let x = 0; x < patchWidth; x++) {
      const positions = [
        [x, y],
        [width - 1 - x, y],
        [x, height - 1 - y],
        [width - 1 - x, height - 1 - y],
      ];
      positions.forEach(([px, py], index) => {
        const offset = (py * width + px) * channels;
        cornerPixels[index].push([raw[offset], raw[offset + 1], raw[offset + 2]]);
      });
    }
  }

  const corners = cornerPixels.map((pixels) => [0, 1, 2].map((channel) => median(pixels.map((pixel) => pixel[channel]))));
  let maxCornerDistance = 0;
  for (let i = 0; i < corners.length; i++) {
    for (let j = i + 1; j < corners.length; j++) {
      maxCornerDistance = Math.max(maxCornerDistance, distanceSquared(corners[i], corners[j]));
    }
  }
  if (maxCornerDistance > MAX_CORNER_DISTANCE_SQUARED) {
    return { success: false, reason: "Fond non uniforme détecté — le détourage automatique ne serait pas fiable." };
  }

  const meanCornerLightness = corners.flat().reduce((sum, value) => sum + value, 0) / 12;
  if (meanCornerLightness < 170) {
    return { success: false, reason: "Le fond doit être clair et uni pour préserver fidèlement la monture." };
  }

  const rgba = Buffer.alloc(width * height * 4);
  let visiblePixels = 0;

  for (let y = 0; y < height; y++) {
    const fy = height === 1 ? 0 : y / (height - 1);
    for (let x = 0; x < width; x++) {
      const fx = width === 1 ? 0 : x / (width - 1);
      const sourceOffset = (y * width + x) * channels;
      const outputOffset = (y * width + x) * 4;

      const bg = [0, 1, 2].map((channel) => {
        const top = mix(corners[0][channel], corners[1][channel], fx);
        const bottom = mix(corners[2][channel], corners[3][channel], fx);
        return mix(top, bottom, fy);
      });
      const color = [raw[sourceOffset], raw[sourceOffset + 1], raw[sourceOffset + 2]];

      // A light studio gradient may be brighter than the corner estimate;
      // brighter pixels are still background, not foreground. Only colour
      // that is darker than the estimated backdrop contributes here.
      const channelDifference = color.map((value, channel) => Math.max(0, bg[channel] - value) / 255);
      const darkness = Math.max(...color.map((value, channel) => Math.max(0, bg[channel] - value) / Math.max(1, bg[channel])));
      const euclidean = Math.sqrt(channelDifference.reduce((sum, value) => sum + value * value, 0));
      const chroma = (Math.max(...color) - Math.min(...color)) / 255;
      const bgChroma = (Math.max(...bg) - Math.min(...bg)) / 255;

      const signal = Math.max(darkness, euclidean * 0.72, Math.max(0, chroma - bgChroma) * 0.9);
      // JPEG/WebP ringing on an apparently white background regularly
      // produces 1–4% colour differences. Keeping those differences would
      // turn compression noise into coloured speckles inside clear lenses.
      let alpha = clamp01((signal - 0.055) / 0.56);
      alpha = 1 - (1 - alpha) ** 1.35;
      if (signal >= 0.58) alpha = 1;
      if (alpha < 0.055) alpha = 0;

      const alphaByte = Math.round(alpha * 255);
      rgba[outputOffset + 3] = alphaByte;
      if (alphaByte >= 24) visiblePixels++;

      for (let channel = 0; channel < 3; channel++) {
        if (alpha <= 0.055) {
          rgba[outputOffset + channel] = 0;
        } else {
          // A small floor prevents low-opacity antialiasing pixels from
          // amplifying compression noise while still removing the white
          // matte responsible for halos on dark cards.
          const unmixAlpha = Math.max(alpha, 0.18);
          const foreground = (color[channel] - (1 - unmixAlpha) * bg[channel]) / unmixAlpha;
          rgba[outputOffset + channel] = Math.round(Math.max(0, Math.min(255, foreground)));
        }
      }
    }
  }

  const visibleFraction = visiblePixels / (width * height);
  if (visibleFraction < MIN_VISIBLE_FRACTION || visibleFraction > MAX_VISIBLE_FRACTION) {
    return { success: false, reason: "Sujet non détecté avec une confiance suffisante." };
  }

  const pngBuffer = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();

  return {
    success: true,
    buffer: pngBuffer,
    width,
    height,
    subjectFraction: visibleFraction,
  };
}
