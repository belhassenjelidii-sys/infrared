import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

test("SSRF remote URL policy validates destinations and pins DNS", () => {
  const code = `
    import assert from "node:assert/strict";
    import { __remoteUrlTest, isForbiddenRemoteIp } from "./src/lib/security/remote-url.ts";
    const publicLookup = async () => [{ address: "93.184.216.34", family: 4 }];
    const privateLookup = async () => [{ address: "127.0.0.1", family: 4 }];
    for (const ip of ["127.0.0.1", "10.2.3.4", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.1.1", "::", "::1", "fc00::1", "fd00::1", "fe80::1", "fec0::1", "ff00::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "::ffff:a00:1", "::ffff:c0a8:101"]) assert.equal(isForbiddenRemoteIp(ip), true, ip);
    assert.equal(isForbiddenRemoteIp("93.184.216.34"), false);
    const safe = await __remoteUrlTest.resolveDestination("https://example.test/image.jpg", publicLookup);
    assert.deepEqual(safe.addresses, ["93.184.216.34"]);
    await assert.rejects(__remoteUrlTest.resolveDestination("http://localhost/a", publicLookup));
    await assert.rejects(__remoteUrlTest.resolveDestination("http://127.0.0.1/a", publicLookup));
    await assert.rejects(__remoteUrlTest.resolveDestination("http://[::1]/a", publicLookup));
    await __remoteUrlTest.resolveDestination("https://public.test/start", publicLookup);
    await assert.rejects(__remoteUrlTest.resolveDestination("https://redirected.test/private", privateLookup));
    const lookup = __remoteUrlTest.pinnedLookup(["93.184.216.34"]);
    const result = await new Promise((resolve, reject) => lookup("rebound.test", {}, (error, address, family) => error ? reject(error) : resolve({ address, family })));
    assert.deepEqual(result, { address: "93.184.216.34", family: 4 });
    const pinned = __remoteUrlTest.pinnedLookup(["93.184.216.34", "2606:2800:220:1:248:1893:25c8:1946"]);
    const all = await new Promise((resolve, reject) => pinned("rebound.test", { all: true }, (error, records) => error ? reject(error) : resolve(records)));
    assert.deepEqual(all, [{ address: "93.184.216.34", family: 4 }, { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 }]);
  `;
  assert.doesNotThrow(() => execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", code], { cwd: process.cwd(), stdio: "pipe" }));
});
