/**
 * Password Hashing Utilities
 *
 * Simple SHA-256 hashing for boot passwords to use as tenant identifiers.
 * NOT for cryptographic security - just for session isolation between families.
 */

/**
 * Hash a password using SHA-256 (browser-compatible)
 * Returns hex string representation
 *
 * Note: Password normalization (uppercase, trim) should be done by caller
 * (e.g., PasswordPrompt component) before hashing
 */
export async function hashPassword(password: string): Promise<string> {
  // Try Node.js crypto first (works in Node.js and Jest environments)
  try {
    // Dynamic import for Node.js crypto (server-side and test environments)
    const crypto = eval('require("crypto")');
    return crypto.createHash("sha256").update(password).digest("hex");
  } catch {
    // Not in Node.js environment, try browser crypto
  }

  // Browser environment with SubtleCrypto
  if (
    typeof window !== "undefined" &&
    typeof window.crypto !== "undefined" &&
    typeof window.crypto.subtle !== "undefined"
  ) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Fallback (not secure, just for session isolation)
  // This should never be reached in production
  console.warn("No SHA-256 implementation available, using base64 fallback");
  return Buffer.from(password).toString("base64");
}
