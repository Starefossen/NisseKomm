export async function register() {
  // Days unlock at midnight and frost ends at 20:00 Norwegian time, DST
  // included; server-side Date getters must agree with the family's clock.
  process.env.TZ ??= "Europe/Oslo";
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.DATABASE_URL) {
    const { migrateOnStartup } = await import("@/lib/db");
    await migrateOnStartup();
  }
}
