import crypto from "crypto";

/**
 * Encryption utilities for sensitive bank data
 * Uses AES-256-GCM with authenticated encryption
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const keyStr = process.env.TOKEN_ENCRYPTION_KEY;
  if (!keyStr) {
    throw new Error("TOKEN_ENCRYPTION_KEY not set in environment");
  }

  // Key should be 32 bytes (256 bits) for AES-256
  // If it's a hex string, decode it; otherwise use as-is
  if (keyStr.length === 64) {
    return Buffer.from(keyStr, "hex");
  } else if (keyStr.length === 32) {
    return Buffer.from(keyStr);
  } else {
    // Pad or hash to 32 bytes
    return crypto.createHash("sha256").update(keyStr).digest();
  }
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * Returns: base64(IV + ciphertext + authTag)
 */
export function encryptSensitiveData(plaintext: string): string {
  if (!plaintext) return "";

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Combine IV + ciphertext + authTag
    const combined = Buffer.concat([
      iv,
      Buffer.from(encrypted, "hex"),
      authTag,
    ]);

    return combined.toString("base64");
  } catch (error) {
    throw new Error(
      `Failed to encrypt data: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 * Input: base64(IV + ciphertext + authTag)
 */
export function decryptSensitiveData(ciphertext: string): string {
  if (!ciphertext) return "";

  try {
    const key = getEncryptionKey();

    // Decode from base64
    const combined = Buffer.from(ciphertext, "base64");

    // Extract IV, ciphertext, and authTag
    const iv = combined.slice(0, IV_LENGTH);
    const authTag = combined.slice(-TAG_LENGTH);
    const encrypted = combined.slice(IV_LENGTH, -TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error(
      `Failed to decrypt data: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Encrypt bank transaction particulars
 * (Sensitive transaction reference data)
 */
export function encryptBankParticulars(value: string): string {
  return encryptSensitiveData(value);
}

/**
 * Decrypt bank transaction particulars
 */
export function decryptBankParticulars(encrypted: string): string {
  return decryptSensitiveData(encrypted);
}

/**
 * Encrypt bank transaction reference
 * (Account numbers, payment references, etc)
 */
export function encryptBankReference(value: string): string {
  return encryptSensitiveData(value);
}

/**
 * Decrypt bank transaction reference
 */
export function decryptBankReference(encrypted: string): string {
  return decryptSensitiveData(encrypted);
}
