import { execFileSync } from "node:child_process";
import test from "node:test";

test("le stockage local refuse toute sortie du dossier uploads", () => {
  const source = `
    import assert from "node:assert/strict";
    import { readFile, rm } from "node:fs/promises";
    import { getUploadStorageDriver, localUploadsDirectory, resolveLocalUploadPath, saveImageLocally } from "./src/lib/uploads.ts";

    process.env.NODE_ENV = "development";
    process.env.UPLOAD_STORAGE = "local";
    assert.equal(getUploadStorageDriver(), "local");
    const root = localUploadsDirectory();
    const safe = resolveLocalUploadPath("safe-file.webp");
    assert.ok(safe.startsWith(root));
    for (const input of ["../secret", "..\\\\secret", "/etc/passwd", "C:\\\\Windows\\\\win.ini", "%2e%2e%2fsecret", "%252e%252e%252fsecret", "nested/file.webp"]) {
      assert.throws(() => resolveLocalUploadPath(input));
    }
    const url = await saveImageLocally(Buffer.from("local-storage-test"), "image/webp");
    const file = resolveLocalUploadPath(url.slice("/uploads/".length));
    assert.equal((await readFile(file)).toString(), "local-storage-test");
    await rm(file, { force: true });
    process.env.UPLOAD_STORAGE = "invalid";
    assert.throws(() => getUploadStorageDriver());
  `;
  execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", source], {
    cwd: process.cwd(),
    stdio: "pipe",
  });
});
