/**
 * Date Utilities - Centralized date/time management
 *
 * Single source of truth for all date-related operations in NisseKomm.
 * Supports mocking via NEXT_PUBLIC_MOCK_DAY for testing and development.
 *
 * IMPORTANT: Always use these utilities instead of `new Date()` directly
 * to ensure consistent behavior across the application.
 *
 * Environment Variables:
 * - NEXT_PUBLIC_TEST_MODE: Enable test mode (bypasses date restrictions)
 * - NEXT_PUBLIC_MOCK_DAY: Override current day (1-24 for testing)
 * - NEXT_PUBLIC_MOCK_MONTH: Override current month (1-12, defaults to 12)
 */

export interface TimeOverride {
  day: number;
  month: number; // 1-12
  hour: number;
  minute: number;
}

const TIME_OVERRIDE_KEY = "nissekomm-tidsmaskin";

/**
 * Tidsmaskin is a dev/test tool. In a production build without test mode
 * NODE_ENV is inlined as "production", so this is false and the override
 * code is dead.
 */
export function isTimeMachineEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_TEST_MODE === "true"
  );
}

export function getTimeOverride(): TimeOverride | null {
  if (!isTimeMachineEnabled() || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TIME_OVERRIDE_KEY);
    return raw ? (JSON.parse(raw) as TimeOverride) : null;
  } catch {
    return null;
  }
}

export function setTimeOverride(override: TimeOverride | null): void {
  if (typeof window === "undefined") return;
  if (override) {
    window.localStorage.setItem(TIME_OVERRIDE_KEY, JSON.stringify(override));
  } else {
    window.localStorage.removeItem(TIME_OVERRIDE_KEY);
  }
}

/**
 * Get the current date/time, respecting the Tidsmaskin override first and
 * NEXT_PUBLIC_MOCK_* second. Use this instead of `new Date()` everywhere.
 */
export function getCurrentDate(): Date {
  const d = clockDate();
  const offset = getDayOffset();
  if (offset) d.setDate(d.getDate() + offset);
  return d;
}

/** Server-side «now»: the clock plus skip_day's stored `day-offset`. */
export function getServerDate(dayOffset: unknown): Date {
  const d = getCurrentDate();
  if (typeof dayOffset === "number") d.setDate(d.getDate() + dayOffset);
  return d;
}

/** MCP skip_day's `day-offset`, cached from the server by ServerSyncAdapter. */
function getDayOffset(): number {
  if (typeof window === "undefined") return 0;
  try {
    const n = JSON.parse(window.localStorage.getItem("day-offset") ?? "0");
    return typeof n === "number" ? n : 0;
  } catch {
    return 0;
  }
}

function clockDate(): Date {
  const now = new Date();

  const override = getTimeOverride();
  if (override) {
    // Keep seconds ticking so clocks still move
    const d = new Date(now);
    d.setMonth(override.month - 1, override.day);
    d.setHours(override.hour, override.minute);
    return d;
  }

  const mockDay = process.env.NEXT_PUBLIC_MOCK_DAY;
  const mockMonth = process.env.NEXT_PUBLIC_MOCK_MONTH;

  if (mockDay) {
    const day = parseInt(mockDay, 10);
    const month = mockMonth ? parseInt(mockMonth, 10) - 1 : 11; // Default to December (11)

    if (!isNaN(day) && day >= 1 && day <= 31) {
      const mockedDate = new Date(now);
      mockedDate.setMonth(month, day);
      return mockedDate;
    }
  }

  return now;
}

/**
 * Get current calendar day (1-31)
 * Respects NEXT_PUBLIC_MOCK_DAY for testing
 */
export function getCurrentDay(): number {
  return getCurrentDate().getDate();
}

/**
 * Get current month (1-12)
 * Respects NEXT_PUBLIC_MOCK_MONTH for testing
 */
export function getCurrentMonth(): number {
  return getCurrentDate().getMonth() + 1; // Convert 0-based to 1-based
}

/**
 * Check if current date is within the calendar period (December 1-24)
 * @param testMode - If true, bypass date restrictions for development
 */
export function isCalendarActive(testMode: boolean = false): boolean {
  if (testMode || process.env.NEXT_PUBLIC_TEST_MODE === "true") {
    return true;
  }

  const month = getCurrentMonth();
  const day = getCurrentDay();

  return month === 12 && day >= 1 && day <= 24;
}

/**
 * Create an ISO string for the current date/time
 */
export function getISOString(): string {
  return getCurrentDate().toISOString();
}
