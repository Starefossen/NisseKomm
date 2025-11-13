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

/**
 * Get the current date/time, respecting mock settings
 * Use this instead of `new Date()` everywhere
 */
export function getCurrentDate(): Date {
  const now = new Date();

  // Check if we're mocking the date
  const mockDay = process.env.NEXT_PUBLIC_MOCK_DAY;
  const mockMonth = process.env.NEXT_PUBLIC_MOCK_MONTH;

  if (mockDay) {
    const day = parseInt(mockDay, 10);
    const month = mockMonth ? parseInt(mockMonth, 10) - 1 : 11; // Default to December (11)

    if (!isNaN(day) && day >= 1 && day <= 31) {
      // Create a new date with the mocked day/month but keep current time
      const mockedDate = new Date(now);
      mockedDate.setMonth(month);
      mockedDate.setDate(day);
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
