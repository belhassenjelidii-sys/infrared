import { execFileSync } from "node:child_process";
import test from "node:test";

test("TOTP, codes de récupération et exigence 2FA suivent les règles de sécurité", () => {
  const source = `
    import assert from "node:assert/strict";
    import * as OTPAuth from "otpauth";
    import { generateTotpSecret, verifyTotp, generateRecoveryCodes, hashRecoveryCodes, verifyRecoveryCode, mustEnrollTwoFactor, shouldRequireTwoFactorLogin } from "./src/lib/two-factor.ts";
    const secret = generateTotpSecret();
    const otp = new OTPAuth.TOTP({ issuer: "InfraRed Optic Store", label: "admin@infrared.tn", algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret) });
    const code = otp.generate();
    assert.equal(verifyTotp(secret, "admin@infrared.tn", code), true);
    assert.equal(verifyTotp(secret, "admin@infrared.tn", "000000"), false);
    assert.equal(shouldRequireTwoFactorLogin({ twoFactorEnabled: false }), false);
    assert.equal(shouldRequireTwoFactorLogin({ twoFactorEnabled: true }), true);
    const codes = generateRecoveryCodes(8);
    assert.equal(codes.length, 8);
    const hashes = hashRecoveryCodes(codes);
    const once = verifyRecoveryCode(hashes, codes[0]);
    assert.equal(once.valid, true);
    assert.equal(verifyRecoveryCode(once.remaining, codes[0]).valid, false);
    assert.equal(verifyRecoveryCode(hashes, "FAUX-CODE").valid, false);
    process.env.REQUIRE_ADMIN_2FA = "false";
    assert.equal(mustEnrollTwoFactor({ role: "ADMIN", twoFactorEnabled: false }), false);
    process.env.REQUIRE_ADMIN_2FA = "true";
    assert.equal(mustEnrollTwoFactor({ role: "ADMIN", twoFactorEnabled: false }), true);
    assert.equal(mustEnrollTwoFactor({ role: "ADMIN", twoFactorEnabled: true }), false);
    assert.equal(mustEnrollTwoFactor({ role: "GESTIONNAIRE", twoFactorEnabled: false }), true);
    assert.equal(mustEnrollTwoFactor({ role: "GESTIONNAIRE", twoFactorEnabled: true }), false);
    assert.equal(mustEnrollTwoFactor({ role: "COMMERCIAL", twoFactorEnabled: false }), false);
  `;
  execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", source], { cwd: process.cwd(), stdio: "pipe" });
});
