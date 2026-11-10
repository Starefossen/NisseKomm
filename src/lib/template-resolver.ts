/**
 * Template Resolver
 *
 * Centralized system for resolving placeholders in static content.
 * All dynamic content (names, codes, dates) flows through this module.
 *
 * PLACEHOLDERS:
 * - {{KID_CODE}} - Family's kid code (for Day 1 validation)
 * - {{KID_NAMES}} - Comma-separated kid names from family settings
 * - {{FRIEND_NAMES}} - Comma-separated friend names for Nice List
 * - {{PLAYER_NAMES}} - Kids who completed Nice List registration (Days 22-24)
 * - {{UPDATE_DATE}} - Dynamic date for snill_slem_liste.txt
 * - {{FINALE_MESSAGE}} - Julius' personalized message on Day 24
 * - {{NICE_LIST_ENTRIES}} - Generated Nice List with names and absurd reasons
 *
 * DESIGN:
 * - Pure functions for testability (no side effects)
 * - All data passed via TemplateContext (dependency injection)
 * - Convenience wrapper available for runtime usage
 */

// ============================================================================
// ABSURD REASON GENERATOR
// ============================================================================

/**
 * Pool of absurd but kid-friendly reasons for being on the Nice List
 * Mix of Norwegian humor, slightly exaggerated achievements
 */
const ABSURD_REASONS = [
  "Bygde funksjonell rakettskip av pappesker til lillebror (NASA ringte)",
  "Organiserte LEGO etter farge OG størrelse (tok 6 timer)",
  "Laget advent-kalender til ALLE naboene (24 dører × 7 hus = matematikk!)",
  "Ryddet rommet SÅ grundig at mamma trodde det var feil rom",
  "Lærte lillesøster 47 forskjellige dyrelyder (inkludert axolotl)",
  "Trente storesøster til maraton ved å være personlig trener",
  "Leste høyt fra telefonkatalogen til morfar sovnet (tok 3 timer)",
  "Måkte naboen sin oppkjørsel i form av reinsdyr (perfekt anatomisk)",
  "Skrev 50-siders eventyrbok for lillesøster (med egne illustrasjoner)",
  "Laget 200 håndskrevne julekort med individuell poesi",
  "Forklarte algebra til naboen sin katt (katten besto testen)",
  "Vasket opp FRIVILLIG tre dager på rad (ny verdensrekord)",
  "Delte den siste sjokoladen med søsken uten å klage",
  "Hjalp bestemor å lære TikTok-dans (hun har nå 500 følgere)",
  "Reparerte farfars gamle radio med tannpirkere og håpløshet",
  "Lagde frokost på seng til hele familien (uten å søle én dråpe)",
  "Gikk tur med nabohunden i regn, snø OG hagl (samme dag)",
  "Sorterte søppel så nøye at kommunen sendte takkebrev",
  "Lærte papegøyen høflige ord i stedet for banneord",
  "Byttet ut sukker med stevia i mormors kaker (ingen merket det)",
  "Hjalp postmannen å bære pakker i tre timer (uten å snoke)",
  "Bygde fuglehus som faktisk tiltrakk fugler (og én forvirret ekorn)",
  "Øvde på fløyte med lyddemper så søsken kunne sove",
  "Ga bort favoritt-t-skjorten til innsamling uten tårer",
  "Ryddet naboens hage etter storm (de visste ikke hvem det var)",
  "Laget 14-retters middag til bestemors 80-årsdag (microbølgen overlevde så vidt)",
  "Tok ansvar for klassens hamster i HELE juleferien",
  "Oversatte Minecraft-tutorials til norsk for yngre kusine",
  "Lagde PowerPoint om hvorfor lillebror burde få større rom (tapte, men god innsats)",
  "Vasket bilen så grundig at pappa trodde det var ny bil",
];

/**
 * Fallback names if no player or friend names are provided
 */
const FALLBACK_NAMES = [
  "Georg",
  "Viljar",
  "Ellie",
  "Marcus",
  "Amund",
  "Ella",
  "Elias",
  "Brage",
  "Astrid",
  "Sverre",
  "Kees",
];

/**
 * Get a deterministic but seemingly random reason for a name
 * Uses simple hash to ensure same name always gets same reason
 */
function getReasonForName(name: string, index: number): string {
  // Simple hash based on name characters and index
  let hash = index;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % ABSURD_REASONS.length;
  }
  return ABSURD_REASONS[hash];
}

/**
 * Context for template resolution
 * All required data must be provided - no internal fetching
 */
export interface TemplateContext {
  // Family data (from /api/family or AppContext)
  kidCode?: string;
  kidNames?: string[];
  friendNames?: string[];

  // Game state (from StorageManager/userSession)
  playerNames?: string[];
  completedDays?: number[];

  // Temporal context
  currentDay?: number;
}

/**
 * Resolve all placeholders in a template string (pure function)
 *
 * @param template - String containing {{PLACEHOLDER}} markers
 * @param context - Context with all required data (no async fetching)
 * @returns Resolved string with all placeholders replaced
 */
export function resolveTemplate(
  template: string,
  context: TemplateContext = {},
): string {
  let result = template;

  // Default values
  const currentDay = context.currentDay ?? 1;
  const completedDays = context.completedDays ?? [];
  const kidCode = context.kidCode ?? "";
  const kidNames = context.kidNames ?? [];
  const friendNames = context.friendNames ?? [];
  const playerNames = context.playerNames ?? [];

  // Resolve {{KID_CODE}}
  if (result.includes("{{KID_CODE}}")) {
    result = result.replace(/\{\{KID_CODE\}\}/g, kidCode);
  }

  // Resolve {{KID_NAMES}} - comma-separated list
  if (result.includes("{{KID_NAMES}}")) {
    const formatted = formatNameList(kidNames);
    result = result.replace(/\{\{KID_NAMES\}\}/g, formatted);
  }

  // Resolve {{FRIEND_NAMES}} - comma-separated list
  if (result.includes("{{FRIEND_NAMES}}")) {
    const formatted = formatNameList(friendNames);
    result = result.replace(/\{\{FRIEND_NAMES\}\}/g, formatted);
  }

  // Resolve {{PLAYER_NAMES}} - kids who registered for Nice List
  if (result.includes("{{PLAYER_NAMES}}")) {
    const formatted = formatNameList(playerNames);
    result = result.replace(/\{\{PLAYER_NAMES\}\}/g, formatted);
  }

  // Resolve {{UPDATE_DATE}} - dynamic date based on progress
  if (result.includes("{{UPDATE_DATE}}")) {
    const day24Completed = completedDays.includes(24);
    const day23Completed = completedDays.includes(23);

    let dateText: string;
    if (day24Completed) {
      dateText = "24. Desember - JULAFTEN!";
    } else if (day23Completed) {
      dateText = "23. Desember ✓";
    } else {
      dateText = `${currentDay}. Desember`;
    }
    result = result.replace(/\{\{UPDATE_DATE\}\}/g, dateText);
  }

  // Resolve {{FINALE_MESSAGE}} - only on Day 24 completion
  if (result.includes("{{FINALE_MESSAGE}}")) {
    const day24Completed = completedDays.includes(24);

    if (day24Completed) {
      const names = playerNames.length > 0 ? playerNames.join(", ") : "barn";
      const finaleMessage = generateFinaleMessage(names);
      result = result.replace(/\{\{FINALE_MESSAGE\}\}/g, finaleMessage);
    } else {
      // Remove placeholder before Day 24
      result = result.replace(/\n?\n?\{\{FINALE_MESSAGE\}\}/g, "");
    }
  }

  // Resolve {{NICE_LIST_ENTRIES}} - dynamic Nice List with names and reasons
  if (result.includes("{{NICE_LIST_ENTRIES}}")) {
    const day23Completed = completedDays.includes(23);
    const entries = generateNiceListEntries(
      playerNames,
      friendNames,
      day23Completed,
    );
    result = result.replace(/\{\{NICE_LIST_ENTRIES\}\}/g, entries);
  }

  return result;
}

/**
 * Format a list of names for display
 * ["Ola", "Kari", "Per"] → "Ola, Kari og Per"
 */
export function formatNameList(names: string[]): string {
  const filtered = names.filter((n) => n.trim().length > 0);

  if (filtered.length === 0) return "";
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return `${filtered[0]} og ${filtered[1]}`;

  const lastIndex = filtered.length - 1;
  return `${filtered.slice(0, lastIndex).join(", ")} og ${filtered[lastIndex]}`;
}

/**
 * Generate Julius' personalized finale message for Day 24
 */
export function generateFinaleMessage(names: string): string {
  return `
GRATULERER, ${names}!

Dere er nå offisielle Julekalender-Mestere!

Rampenissen har fortalt meg alt dere har gjort - hver kode,
hvert symbol, hvert øyeblikk av vennskap.

Dere er ikke bare på listen. Dere ER en del av Snøfall nå.
For alltid.

- Julius
`;
}

/**
 * Generate Nice List entries from names
 *
 * Logic:
 * - If Day 23+ complete and playerNames exist: show players with ★ marker at top
 * - If friendNames exist: add them with absurd reasons
 * - If neither: show fallback names with absurd reasons
 *
 * @param playerNames - Kids who completed the calendar (get special marker)
 * @param friendNames - Additional friends to include (from parent settings)
 * @param showPlayerAchievements - Whether to show special achievement text (Day 23+)
 * @returns Formatted list entries
 */
export function generateNiceListEntries(
  playerNames: string[],
  friendNames: string[],
  showPlayerAchievements: boolean = false,
): string {
  const entries: string[] = [];
  let entryNumber = 1;

  // Filter valid names
  const validPlayerNames = playerNames.filter((n) => n.trim());
  const validFriendNames = friendNames.filter((n) => n.trim());

  // Players get special recognition if Day 23+ completed
  if (showPlayerAchievements && validPlayerNames.length > 0) {
    validPlayerNames.forEach((name) => {
      entries.push(
        `${entryNumber}. ${name} - ★ FULLFØRT NISSEKOMM JULEKALENDER! ★`,
      );
      entryNumber++;
    });
  }

  // Friend names get absurd reasons (unless already formatted as "Name - Reason")
  if (validFriendNames.length > 0) {
    validFriendNames.forEach((name) => {
      // Check if name already contains a reason (format: "Name - Reason")
      // Split ONLY on " - " (space-dash-space) to preserve hyphens in names like "Anne-Lise"
      const separatorIndex = name.indexOf(" - ");
      if (separatorIndex !== -1) {
        // Use the pre-formatted entry as-is
        const namePart = name.substring(0, separatorIndex).trim();
        const reasonPart = name.substring(separatorIndex + 3).trim();
        entries.push(`${entryNumber}. ${namePart} - ${reasonPart}`);
      } else {
        // Auto-generate absurd reason
        const reason = getReasonForName(name, entryNumber);
        entries.push(`${entryNumber}. ${name} - ${reason}`);
      }
      entryNumber++;
    });
  }

  // If no player names (or not showing achievements) and no friends, use fallback
  if (entries.length === 0) {
    FALLBACK_NAMES.forEach((name) => {
      const reason = getReasonForName(name, entryNumber);
      entries.push(`${entryNumber}. ${name} - ${reason}`);
      entryNumber++;
    });
  }

  // Add placeholder for more names if we have real names
  if (validPlayerNames.length > 0 || validFriendNames.length > 0) {
    entries.push("");
    entries.push("... [PLASS TIL FLERE NAVN] ...");
  }

  return entries.join("\n");
}

/**
 * Check if a string contains any template placeholders
 */
export function hasPlaceholders(text: string): boolean {
  return /\{\{[A-Z_]+\}\}/.test(text);
}

/**
 * List all placeholders found in a string
 */
export function findPlaceholders(text: string): string[] {
  const matches = text.match(/\{\{[A-Z_]+\}\}/g);
  return matches ? [...new Set(matches)] : [];
}
