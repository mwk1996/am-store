import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_HEX = process.env.KEY_ENCRYPTION_SECRET ?? "";
const KEY_BUF = Buffer.from(KEY_HEX, "hex");

// Startup guard — fail fast with a clear message
if (KEY_BUF.length !== 32) {
  throw new Error(
    `KEY_ENCRYPTION_SECRET must be exactly 64 hex characters (32 bytes). ` +
      `Got ${KEY_HEX.length} hex chars (${KEY_BUF.length} bytes). ` +
      `Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  );
}

/**
 * Encrypts a plaintext key value using AES-256-GCM.
 * Returns a string in the format: ivHex:authTagHex:ciphertextHex
 * Each call produces a unique ciphertext (random IV).
 */
export function encryptKey(plaintext: string): string {
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, KEY_BUF, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16-byte GCM auth tag
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts a ciphertext produced by encryptKey.
 * Throws if the ciphertext is malformed or has been tampered with (auth tag mismatch).
 */
export function decryptKey(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error(
      "Invalid ciphertext format — expected ivHex:authTagHex:ciphertextHex"
    );
  }
  const [ivHex, authTagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, KEY_BUF, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8"
  );
}
