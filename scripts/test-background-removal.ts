import fs from "node:fs";
import path from "node:path";
import { removeBackground } from "../src/lib/image-pipeline/background-remover";

const SRC = path.join(__dirname, "..", "public", "uploads", "1786493112200-014836de.jpg");
const OUT = path.join(__dirname, "bg-removal-test-output");

async function main() {
  const sharp = (await import("sharp")).default;
  fs.mkdirSync(OUT, { recursive: true });

  const original = fs.readFileSync(SRC);

  // First, cut the subject out of the real white-background photo so we
  // have a real RGBA cutout to recomposite onto different backgrounds —
  // gives us realistic multi-background test cases from the same subject.
  const firstPass = await removeBackground(original);
  if (!firstPass.success) {
    console.log("Could not prepare test fixtures — first pass failed:", firstPass.reason);
    return;
  }
  fs.writeFileSync(path.join(OUT, "0-cutout-reference.png"), firstPass.buffer);

  const { width, height, buffer: cutoutBuffer } = firstPass;

  async function compositeOnto(bg: Buffer) {
    return sharp(bg).resize(width, height).composite([{ input: cutoutBuffer }]).jpeg({ quality: 95 }).toBuffer();
  }

  const whiteBg = await sharp({ create: { width, height, channels: 3, background: "#ffffff" } }).jpeg().toBuffer();
  const grayBg = await sharp({ create: { width, height, channels: 3, background: "#9ca3af" } }).jpeg().toBuffer();
  const coloredBg = await sharp({ create: { width, height, channels: 3, background: "#2563eb" } }).jpeg().toBuffer();

  // Simulated shadow: a darker soft patch under the frame, on white.
  const shadowPatch = await sharp({
    create: { width: Math.round(width * 0.6), height: Math.round(height * 0.25), channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.25 } },
  }).png().toBuffer();
  const whiteWithShadow = await sharp(whiteBg)
    .composite([{ input: shadowPatch, left: Math.round(width * 0.2), top: Math.round(height * 0.72) }])
    .composite([{ input: cutoutBuffer }])
    .jpeg({ quality: 95 })
    .toBuffer();

  const cases: [string, Buffer][] = [
    ["fond blanc (photo originale reelle)", original],
    ["fond blanc (composite)", await compositeOnto(whiteBg)],
    ["fond gris", await compositeOnto(grayBg)],
    ["fond colore bleu", await compositeOnto(coloredBg)],
    ["fond blanc avec ombre simulee", whiteWithShadow],
  ];

  for (const [label, buf] of cases) {
    console.log(`\n=== ${label} ===`);
    const t0 = Date.now();
    const result = await removeBackground(buf);
    const ms = Date.now() - t0;
    if (result.success) {
      console.log(`OK in ${ms}ms - ${result.width}x${result.height}, subject fraction: ${(result.subjectFraction * 100).toFixed(1)}%`);
      const filename = `${label.replace(/[^a-z0-9]+/gi, "-")}.png`;
      fs.writeFileSync(path.join(OUT, filename), result.buffer);
    } else {
      console.log(`FALLBACK (no removal) in ${ms}ms - reason: ${result.reason}`);
    }
  }
}

main();
