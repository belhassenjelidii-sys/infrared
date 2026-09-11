import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import {
  analyzeTransparency,
  hasReusableAlpha,
  isVerifiedTransparentPng,
  removeBackground,
} from "../src/lib/image-pipeline/background-remover";
import { prepareTransparentProductPng } from "../src/lib/image-pipeline/transparent-product";

async function whiteStudioGlasses() {
  const svg = Buffer.from(`
    <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="400" fill="white"/>
      <g fill="none" stroke="#171717" stroke-width="34" stroke-linejoin="round">
        <rect x="105" y="120" width="235" height="145" rx="42"/>
        <rect x="460" y="120" width="235" height="145" rx="42"/>
        <path d="M340 170 C390 135 410 135 460 170"/>
        <path d="M105 150 L38 112 M695 150 L762 112"/>
      </g>
      <path d="M125 145 L315 145" stroke="#777" stroke-width="5" opacity=".55"/>
    </svg>
  `);
  return sharp(svg).jpeg({ quality: 94 }).toBuffer();
}

test("le détourage enlève le blanc extérieur et l'intérieur des verres", async () => {
  const result = await removeBackground(await whiteStudioGlasses());
  assert.equal(result.success, true);
  if (!result.success) return;

  const prepared = await prepareTransparentProductPng(result.buffer);
  const analysis = await analyzeTransparency(prepared.buffer);
  assert.equal(isVerifiedTransparentPng(analysis), true);
  assert.ok(analysis.transparentFraction > 0.6);
  assert.ok(analysis.lightOpaqueFraction < 0.02);
  assert.ok(analysis.visibleFraction > 0.02);
});

test("un PNG avec un faux fond blanc interne n'est pas réutilisé tel quel", async () => {
  const fakeCutout = await sharp({
    create: { width: 600, height: 400, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{
      input: Buffer.from('<svg width="400" height="260" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="260" fill="white"/></svg>'),
      left: 100,
      top: 70,
    }])
    .png()
    .toBuffer();
  const analysis = await analyzeTransparency(fakeCutout);
  assert.ok(analysis.transparentFraction > 0.15);
  assert.ok(analysis.lightOpaqueFraction > 0.18);
  assert.equal(hasReusableAlpha(analysis), false);
});

test("un fond coloré est refusé au lieu de produire un faux détourage", async () => {
  const blue = await sharp({
    create: { width: 600, height: 300, channels: 3, background: "#2563eb" },
  }).png().toBuffer();
  const result = await removeBackground(blue);
  assert.equal(result.success, false);
});

test("une vraie image WEBP sur fond blanc est décodée et détourée", async () => {
  const webp = await sharp(await whiteStudioGlasses()).webp({ quality: 88 }).toBuffer();
  const result = await removeBackground(webp);
  assert.equal(result.success, true);
  if (!result.success) return;

  const prepared = await prepareTransparentProductPng(result.buffer);
  const analysis = await analyzeTransparency(prepared.buffer);
  assert.equal(isVerifiedTransparentPng(analysis), true);
  assert.equal(analysis.format, "png");
});
