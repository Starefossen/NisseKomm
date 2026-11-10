export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.DATABASE_URL) {
    const { migrateOnStartup } = await import("@/lib/db");
    await migrateOnStartup();
  }
}
