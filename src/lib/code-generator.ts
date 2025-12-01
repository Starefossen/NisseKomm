/**
 * Code Generator for Multi-Tenant Family Authentication
 *
 * Generates two types of codes:
 * 1. Kid Code: Theme-based, memorable (e.g., "NISSEKRAFT2024")
 * 2. Parent Code: Secure, alphanumeric (e.g., "NORDPOL-8N4K2")
 */

// Snøfall-themed vocabulary for kid codes (split into combinable parts)
const SNOFALL_PREFIXES = [
  "BREVFUGL",
  "EVENTYR",
  "FORSVARS",
  "GAVE",
  "JULE",
  "JULEKULE",
  "JULIUS",
  "KRISE",
  "NISSE",
  "NISSEMOR",
  "NORDLYS",
  "NORDPOL",
  "OPERASJON",
  "OPPDRAG",
  "POLAR",
  "RADAR",
  "RAMPE",
  "REINSDYR",
  "RUTE",
  "SLEDE",
  "SNO",
  "SNØFALL",
  "SNØMANN",
  "SYSTEM",
  "VENN",
  "VERKSTED",
] as const;

const SNOFALL_SUFFIXES = [
  "AKTIVERING",
  "ALARM",
  "ARKIV",
  "BARRIERE",
  "BEREGNING",
  "BLAST",
  "DRIVSTOFF",
  "ENERGI",
  "GJENGEN",
  "GLEDE",
  "KAPASITET",
  "KODE",
  "KOMMANDO",
  "KONTROLL",
  "KOORDINAT",
  "KRAFT",
  "KRANS",
  "KRYSTALL",
  "MAGI",
  "MAGIEN",
  "NATTEN",
  "NETTVERK",
  "POST",
  "PRODUKSJON",
  "PROTOKOLL",
  "RAPPORT",
  "REGISTRERING",
  "SCANNER",
  "SIGNAL",
  "SIKKERHET",
  "SKAP",
  "SPORING",
  "STABILISERING",
  "STATUS",
  "STJERNE",
  "SVERM",
  "TELEMETRI",
  "TERMINAL",
  "VARME",
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
