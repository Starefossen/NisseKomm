export async function register() {
  // Days unlock at midnight and frost ends at 20:00 Norwegian time, DST
  // included; server-side Date getters must agree with the family's clock.
  process.env.TZ ??= "Europe/Oslo";
  const { isLanMode } = await import("@/lib/mode");
  const test = [
    "NEXT_PUBLIC_TEST_MODE",
    "NEXT_PUBLIC_MOCK_DAY",
    "NEXT_PUBLIC_MOCK_MONTH",
  ].filter((k) => process.env[k]);
  if (test.length && process.env.NODE_ENV === "production" && !isLanMode())
    console.warn(
      `[nissekomm] ${test.join(", ")} ignoreres på serveren i public-modus`,
    );
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.DATABASE_URL) {
    const { migrateWithRetry } = await import("@/lib/db");
    void migrateWithRetry();
  }
}
