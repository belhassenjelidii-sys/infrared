import { execFileSync } from "node:child_process";
import test from "node:test";

test("le journal applique ses filtres, masque les secrets et reste inaccessible sans permission", () => {
  const source = `
    import assert from "node:assert/strict";
    import { can } from "./src/lib/permissions.ts";
    import { buildAuditWhere } from "./src/lib/audit-journal.ts";
    import { sanitizeAuditData, writeAuditLog } from "./src/lib/audit-log.ts";
    const where = buildAuditWhere({ tab: "orders", result: "SUCCESS", entityId: "IR-123", from: "2026-09-01", to: "2026-09-02" });
    assert.deepEqual(where.category, { in: ["ORDERS"] });
    assert.equal(where.result, "SUCCESS");
    assert.deepEqual(where.entityId, { contains: "IR-123", mode: "insensitive" });
    assert.ok("createdAt" in where);
    assert.equal(can({ role: "COMMERCIAL" }, "audit.view"), false);
    assert.equal(can({ role: "SUPER_ADMIN" }, "audit.view"), true);
    const captured = [];
    const db = { auditLog: { create: async ({ data }) => { captured.push(data); return {}; } } };
    const safe = sanitizeAuditData({ password: "secret", apiKey: "key", publicToken: "token", visible: "ok" });
    assert.deepEqual(safe, { password: "[masqué]", apiKey: "[masqué]", publicToken: "[masqué]", visible: "ok" });
    await writeAuditLog(db, { category: "SECURITY", action: "security.test", entityType: "Test", metadata: { password: "secret", visible: "ok" }, request: { ip: "127.0.0.1" } });
    assert.equal(captured.length, 1);
    assert.equal(captured[0].metadata.password, "[masqué]");
    assert.equal(captured[0].metadata.visible, "ok");
    assert.equal(typeof db.auditLog.update, "undefined");
    assert.equal(typeof db.auditLog.delete, "undefined");
  `;
  execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", source], { cwd: process.cwd(), stdio: "pipe" });
});