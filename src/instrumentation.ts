export async function register() {
  // Days unlock at midnight and frost ends at 20:00 Norwegian time, DST
  // included; server-side Date getters must agree with the family's clock.
  process.env.TZ ??= "Europe/Oslo";
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.DATABASE_URL) {
    const { migrateOnStartup } = await import("@/lib/db");
    // A pod that cannot reach Postgres would answer 500 forever; exit so
    // Kubernetes restarts it and retries.
    await migrateOnStartup().catch((e) => {
      console.error("Migrering feilet, avslutter:", e);
      process.exit(1);
    });
  }
}
