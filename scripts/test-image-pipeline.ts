import fs from "node:fs";
import path from "node:path";
import { processImage } from "../src/lib/image-pipeline/pipeline";

const UPLOADS_DIR = path.join(__dirname, "..", "public", "uploads");

function fmtKB(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} Ko`;
}

async function testFile(label: string, filePath: string, centerSubject: boolean) {
  console.log(`\n=== ${label} ===`);
  console.log("file:", filePath);
  try {
    const buffer = fs.readFileSync(filePath);
    console.log("input size:", fmtKB(buffer.length));
    const t0 = Date.now();
    const output = await processImage(buffer, { folder: "products", centerSubject });
    const ms = Date.now() - t0;
    console.log(`processed in ${ms}ms`);
    console.log("archival:", output.archival.format, `${output.archival.width}x${output.archival.height}`, fmtKB(output.archival.size));
    console.log("optimized:", output.optimized.format, `${output.optimized.width}x${output.optimized.height}`, fmtKB(output.optimized.size));
    console.log("avif:", output.avif ? `${output.avif.format} ${output.avif.width}x${output.avif.height} ${fmtKB(output.avif.size)}` : "not kept (no real size benefit over webp)");
    console.log("centered (cropped to subject):", output.centered);
    console.log(`size reduction: ${(100 - (output.optimized.size / buffer.length) * 100).toFixed(1)}%`);

    // Write outputs to disk so they can be visually inspected.
    const outDir = path.join(__dirname, "pipeline-test-output");
    fs.mkdirSync(outDir, { recursive: true });
    const base = path.basename(filePath).replace(/\.[a-z]+$/i, "");
    fs.writeFileSync(path.join(outDir, `${base}-archival.jpg`), output.archival.buffer);
    fs.writeFileSync(path.join(outDir, `${base}-optimized.webp`), output.optimized.buffer);
    if (output.avif) fs.writeFileSync(path.join(outDir, `${base}-optimized.avif`), output.avif.buffer);
  } catch (err) {
    console.log("THROWN ERROR:", err instanceof Error ? err.message : err);
  }
}

async function testInvalid(label: string, buffer: Buffer) {
  console.log(`\n=== ${label} ===`);
  try {
    await processImage(buffer, { folder: "products", centerSubject: true });
    console.log("UNEXPECTED: no error thrown");
  } catch (err) {
    console.log("correctly rejected:", err instanceof Error ? err.message : err);
  }
}

async function main() {
  const realPhotos = fs.readdirSync(UPLOADS_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  for (const f of realPhotos) {
    await testFile(`Photo réelle : ${f}`, path.join(UPLOADS_DIR, f), true);
  }

  // A non-product image (store/brand style upload) with centering disabled.
  if (realPhotos[0]) {
    await testFile("Même photo, sans centrage (comme pour boutiques/marques)", path.join(UPLOADS_DIR, realPhotos[0]), false);
  }

  // Format robustness: PNG and WEBP synthesized from the same source via sharp itself.
  const sharp = (await import("sharp")).default;
  if (realPhotos[0]) {
    const src = fs.readFileSync(path.join(UPLOADS_DIR, realPhotos[0]));
    const pngPath = path.join(UPLOADS_DIR, "_test-converted.png");
    const webpPath = path.join(UPLOADS_DIR, "_test-converted.webp");
    fs.writeFileSync(pngPath, await sharp(src).resize(800).png().toBuffer());
    fs.writeFileSync(webpPath, await sharp(src).resize(800).webp().toBuffer());
    await testFile("Format PNG", pngPath, true);
    await testFile("Format WEBP", webpPath, true);
    fs.unlinkSync(pngPath);
    fs.unlinkSync(webpPath);
  }

  // Error handling
  await testInvalid("Fichier vide", Buffer.alloc(0));
  await testInvalid("Fichier texte déguisé en image", Buffer.from("this is not an image, just text pretending"));
  await testInvalid("Image trop petite (1x1 PNG)", Buffer.from(
    "89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c4944415478da6360606060000000050001a5f645400000000049454e44ae426082",
    "hex"
  ));
}

main();
