import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { DarkChannel } from "../DarkChannel";
import { PressureGauge, pressureForDate } from "../PressureGauge";
import { MiniGames, gamesFor } from "../MiniGames";
import { SnøfallTV } from "../../SnøfallTV";
import { StorageManager } from "@/lib/storage";
import { setTimeOverride } from "@/lib/date-utils";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// Mock canvas getContext and media element play/pause for jsdom
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = (() =>
    ({
      createImageData: () => ({
        data: new Uint8ClampedArray(256 * 256 * 4),
      }),
      putImageData: () => {},
      drawImage: () => {},
      clearRect: () => {},
      fillRect: () => {},
      beginPath: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      measureText: () => ({ width: 10 }),
      fillText: () => {},
    }) as unknown as CanvasRenderingContext2D) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

if (typeof window !== "undefined") {
  window.matchMedia =
    window.matchMedia ||
    (() =>
      ({
        matches: false,
        addListener: () => {},
        removeListener: () => {},
      }) as unknown as MediaQueryList);

  HTMLMediaElement.prototype.play = () => Promise.resolve();
  HTMLMediaElement.prototype.pause = () => {};

  window.ResizeObserver =
    window.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
}

function mount(node: React.ReactNode) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  act(() => createRoot(el).render(node));
  return el;
}

describe("K2 Features: DarkChannel, Sentrifuge, PressureGauge", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    process.env.NEXT_PUBLIC_TEST_MODE = "true";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_TEST_MODE;
    setTimeOverride(null);
  });

  describe("Day 2: Dark channel on K2", () => {
    it("renders dark channel with faint fuse-box drawing and toggle", () => {
      const el = mount(<DarkChannel />);
      expect(el.textContent).toContain("K2 IQS VERKSTED");
      expect(el.textContent).toContain("MØRK KANAL // SIKRING BRUTT");
      expect(el.querySelector("svg")).not.toBeNull();
      expect(el.textContent).toContain("HOVEDSIKRING");
      expect(el.textContent).toContain("AV");
      expect(el.textContent).not.toContain("Det var IKKE kaffetrakteren");
    });

    it("flipping the toggle shows IQ's short line without revealing day 2 code (48)", () => {
      const el = mount(<DarkChannel />);
      const btn = el.querySelector<HTMLButtonElement>("button[role='switch']")!;
      expect(btn).not.toBeNull();
      // 44 px touch target check
      expect(btn.className).toContain("min-h-11");

      act(() => {
        btn.click();
      });

      expect(el.textContent).toContain("UTLØST");
      expect(el.textContent).toContain(
        "IQ: «Det var IKKE kaffetrakteren! Sikringen holder ikke før kretsen er hel!»",
      );
      // Verify no secret leak
      expect(el.textContent).not.toContain("48");
      expect(el.textContent).not.toContain("romertall");
      expect(el.textContent).not.toContain("stol");
    });

    it("gates dark channel to Day 2 when unsolved in SnøfallTV", () => {
      // Day 2 unsolved: shows dark channel
      const elDay2 = mount(<SnøfallTV currentDay={2} onClose={() => {}} />);
      // Switch to K2
      const btnK2 = Array.from(elDay2.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("K2"),
      );
      expect(btnK2).toBeDefined();
      act(() => {
        btnK2!.click();
      });
      expect(elDay2.textContent).toContain("MØRK KANAL // SIKRING BRUTT");
      expect(elDay2.textContent).toContain("HOVEDSIKRING");

      // Day 1: K2 does not show dark channel
      document.body.innerHTML = "";
      const elDay1 = mount(<SnøfallTV currentDay={1} onClose={() => {}} />);
      const btnK2Day1 = Array.from(elDay1.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("K2"),
      );
      if (btnK2Day1 && !btnK2Day1.disabled) {
        act(() => {
          btnK2Day1.click();
        });
      }
      expect(elDay1.textContent).not.toContain("MØRK KANAL // SIKRING BRUTT");

      // Day 3: K2 does not show dark channel
      document.body.innerHTML = "";
      const elDay3 = mount(<SnøfallTV currentDay={3} onClose={() => {}} />);
      const btnK2Day3 = Array.from(elDay3.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("K2"),
      );
      act(() => {
        btnK2Day3!.click();
      });
      expect(elDay3.textContent).not.toContain("MØRK KANAL // SIKRING BRUTT");
    });

    it("power is restored on Day 2 when solved", () => {
      // Mark day 2 completed
      StorageManager.addSubmittedCode({
        kode: "TEST2",
        dato: new Date().toISOString(),
        day: 2,
      });
      const el = mount(<SnøfallTV currentDay={2} onClose={() => {}} />);
      const btnK2 = Array.from(el.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("K2"),
      );
      act(() => {
        btnK2!.click();
      });
      expect(el.textContent).not.toContain("MØRK KANAL // SIKRING BRUTT");
      expect(el.textContent).not.toContain("HOVEDSIKRING");
    });
  });

  describe("K4 TEKNISK HUD", () => {
    const hud = (day: number) => {
      const el = mount(<SnøfallTV currentDay={day} onClose={() => {}} />);
      const k4 = Array.from(el.querySelectorAll("button")).find((b) =>
        b.textContent?.startsWith("K4"),
      );
      act(() => k4!.click());
      return Array.from(el.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("TEKNISK HUD"),
      );
    };

    it.each([8, 22])("is shown greyed before day %i's code", (day) => {
      const btn = hud(day);
      expect(btn?.disabled).toBe(true);
      expect(btn?.textContent).toContain("Løs dagens kode først");
    });

    it.each([8, 22])("opens after day %i's code", (day) => {
      StorageManager.addSubmittedCode({
        kode: "TEST",
        dato: new Date().toISOString(),
        day,
      });
      const btn = hud(day);
      expect(btn?.disabled).toBe(false);
      expect(btn?.textContent).not.toContain("Løs");
    });
  });

  describe("Day 19: Sentrifuge mini-game", () => {
    it("is gated by day via gamesFor(day)", () => {
      const g18 = gamesFor(18).map(([id]) => id);
      expect(g18).not.toContain("sentrifuge");

      const g19 = gamesFor(19).map(([id]) => id);
      expect(g19).toContain("sentrifuge");

      const g20 = gamesFor(20).map(([id]) => id);
      expect(g20).toContain("sentrifuge");
    });

    it("renders sentrifuge game with 44px buttons and controls RPM", () => {
      const el = mount(<MiniGames day={19} onClose={() => {}} />);
      expect(el.textContent).toContain("SENTRIFUGE");
      expect(el.textContent).toContain("ROTOR-TURTALL:");
      expect(el.textContent).toContain("0 RPM");

      const btnInc = Array.from(el.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("ØK FART"),
      )!;
      expect(btnInc).toBeDefined();
      expect(btnInc.className).toContain("min-h-11");

      act(() => {
        btnInc.click();
      });
      expect(el.textContent).toContain("1000 RPM");

      // Max spin button
      const btnMax = Array.from(el.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("MAKS SPINN"),
      )!;
      act(() => {
        btnMax.click();
      });
      expect(el.textContent).toContain("5000 RPM");
      expect(el.textContent).toContain(
        "SENTRIFUGE I BALANSE – SEPARERING FULLFØRT!",
      );
    });

    it("shows SENTRIFUGE button on K2 on day 19+ after solving", () => {
      StorageManager.addSubmittedCode({
        kode: "TEST19",
        dato: new Date().toISOString(),
        day: 19,
      });
      const el = mount(<SnøfallTV currentDay={19} onClose={() => {}} />);
      const btnK2 = Array.from(el.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("K2"),
      )!;
      act(() => {
        btnK2.click();
      });
      expect(el.textContent).toContain("SENTRIFUGE");

      // On day 18, even if solved, SENTRIFUGE button is not on K2
      document.body.innerHTML = "";
      StorageManager.addSubmittedCode({
        kode: "TEST18",
        dato: new Date().toISOString(),
        day: 18,
      });
      const elDay18 = mount(<SnøfallTV currentDay={18} onClose={() => {}} />);
      const btnK2_18 = Array.from(elDay18.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("K2"),
      )!;
      act(() => {
        btnK2_18.click();
      });
      expect(elDay18.textContent).not.toContain("SENTRIFUGE");
    });
  });

  describe("Day 20: Pressure gauge on K2", () => {
    it("pressureForDate rises monotonically during the day", () => {
      const p00 = pressureForDate(new Date(2026, 11, 20, 0, 0, 0));
      const p08 = pressureForDate(new Date(2026, 11, 20, 8, 0, 0));
      const p12 = pressureForDate(new Date(2026, 11, 20, 12, 0, 0));
      const p20 = pressureForDate(new Date(2026, 11, 20, 20, 0, 0));
      const p23 = pressureForDate(new Date(2026, 11, 20, 23, 59, 59));

      expect(p00).toBeCloseTo(1.0, 1);
      expect(p08).toBeGreaterThan(p00);
      expect(p12).toBeGreaterThan(p08);
      expect(p12).toBeCloseTo(5.25, 1);
      expect(p20).toBeGreaterThan(p12);
      expect(p23).toBeGreaterThan(p20);
      expect(p23).toBeCloseTo(9.5, 1);
    });

    it("renders pressure gauge SVG dial and handles venting", () => {
      setTimeOverride({ day: 20, month: 12, hour: 12, minute: 0 });
      const el = mount(<PressureGauge />);
      expect(el.textContent).toContain("MANOMETER // LINJE-TRYKK");
      expect(el.textContent).toContain("5.3 BAR");
      expect(el.textContent).toContain("STATUS: STIGENDE");

      const ventBtn = el.querySelector<HTMLButtonElement>("button")!;
      expect(ventBtn).not.toBeNull();
      expect(ventBtn.className).toContain("min-h-11");
      expect(ventBtn.textContent).toContain("LETT PÅ TRYKKEN");

      act(() => {
        ventBtn.click();
      });
      expect(el.textContent).toContain("VENTIL ÅPNET");
    });

    it("gates pressure gauge to Day 20 on K2 in SnøfallTV", () => {
      setTimeOverride({ day: 20, month: 12, hour: 14, minute: 0 });
      const elDay20 = mount(<SnøfallTV currentDay={20} onClose={() => {}} />);
      const btnK2 = Array.from(elDay20.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("K2"),
      )!;
      act(() => {
        btnK2.click();
      });
      expect(elDay20.textContent).toContain("MANOMETER // LINJE-TRYKK");

      // Day 19 on K2 does not show pressure gauge
      document.body.innerHTML = "";
      setTimeOverride({ day: 19, month: 12, hour: 14, minute: 0 });
      const elDay19 = mount(<SnøfallTV currentDay={19} onClose={() => {}} />);
      const btnK2_19 = Array.from(elDay19.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("K2"),
      )!;
      act(() => {
        btnK2_19.click();
      });
      expect(elDay19.textContent).not.toContain("MANOMETER // LINJE-TRYKK");

      // Day 21 on K2 does not show pressure gauge
      document.body.innerHTML = "";
      setTimeOverride({ day: 21, month: 12, hour: 14, minute: 0 });
      const elDay21 = mount(<SnøfallTV currentDay={21} onClose={() => {}} />);
      const btnK2_21 = Array.from(elDay21.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("K2"),
      )!;
      act(() => {
        btnK2_21.click();
      });
      expect(elDay21.textContent).not.toContain("MANOMETER // LINJE-TRYKK");
    });
  });
});
