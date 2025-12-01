/**
 * Code Generator for Multi-Tenant Family Authentication
 *
 * Generates two types of codes:
 * 1. Kid Code: Theme-based, memorable (e.g., "NISSEKRAFT2024")
 * 2. Parent Code: Secure, alphanumeric (e.g., "NORDPOL-8N4K2")
 */

// Snøfall-themed vocabulary for kid codes (split into combinable parts)
const SNOFALL_PREFIXES = [
  "NISSE",
  "BREVFUGL",
  "VERKSTED",
  "SLEDE",
  "JULE",
  "REINSDYR",
  "GAVE",
  "JULEKULE",
  "FORSVARS",
  "RUTE",
  "NORDLYS",
  "JULE",
  "SNOFALL",
  "POLAR",
  "VENN",
  "JULE",
  "NISSE",
  "BREVFUGL",
  "SNO",
  "JULE",
] as const;

const SNOFALL_SUFFIXES = [
  "KRAFT",
  "SVERM",
  "VARME",
  "DRIVSTOFF",
  "STJERNE",
  "TELEMETRI",
  "PRODUKSJON",
  "BLAST",
  "BARRIERE",
  "BEREGNING",
  "MAGIEN",
  "SIGNAL",
  "KOORDINAT",
  "NATTEN",
  "SKAP",
  "GLEDE",
  "MAGI",
  "POST",
  "KRYSTALL",
  "KRANS",
] as const;

// Alphanumeric characters for parent codes (excluding ambiguous: 0, O, I, 1)
const PARENT_CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Generate a theme-based kid code
 * Format: {PREFIX}{SUFFIX}{YEAR} (e.g., "NISSEKRAFT2024")
 *
 * @param year - Year suffix (default: current year)
 * @param existingCodes - Array of already used codes to avoid collisions
 * @returns Generated kid code
 */
export function generateKidCode(
  year?: number,
  existingCodes: string[] = [],
): string {
  const yearSuffix = year || new Date().getFullYear();
  const maxAttempts = 100;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const prefix =
      SNOFALL_PREFIXES[Math.floor(Math.random() * SNOFALL_PREFIXES.length)];
    const suffix =
      SNOFALL_SUFFIXES[Math.floor(Math.random() * SNOFALL_SUFFIXES.length)];
    const code = `${prefix}${suffix}${yearSuffix}`;

    if (!existingCodes.includes(code)) {
      return code;
    }

    attempts++;
  }

  // Fallback: append random number to ensure uniqueness
  let fallbackAttempts = 0;
  while (fallbackAttempts < 1000) {
    const prefix =
      SNOFALL_PREFIXES[Math.floor(Math.random() * SNOFALL_PREFIXES.length)];
    const suffix =
      SNOFALL_SUFFIXES[Math.floor(Math.random() * SNOFALL_SUFFIXES.length)];
    const randomNum = Math.floor(Math.random() * 1000);
    const code = `${prefix}${suffix}${yearSuffix}${randomNum}`;

    if (!existingCodes.includes(code)) {
      return code;
    }

    fallbackAttempts++;
  }

  // Ultimate fallback: use timestamp
  const prefix =
    SNOFALL_PREFIXES[Math.floor(Math.random() * SNOFALL_PREFIXES.length)];
  const suffix =
    SNOFALL_SUFFIXES[Math.floor(Math.random() * SNOFALL_SUFFIXES.length)];
  return `${prefix}${suffix}${yearSuffix}${Date.now()}`;
}

/**
 * Generate a secure parent code
 * Format: NORDPOL-{8 alphanumeric chars} (e.g., "NORDPOL-8N4K2P9X")
 * Entropy: 32^8 = ~1.2 trillion combinations (vs 32^5 = 33M)
 *
 * @param existingCodes - Array of already used codes to avoid collisions
 * @returns Generated parent code
 */
export function generateParentCode(existingCodes: string[] = []): string {
  const maxAttempts = 100;
  let attempts = 0;

  while (attempts < maxAttempts) {
    let randomPart = "";
    for (let i = 0; i < 8; i++) {
      randomPart +=
        PARENT_CODE_CHARS[Math.floor(Math.random() * PARENT_CODE_CHARS.length)];
    }

    const code = `NORDPOL-${randomPart}`;

    if (!existingCodes.includes(code)) {
      return code;
    }

    attempts++;
  }

  // Fallback: append timestamp to ensure uniqueness
  const timestamp = Date.now().toString().slice(-6);
  return `NORDPOL-${timestamp}`;
}

/**
 * Validate kid code format
 */
export function isValidKidCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;

  // Check if it matches any combination of prefix + suffix + 4-digit year (+ optional number)
  const prefixPattern = SNOFALL_PREFIXES.join("|");
  const suffixPattern = SNOFALL_SUFFIXES.join("|");
  const pattern = new RegExp(
    `^(${prefixPattern})(${suffixPattern})\\d{4}\\d*$`,
    "i",
  );
  return pattern.test(code.toUpperCase());
}

/**
 * Validate parent code format
 */
export function isValidParentCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;

  // NORDPOL-{8+ alphanumeric chars}
  const pattern = /^NORDPOL-[A-Z0-9]{8,}$/i;
  return pattern.test(code.toUpperCase());
}

/**
 * Determine code type (kid or parent)
 */
export function getCodeType(code: string): "kid" | "parent" | "invalid" {
  if (isValidParentCode(code)) return "parent";
  if (isValidKidCode(code)) return "kid";
  return "invalid";
}
