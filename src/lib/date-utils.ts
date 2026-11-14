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

import { isLanMode } from "./mode";

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
/**
 * NEXT_PUBLIC_TEST_MODE/MOCK_* as runtime env on the public production pod
 * would open every day on the server; there they are ignored (the build
 * guard keeps them out of the client). Pass the literal process.env.X so
 * the client bundle still inlines it.
 */
export function testEnv(value: string | undefined): string | undefined {
  if (
    typeof window === "undefined" &&
    process.env.NODE_ENV === "production" &&
    !isLanMode()
  )
    return undefined;
  return value;
}

export function isTimeMachineEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    testEnv(process.env.NEXT_PUBLIC_TEST_MODE) === "true"
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

  const mockDay = testEnv(process.env.NEXT_PUBLIC_MOCK_DAY);
  const mockMonth = testEnv(process.env.NEXT_PUBLIC_MOCK_MONTH);

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
 * 25 Dec through 31 Jan: the app stays open as on 24 Dec (rewatch, no new
 * riddles), so day/month getters report 24 Dec. Closed from 1 Feb.
 */
export function isRomjul(d: Date): boolean {
  const m = d.getMonth();
  return (m === 11 && d.getDate() > 24) || m === 0;
}

/**
 * Get current calendar day (1-31)
 * Respects NEXT_PUBLIC_MOCK_DAY for testing
 */
export function getCurrentDay(): number {
  const d = getCurrentDate();
  return isRomjul(d) ? 24 : d.getDate();
}

/**
 * Get current month (1-12)
 * Respects NEXT_PUBLIC_MOCK_MONTH for testing
 */
export function getCurrentMonth(): number {
  const d = getCurrentDate();
  return isRomjul(d) ? 12 : d.getMonth() + 1;
}

/**
 * Last advent day whose content is out: 0 before 1 Dec, today on 1–24 Dec,
 * 24 from 25 Dec through January (rewatching after Christmas).
 * ponytail: Feb–Nov counts as "before"; a new season starts empty.
 */
export function getAdventDay(): number {
  return getCurrentMonth() === 12 ? Math.min(24, getCurrentDay()) : 0;
}

/**
 * Check if current date is within the calendar period (December 1-24)
 * @param testMode - If true, bypass date restrictions for development
 */
export function isCalendarActive(testMode: boolean = false): boolean {
  if (testMode || testEnv(process.env.NEXT_PUBLIC_TEST_MODE) === "true") {
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

/**
 * Get real-time countdown to Christmas Eve (December 24)
 *
 * URGENCY LEVELS:
 * - calm: >14 days remaining (green, steady pulse)
 * - approaching: 8-14 days (blue, moderate pulse)
 * - urgent: 4-7 days (gold, fast pulse)
 * - critical: 1-3 days (red shake, larger text)
 * - today: 0 days (gold flash, "GOD JUL!")
 *
 * @returns Countdown from `now` with time components and urgency level
 */
export function christmasCountdown(now: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isChristmas: boolean;
  urgencyLevel: "calm" | "approaching" | "urgent" | "critical" | "today";
} {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Calculate target Christmas Eve (year comes from mocked getCurrentDate())
  let christmasYear = currentYear;
  if (currentMonth === 12 && now.getDate() > 24) {
    christmasYear = currentYear + 1;
  }
  const christmasEve = new Date(christmasYear, 11, 24, 23, 59, 59); // Dec 24, 23:59:59

  // Calculate time difference
  const diff = christmasEve.getTime() - now.getTime();
  const isChristmas = currentMonth === 12 && now.getDate() === 24;

  if (diff <= 0 || isChristmas) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isChristmas: true,
      urgencyLevel: "today",
    };
  }

  // Calculate components
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  // Determine urgency level
  let urgencyLevel: "calm" | "approaching" | "urgent" | "critical" | "today";
  if (days > 14) {
    urgencyLevel = "calm";
  } else if (days >= 8) {
    urgencyLevel = "approaching";
  } else if (days >= 4) {
    urgencyLevel = "urgent";
  } else {
    urgencyLevel = "critical";
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    isChristmas: false,
    urgencyLevel,
  };
}
