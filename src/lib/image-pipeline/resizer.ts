import "server-only";
import type { Sharp } from "sharp";

type Region = { left: number; top: number; width: number; height: number };

function distance2(a: readonly number[], b: readonly number[]) {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

const BACKGROUND_THRESHOLD = 40 * 40 * 3;
const PROBE_SIZE = 150;
const PADDING_FRACTION = 0.15; // extra breathing room around the detected subject
const MIN_FOREGROUND_FRACTION = 0.02; // below this, treat as "no clear subject" — nothing to center on
const MAX_FOREGROUND_FRACTION = 0.92; // above this, the "subject" is basically the whole frame already — cropping would risk cutting it off

/**
 * Estimates a padded bounding box around the product, via the same
 * background-subtraction idea used elsewhere in this codebase — but here
 * purely for composition (where to crop), not classification. Returns
 * `null` whenever the signal isn't clean enough to trust (too little or
 * too much detected "foreground", or a degenerate result) — RECADRAGE is
 * explicitly best-effort ("si possible"): a skipped crop is always safer
 * than a bad one.
 */
async function detectForegroundRegion(
  pipeline: Sharp,
  fullWidth: number,
  fullHeight: number
): Promise<Region | null> {
  let data: Buffer, info: { width: number; height: number; channels: number };
  try {
    ({ data, info } = await pipeline
      .clone()
      .resize(PROBE_SIZE, PROBE_SIZE, { fit: "inside" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true }));
  } catch {
    return null; // probing failed — just skip cropping, don't fail the whole pipeline over it
  }

  const { width: pw, height: ph, channels } = info;
  const at = (x: number, y: number): [number, number, number] => {
    const i = (y * pw + x) * channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const corners = [at(1, 1), at(pw - 2, 1), at(1, ph - 2), at(pw - 2, ph - 2)];
  const bg: [number, number, number] = [
    Math.round(corners.reduce((s, c) => s + c[0], 0) / 4),
    Math.round(corners.reduce((s, c) => s + c[1], 0) / 4),
    Math.round(corners.reduce((s, c) => s + c[2], 0) / 4),
  ];

  let minX = pw, maxX = -1, minY = ph, maxY = -1, fgCount = 0;
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      if (distance2(at(x, y), bg) < BACKGROUND_THRESHOLD) continue;
      fgCount++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  const totalPixels = pw * ph;
  const fgFraction = fgCount / totalPixels;
  if (maxX < minX || fgFraction < MIN_FOREGROUND_FRACTION || fgFraction > MAX_FOREGROUND_FRACTION) {
    return null;
  }

  const fracLeft = minX / pw;
  const fracTop = minY / ph;
  const fracRight = (maxX + 1) / pw;
  const fracBottom = (maxY + 1) / ph;
  const bboxW = fracRight - fracLeft;
  const bboxH = fracBottom - fracTop;

  const left = Math.max(0, fracLeft - bboxW * PADDING_FRACTION);
  const top = Math.max(0, fracTop - bboxH * PADDING_FRACTION);
  const right = Math.min(1, fracRight + bboxW * PADDING_FRACTION);
  const bottom = Math.min(1, fracBottom + bboxH * PADDING_FRACTION);

  const cropLeft = Math.round(left * fullWidth);
  const cropTop = Math.round(top * fullHeight);
  const cropWidth = Math.min(fullWidth - cropLeft, Math.round((right - left) * fullWidth));
  const cropHeight = Math.min(fullHeight - cropTop, Math.round((bottom - top) * fullHeight));

  if (cropWidth < 20 || cropHeight < 20) return null;

  return { left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight };
}

/**
 * RECADRAGE + resize stage. When `centerSubject` is on and a clean
 * foreground region is found, crops to it (padded) before resizing —
 * this is what "centre la lunette" in practice: trim the excess plain
 * background a product photo often has around it, rather than any face/
 * keypoint-based centering. Always falls back to the uncropped, simply
 * resized image when detection isn't confident.
 */
export async function centerAndResize(
  pipeline: Sharp,
  currentWidth: number,
  currentHeight: number,
  options: { centerSubject: boolean; maxDimension: number }
): Promise<{ pipeline: Sharp; centered: boolean }> {
  let working = pipeline;
  let centered = false;

  if (options.centerSubject) {
    const region = await detectForegroundRegion(pipeline, currentWidth, currentHeight);
    if (region) {
      working = pipeline.clone().extract(region);
      centered = true;
    }
  }

  working = working.resize(options.maxDimension, options.maxDimension, {
    fit: "inside",
    withoutEnlargement: true,
  });

  return { pipeline: working, centered };
}
