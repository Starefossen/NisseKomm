import { mediaUrl } from "@/lib/media";
import type { FrostModeLevel } from "@/lib/frost";
/**
 * Snøfall TV channel map (storyboard «Avgjort 10. november») and the
 * day events from historie-2026 §9. Pure functions of day/hour/state so
 * the Tidsmaskin can show any day.
 */

export type ChannelId = 1 | 2 | 3 | 4;

export const CHANNELS: { id: ChannelId; name: string }[] = [
  { id: 1, name: "SNØFALL LANDSBY" },
  { id: 2, name: "IQS VERKSTED" },
  { id: 3, name: "JULIUS" },
  { id: 4, name: "ANTENNEN" },
];

export const FREQ_HOME = 90;
export const FREQ_KULDE = 85;
export const FREQ_MIN = 80;
export const FREQ_MAX = 100;

// ponytail: cave, antenna and event loops (T2/T3) don't exist yet; these
// PNG stills stand in. Swap the path for /video/tv/<name>.mp4 when they land.
const STILL = {
  antenne: mediaUrl("feed/antenne-tarn.png"),
  grotte: mediaUrl("feed/kulde-grotte.png"),
  storm: mediaUrl("feed/snøfall-storm.png"),
};

/** Background for a live channel (K3 is the Julius video, not a feed). */
export function channelSource(
  channel: ChannelId,
  day: number,
  hour: number,
  freq: number,
): string | null {
  switch (channel) {
    case 1:
      if (day === 17) return mediaUrl("video/tv/landsby-nordlys.mp4");
      if (day === 18) return STILL.storm;
      return mediaUrl("video/tv/landsby-rolig.mp4");
    case 2:
      // IQ works days; the workshop stands empty at night.
      return hour >= 7 && hour < 20
        ? mediaUrl("video/tv/verksted-iq-inne.mp4")
        : mediaUrl("video/tv/verksted-tom.mp4");
    case 4:
      if (freq === FREQ_HOME) return STILL.antenne;
      // Krystallgrotten is only on the air from day 3 (first ghost image).
      if (freq === FREQ_KULDE && day >= 3) return STILL.grotte;
      return null;
    default:
      return null;
  }
}

/** Kulde's ghost lines on 85,0 MHz. */
export const KULDE_INTERCEPTS: Record<number, string> = {
  3: "Er det noen der? Linjen deres er varm. Jeg kjente den helt her nede.",
  7: "Orakelet deres leter etter navnet mitt. Si det, når dere finner det.",
  10: "Fargene er hos meg nå. Jeg skal passe godt på dem.",
  11: "Jeg la is på antennen deres, så den kunne høre på meg i stedet.",
  13: "Lysene deres. Jeg husker ikke når jeg så lys sist.",
  16: "Jeg snudde båndet til Winter. Nå ser hun hit.",
  21: "Det er kaldt her nede. Jeg ville bare se lyset deres.",
};

export function latestIntercept(day: number): string | undefined {
  const days = Object.keys(KULDE_INTERCEPTS)
    .map(Number)
    .filter((d) => d <= day);
  return days.length ? KULDE_INTERCEPTS[Math.max(...days)] : undefined;
}

export interface DayState {
  day: number;
  solved: boolean;
  frost: number;
  /** App-wide frost mode (GameEngine.getFrostMode): 1 = grey, 2 = frozen. */
  mode: FrostModeLevel;
  /** Day 21 after the code: number of channels thawed so far. */
  thawed: number;
}

/** Code effects for one channel on one day (§9 table). */
export function channelEffects(
  channel: ChannelId,
  freq: number,
  { day, solved, frost, mode, thawed }: DayState,
) {
  const onKulde = channel === 4 && freq === FREQ_KULDE;
  // Kill switch and the 20:00 fail-safe clear `mode`; the thaw only follows a solve.
  const frozen = mode === 2 || (day === 21 && solved && channel > thawed);
  return {
    frost: day >= 24 ? 0 : frost,
    hijack: onKulde && day >= 3,
    gray: mode === 1,
    flicker: day === 20,
    frozen,
    warm: day >= 24 || (day === 21 && solved && onKulde && !frozen),
    signature: day === 7,
    ghostLine: frozen
      ? "DET ER KALDT HER NEDE"
      : onKulde
        ? day === 3
          ? "…ER DET NOEN DER?"
          : undefined
        : undefined,
  };
}
