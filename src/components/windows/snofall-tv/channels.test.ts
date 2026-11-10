import { gamesFor } from "./MiniGames";
import { describe, it, expect } from "@jest/globals";
import { frostLevelFor, frostModeFor } from "@/lib/frost";
import { mediaUrl } from "@/lib/media";
import {
  FREQ_HOME,
  FREQ_KULDE,
  channelEffects,
  channelFallback,
  channelSource,
  interceptFor,
  STILL,
} from "./channels";

// The TV must mirror the app-wide frost mode at 10:00 on each December day.
function fx(day: number, solved: boolean, opts = {}) {
  const mode = frostModeFor({
    day,
    month: 12,
    hour: 10,
    solved,
    disabled: false,
    ...opts,
  }).level;
  const frost = frostLevelFor(day, solved) ?? 0;
  return channelEffects(1, 90, { day, solved, frost, mode, thawed: 0 });
}

describe("Snøfall TV frost state per day", () => {
  it.each([
    [1, false, 0, false, false],
    [7, false, 30, false, false],
    [10, false, 71, true, false],
    [10, true, 45, false, false],
    [17, false, 52, false, false],
    [21, false, 94, false, true],
    [24, false, 0, false, false],
  ])("day %i solved=%s", (day, solved, frost, gray, frozen) => {
    const e = fx(day, solved);
    expect([e.frost, e.gray, e.frozen]).toEqual([frost, gray, frozen]);
  });

  it("day 21 after the code thaws channel by channel", () => {
    const frozen = (ch: 1 | 2, thawed: number) =>
      channelEffects(ch, 90, {
        day: 21,
        solved: true,
        frost: 32,
        mode: 0,
        thawed,
      }).frozen;
    expect(frozen(1, 0)).toBe(true);
    expect(frozen(1, 1)).toBe(false);
    expect(frozen(2, 1)).toBe(true);
  });

  it("kill switch and 20:00 fail-safe lift the freeze and the grey", () => {
    expect(fx(21, false, { disabled: true }).frozen).toBe(false);
    expect(fx(21, false, { hour: 20 }).frozen).toBe(false);
    expect(fx(10, false, { disabled: true }).gray).toBe(false);
  });

  it("Kulde's day-7 signature burns in only after the code", () => {
    expect(fx(7, false).signature).toBe(false);
    expect(fx(7, true).signature).toBe(true);
  });
});

describe("Snøfall TV channel video source mappings", () => {
  describe("K1 (Snøfall landsby)", () => {
    it("shows landsby-rolig by default", () => {
      expect(channelSource(1, 1, 12, FREQ_HOME)).toBe(
        mediaUrl("video/tv/landsby-rolig.mp4"),
      );
      expect(channelSource(1, 10, 12, FREQ_HOME)).toBe(
        mediaUrl("video/tv/landsby-rolig.mp4"),
      );
    });

    it("shows landsby-nordlys on day 17", () => {
      expect(channelSource(1, 17, 12, FREQ_HOME)).toBe(
        mediaUrl("video/tv/landsby-nordlys.mp4"),
      );
    });

    it("shows landsby-storm on day 18", () => {
      expect(channelSource(1, 18, 12, FREQ_HOME)).toBe(
        mediaUrl("video/tv/landsby-storm.mp4"),
      );
    });

    it("shows landsby-dag24 on day 24 only after solving", () => {
      expect(channelSource(1, 24, 12, FREQ_HOME, false)).toBe(
        mediaUrl("video/tv/landsby-rolig.mp4"),
      );
      expect(channelSource(1, 24, 12, FREQ_HOME, true)).toBe(
        mediaUrl("video/tv/landsby-dag24.mp4"),
      );
    });
  });

  describe("K2 (IQs verksted)", () => {
    it("shows verksted-iq-inne during daytime (07-20)", () => {
      expect(channelSource(2, 5, 7, FREQ_HOME)).toBe(
        mediaUrl("video/tv/verksted-iq-inne.mp4"),
      );
      expect(channelSource(2, 5, 12, FREQ_HOME)).toBe(
        mediaUrl("video/tv/verksted-iq-inne.mp4"),
      );
      expect(channelSource(2, 5, 19, FREQ_HOME)).toBe(
        mediaUrl("video/tv/verksted-iq-inne.mp4"),
      );
    });

    it("shows verksted-tom at night (outside 07-20)", () => {
      expect(channelSource(2, 5, 6, FREQ_HOME)).toBe(
        mediaUrl("video/tv/verksted-tom.mp4"),
      );
      expect(channelSource(2, 5, 20, FREQ_HOME)).toBe(
        mediaUrl("video/tv/verksted-tom.mp4"),
      );
      expect(channelSource(2, 5, 23, FREQ_HOME)).toBe(
        mediaUrl("video/tv/verksted-tom.mp4"),
      );
    });
  });

  describe("K3 (Julius / Kontor)", () => {
    it("shows kontor-dag14 on day 14", () => {
      expect(channelSource(3, 14, 12, FREQ_HOME)).toBe(
        mediaUrl("video/tv/kontor-dag14.mp4"),
      );
      expect(channelSource(3, 14, 22, FREQ_HOME)).toBe(
        mediaUrl("video/tv/kontor-dag14.mp4"),
      );
    });

    it("shows kontor-julius during the day (07-20) when no Julius video is playing", () => {
      expect(channelSource(3, 5, 12, FREQ_HOME)).toBe(
        mediaUrl("video/tv/kontor-julius.mp4"),
      );
    });

    it("shows kontor-tom outside 07-20 when no Julius video is playing", () => {
      expect(channelSource(3, 5, 22, FREQ_HOME)).toBe(
        mediaUrl("video/tv/kontor-tom.mp4"),
      );
      expect(channelSource(3, 5, 4, FREQ_HOME)).toBe(
        mediaUrl("video/tv/kontor-tom.mp4"),
      );
    });

    it("returns null when a Julius video is playing", () => {
      expect(channelSource(3, 5, 12, FREQ_HOME, false, true)).toBeNull();
      expect(
        channelSource(3, 14, 12, FREQ_HOME, { juliusPlaying: true }),
      ).toBeNull();
    });
  });

  describe("K4 at 90,0 (Antennen)", () => {
    it("shows antenne-dag11 on day 11 before solving", () => {
      expect(channelSource(4, 11, 12, FREQ_HOME, false)).toBe(
        mediaUrl("video/tv/antenne-dag11.mp4"),
      );
    });

    it("shows antenne-rolig on day 11 after solving", () => {
      expect(channelSource(4, 11, 12, FREQ_HOME, true)).toBe(
        mediaUrl("video/tv/antenne-rolig.mp4"),
      );
    });

    it("shows antenne-rolig on other days", () => {
      expect(channelSource(4, 1, 12, FREQ_HOME)).toBe(
        mediaUrl("video/tv/antenne-rolig.mp4"),
      );
      expect(channelSource(4, 12, 12, FREQ_HOME)).toBe(
        mediaUrl("video/tv/antenne-rolig.mp4"),
      );
    });
  });

  describe("K4 at 85,0 (Krystallgrotten)", () => {
    it("is off the air on days 1 and 2", () => {
      expect(channelSource(4, 1, 12, FREQ_KULDE)).toBeNull();
      expect(channelSource(4, 2, 12, FREQ_KULDE)).toBeNull();
    });

    it("shows grotte-rolig from day 3 up to day 11", () => {
      expect(channelSource(4, 3, 12, FREQ_KULDE)).toBe(
        mediaUrl("video/tv/grotte-rolig.mp4"),
      );
      expect(channelSource(4, 11, 12, FREQ_KULDE)).toBe(
        mediaUrl("video/tv/grotte-rolig.mp4"),
      );
    });

    it("handles day 12 after solving until day 15 (dag 12-14)", () => {
      expect(channelSource(4, 12, 12, FREQ_KULDE, false)).toBe(
        mediaUrl("video/tv/grotte-rolig.mp4"),
      );
      expect(channelSource(4, 12, 12, FREQ_KULDE, true)).toBe(
        mediaUrl("video/tv/grotte-dag12.mp4"),
      );
      expect(channelSource(4, 13, 12, FREQ_KULDE)).toBe(
        mediaUrl("video/tv/grotte-dag12.mp4"),
      );
      expect(channelSource(4, 14, 12, FREQ_KULDE)).toBe(
        mediaUrl("video/tv/grotte-dag12.mp4"),
      );
    });

    it("shows grotte-dag15 on days 15-20", () => {
      expect(channelSource(4, 15, 12, FREQ_KULDE)).toBe(
        mediaUrl("video/tv/grotte-dag15.mp4"),
      );
      expect(channelSource(4, 18, 12, FREQ_KULDE)).toBe(
        mediaUrl("video/tv/grotte-dag15.mp4"),
      );
      expect(channelSource(4, 20, 12, FREQ_KULDE)).toBe(
        mediaUrl("video/tv/grotte-dag15.mp4"),
      );
    });

    it("handles day 21 after solving until day 23 (dag 21-22)", () => {
      expect(channelSource(4, 21, 12, FREQ_KULDE, false)).toBe(
        mediaUrl("video/tv/grotte-rolig.mp4"),
      );
      expect(channelSource(4, 21, 12, FREQ_KULDE, true)).toBe(
        mediaUrl("video/tv/grotte-dag21.mp4"),
      );
      expect(channelSource(4, 22, 12, FREQ_KULDE)).toBe(
        mediaUrl("video/tv/grotte-dag21.mp4"),
      );
    });

    it("shows grotte-dag23 on day 23", () => {
      expect(channelSource(4, 23, 12, FREQ_KULDE)).toBe(
        mediaUrl("video/tv/grotte-dag23.mp4"),
      );
    });

    it("shows grotte-dag24 on day 24 only after solving", () => {
      expect(channelSource(4, 24, 12, FREQ_KULDE, false)).toBe(
        mediaUrl("video/tv/grotte-rolig.mp4"),
      );
      expect(channelSource(4, 24, 12, FREQ_KULDE, true)).toBe(
        mediaUrl("video/tv/grotte-dag24.mp4"),
      );
    });

    it("returns null on untuned frequencies", () => {
      expect(channelSource(4, 15, 12, 95)).toBeNull();
    });
  });

  describe("channelFallback (stills)", () => {
    it("provides fallback still images for all channels", () => {
      expect(channelFallback(1, FREQ_HOME, 1)).toBe(STILL.landsby);
      expect(channelFallback(1, FREQ_HOME, 18)).toBe(STILL.storm);
      expect(channelFallback(2, FREQ_HOME, 1)).toBe(STILL.verksted);
      expect(channelFallback(3, FREQ_HOME, 1)).toBe(STILL.kontor);
      expect(channelFallback(4, FREQ_HOME, 1)).toBe(STILL.antenne);
      expect(channelFallback(4, FREQ_KULDE, 1)).toBe(STILL.grotte);
      expect(channelFallback(4, 95, 1)).toBeNull();
    });
  });
});

describe("day gates", () => {
  it("airs each ghost line on its own day only", () => {
    expect(interceptFor(3)).toMatch(/Linjen deres er varm/);
    expect(interceptFor(4)).toBeUndefined();
    expect(interceptFor(21)).toMatch(/lyset deres/);
    expect(interceptFor(22)).toBeUndefined();
  });

  it("opens each toy from its storyboard day", () => {
    const ids = (d: number) => gamesFor(d).map(([id]) => id);
    expect(ids(7)).toEqual([]);
    expect(ids(8)).toEqual(["kretslop"]);
    expect(ids(17)).toEqual(["kretslop", "sorterer"]);
    expect(ids(18)).toContain("slede");
    expect(ids(18)).not.toContain("sentrifuge");
    expect(ids(19)).toContain("sentrifuge");
    expect(ids(21)).toContain("porten");
  });
});
