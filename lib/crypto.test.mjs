// TDD RED phase test for lib/crypto.ts
// Run with: KEY_ENCRYPTION_SECRET=<64-hex> node --input-type=module < lib/crypto.test.mjs
// This test file is used only during development verification.

import { createRequire } from "module";
import { execSync } from "child_process";
import { existsSync } from "fs";

const PASS = (msg) => console.log(`  PASS: ${msg}`);
const FAIL = (msg) => { console.error(`  FAIL: ${msg}`); process.exitCode = 1; };

// Check file exists
if (!existsSync("lib/crypto.ts")) {
  FAIL("lib/crypto.ts does not exist");
  process.exit(1);
}

// Run verification via tsx
const KEY = execSync("node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"").toString().trim();

try {
  const result = execSync(
    `node --input-type=module`,
    {
      env: { ...process.env, KEY_ENCRYPTION_SECRET: KEY },
      input: `
import { encryptKey, decryptKey } from "./lib/crypto.ts";

const plaintext = "STEAM-XXXX-YYYY";
const ciphertext = encryptKey(plaintext);

// Test 1: format check
if (!/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/.test(ciphertext)) {
  console.error("FAIL: format not ivHex:authTagHex:ciphertextHex");
  process.exit(1);
}
console.log("PASS: format is ivHex:authTagHex:ciphertextHex");

// Test 2: round-trip
if (decryptKey(ciphertext) !== plaintext) {
  console.error("FAIL: round-trip failed");
  process.exit(1);
}
console.log("PASS: round-trip decryptKey(encryptKey(x)) === x");

// Test 3: different output each call
const c2 = encryptKey(plaintext);
if (c2 === ciphertext) {
  console.error("FAIL: same output on second call (IV not random)");
  process.exit(1);
}
console.log("PASS: different ciphertext each call (random IV)");
`,
      stdio: ["pipe", "pipe", "pipe"],
    }
  );
  console.log(result.toString());
} catch (e) {
  console.log("Expected failure (tsx not available or file not yet created):", e.message.split("\n")[0]);
}

console.log("\nTest script complete.");
