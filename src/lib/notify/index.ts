/**
 * Outgoing notifications. Channels are switched on by NOTIFY_CHANNELS
 * (comma-separated, empty by default, so nothing goes out).
 * Events are derived on the server from state writes (see events.ts).
 */

export type NotifyEvent =
  | "day_solved"
  | "milestone"
  | "bonus_approved"
  | "frost_on"
  | "frost_off"
  | "season_complete";

export interface Notification {
  event: NotifyEvent;
  day: number;
  title: string;
  body: string;
  audience: "kids" | "parents";
}

// Lazy: db pulls in pg, which jsdom tests importing this file cannot load.
const pushPå = () =>
  !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

type Channel = (n: Notification) => void | Promise<void>;

// Enabling a channel that isn't built yet should say so, not drop silently.
const stub =
  (name: string): Channel =>
  (n) =>
    console.warn(`[notify] kanal ${name} er ikke laget ennå (${n.event})`);

export const CHANNELS: Record<string, Channel> = {
  log: (n) => console.info(`[notify] ${n.event} dag ${n.day}: ${n.title}`),
  // TODO: email to parents (audience "parents"). Resend is gone; choose a
  // transport when this is switched on, ideally without a new dependency.
  email: stub("email"),
  // TODO: Varden hook (iMessage), directly or via the MCP server.
  varden: stub("varden"),
  // TODO: Skjerm card, served through MCP get_state rather than pushed.
  skjerm: stub("skjerm"),
  // Parents' guide PWA; on whenever VAPID keys are set. Title and body only
  // say which day was solved, never the code.
  push: async (n) => {
    if (n.event !== "day_solved") return;
    const { getStore } = await import("@/lib/db");
    const { sendPush } = await import("./push");
    await sendPush(getStore(), {
      type: "kode",
      title: n.title,
      body: "Dagens kode er løst.",
      url: `/nissemor-guide/dag/${n.day}`,
    });
  },
};

export function enabledChannels(): string[] {
  const valgt = (process.env.NOTIFY_CHANNELS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s in CHANNELS);
  return pushPå() && !valgt.includes("push") ? [...valgt, "push"] : valgt;
}

/** Never throws: a failing channel is logged and the others still run. */
export async function notify(n: Notification): Promise<void> {
  await Promise.all(
    enabledChannels().map(async (name) => {
      try {
        await CHANNELS[name](n);
      } catch (err) {
        console.error(`[notify] kanal ${name} feilet`, err);
      }
    }),
  );
}
