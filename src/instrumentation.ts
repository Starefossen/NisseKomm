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
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.VAPID_PUBLIC_KEY &&
    process.env.NODE_ENV !== "test"
  ) {
    // 20:00 «I kveld» push while the pod is up; /api/push/kveld (Varden's
    // cron) covers scale-to-zero. sendKveld is once per Oslo date either way.
    // Imported on the first tick, not at boot: guide-sesong pulls in the
    // 900 kB guide bake, and register() runs before the server listens.
    setInterval(async () => {
      try {
        const { getStore } = await import("@/lib/db");
        const { sendKveld } = await import("@/lib/notify/push");
        const { antallKveldTing } = await import("@/lib/guide-sesong");
        await sendKveld(getStore(), antallKveldTing);
      } catch (e) {
        console.error(e);
      }
    }, 60_000).unref();
  }
}
