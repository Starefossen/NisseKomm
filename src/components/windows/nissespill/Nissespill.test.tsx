import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Nissespill } from "./Nissespill";
import { KAPITLER, erLaastOpp, spilldag } from "./kapitler";
import { KAPITTEL_1 } from "./kapittel1";
import * as M from "./motor";
import { GameEngine } from "@/lib/game-engine";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function mount() {
  const el = document.createElement("div");
  act(() => createRoot(el).render(<Nissespill onClose={() => {}} />));
  return el;
}

const find = (el: HTMLElement, label: string) =>
  [...el.querySelectorAll("button")].find(
    (b) =>
      b.getAttribute("aria-label") === label ||
      b.textContent?.trim() === label ||
      b.textContent?.trim() === `› ${label}`,
  );

const tap = (el: HTMLElement, label: string) =>
  act(() => {
    const btn = find(el, label);
    if (!btn) throw new Error(`no button ${label}`);
    btn.click();
  });

const env = process.env as Record<string, string | undefined>;

describe("Nissespill: kapitler låses opp etter dag", () => {
  afterEach(() => {
    delete env.NEXT_PUBLIC_MOCK_DAY;
    delete env.NEXT_PUBLIC_MOCK_MONTH;
    delete env.NEXT_PUBLIC_TEST_MODE;
  });

  it("dag 4, 10, 16, 22 i desember; ingenting utenfor desember", () => {
    env.NEXT_PUBLIC_MOCK_MONTH = "12";
    env.NEXT_PUBLIC_MOCK_DAY = "4";
    expect(KAPITLER.map((k) => erLaastOpp(k, spilldag()))).toEqual([
      true,
      false,
      false,
      false,
    ]);
    env.NEXT_PUBLIC_MOCK_DAY = "22";
    expect(KAPITLER.every((k) => erLaastOpp(k, spilldag()))).toBe(true);
    env.NEXT_PUBLIC_MOCK_MONTH = "11";
    expect(spilldag()).toBe(0);
    env.NEXT_PUBLIC_TEST_MODE = "true";
    expect(spilldag()).toBe(22);
  });

  it("dag 4 låser opp modulen NISSESPILL, ikke dag 3", () => {
    const day4 = GameEngine.getAllQuests().find((q) => q.dag === 4);
    expect(day4?.reveals?.modules).toContain("NISSESPILL");
    expect(
      GameEngine.getAllQuests()
        .filter((q) => q.dag < 4)
        .flatMap((q) => q.reveals?.modules ?? []),
    ).not.toContain("NISSESPILL");
  });
});

describe("Nissespill: kapittel 1 spilles gjennom", () => {
  beforeEach(() => {
    localStorage.clear();
    env.NEXT_PUBLIC_MOCK_MONTH = "12";
    env.NEXT_PUBLIC_MOCK_DAY = "4";
  });
  afterEach(() => {
    delete env.NEXT_PUBLIC_MOCK_DAY;
    delete env.NEXT_PUBLIC_MOCK_MONTH;
  });

  it("menyen viser bare kapittel 1 som spillbart på dag 4", () => {
    const el = mount();
    expect(el.textContent).toContain("Kapittel 1: Senga i postkassen");
    expect(el.textContent).toContain("Låses opp 10. desember");
    expect(find(el, "SPILL")).toBeDefined();
    expect(
      [...el.querySelectorAll("button")].filter(
        (b) => b.textContent === "SPILL",
      ),
    ).toHaveLength(1);
  });

  it("hele kjeden i jsdom, lagret gjennom GameEngine, gjenopptas etter remount", () => {
    let el = mount();
    tap(el, "SPILL");
    // Intro: three bubbles from Rampenissen
    expect(el.textContent).toContain("Knerten");
    tap(el, "VIDERE");
    tap(el, "VIDERE");
    tap(el, "VIDERE");
    expect(GameEngine.getEventyrSave()?.flags).toContain("k1_intro");

    // Stempelputa is hidden until Winter has explained the system
    expect(find(el, "Stempelputa")).toBeUndefined();
    tap(el, "Winter");
    expect(el.textContent).toContain("Halt!");
    tap(el, "Vi leter etter en garnkurv. Med en bjelle i.");
    expect(el.textContent).toContain("SENGA mi i postkassen");
    tap(el, "Og stempelet?");
    tap(el, "Skjønner. Vi finner noe rødt.");
    expect(find(el, "Stempelputa")).toBeDefined();

    // Berries, then up to the workshop for the cup and the form
    tap(el, "Julebodene");
    expect(GameEngine.getEventyrSave()?.inventory).toEqual(["tyttebaer"]);
    tap(el, "Trappa");
    expect(el.textContent).toContain("IQs verksted");
    tap(el, "Kaffekoppen");
    tap(el, "Sidebordet");
    expect(GameEngine.getEventyrSave()?.inventory).toEqual([
      "tyttebaer",
      "kaffekopp",
      "skjema",
    ]);

    // Wrong combination gets a shrug; the right one makes juice
    tap(el, "Skjema 4112-B");
    tap(el, "Frosne tyttebær");
    expect(el.textContent).toMatch(/Rampenissen: «/);
    tap(el, "Frosne tyttebær");
    tap(el, "IQs kaffekopp");
    expect(el.textContent).toContain("knallrød");
    expect(GameEngine.getEventyrSave()?.inventory).toEqual([
      "skjema",
      "baersaft",
    ]);

    // Remount mid-game: same scene and pockets
    el = mount();
    expect(el.textContent).toContain("IQs verksted");
    tap(el, "→ Ned trappa til torget");

    // Unstamped form is refused, juice wets the pad, stamped form opens the lock
    tap(el, "Skjema 4112-B");
    tap(el, "Winter");
    expect(el.textContent).toContain("Felt 7-C");
    tap(el, "Kopp med tyttebærsaft");
    tap(el, "Stempelputa");
    expect(el.textContent).toContain("skogsbær");
    expect(GameEngine.getEventyrSave()?.inventory).toEqual([
      "skjema",
      "kaffekopp",
    ]);
    tap(el, "Skjema 4112-B");
    tap(el, "Winter");
    expect(el.textContent).toContain("til nød gyldig");

    // Frozen hatch: warm cup
    tap(el, "Postkassen");
    expect(el.textContent).toContain("frosset fast");
    tap(el, "IQs kaffekopp");
    tap(el, "Postkassen");
    expect(el.textContent).toContain("TIL KAPITLENE");
    const save = GameEngine.getEventyrSave();
    expect(save?.flags).toContain("k1_ferdig");
    expect(save?.inventory).toEqual(["bjelle"]);
    tap(el, "TIL KAPITLENE");
    expect(el.textContent).toContain("Fullført");
  });

  it("TIPS følger første uløste gåte og stopper på nivå 3", () => {
    const el = mount();
    tap(el, "SPILL");
    tap(el, "VIDERE");
    tap(el, "VIDERE");
    tap(el, "VIDERE");
    tap(el, "TIPS");
    expect(el.textContent).toContain("Han med skjerfet");
    tap(el, "TIPS");
    tap(el, "TIPS");
    tap(el, "TIPS");
    expect(el.textContent).toContain("Han elske å forklare");
    expect(GameEngine.getEventyrSave()?.hints.winter).toBe(3);
  });
});

describe("Nissespill: motor", () => {
  it("nytt kapittel beholder bare andre kapitlers k<n>_-flagg", () => {
    const s = M.nyttKapittel(KAPITTEL_1, {
      kapittel: 1,
      sceneId: "x",
      inventory: ["bjelle"],
      flags: ["k1_ferdig", "winter_snakket", "k2_ferdig"],
      hints: { winter: 3, rudolf: 1 },
    });
    expect(s).toEqual({
      kapittel: 1,
      sceneId: "torget",
      inventory: [],
      flags: ["k2_ferdig"],
      hints: { rudolf: 1 },
    });
  });

  it.each(KAPITLER.filter((k) => k.klar).map((k) => [k.n, k] as const))(
    "alle referanser i kapittel %i peker på noe som finnes",
    (_n, k) => {
      const items = new Set(Object.keys(k.gjenstander));
      const scener = new Set(k.scener.map((s) => s.id));
      for (const s of k.scener) {
        for (const u of s.utganger) expect(scener.has(u.til)).toBe(true);
        for (const h of s.hotspots) {
          if (h.ta) expect(items.has(h.ta.item)).toBe(true);
          if (h.snakk) expect(k.dialoger[h.snakk]).toBeDefined();
          if (h.gaaTil) expect(scener.has(h.gaaTil)).toBe(true);
          for (const b of h.bruker ?? []) {
            expect(items.has(b.item)).toBe(true);
            if (b.gir) expect(items.has(b.gir)).toBe(true);
          }
          for (const f of Object.keys(h.feil ?? {}))
            expect(items.has(f)).toBe(true);
        }
      }
      for (const d of Object.values(k.dialoger)) {
        for (const n of Object.values(d.noder)) {
          for (const v of n.valg ?? []) {
            if (v.neste) expect(d.noder[v.neste]).toBeDefined();
            if (v.harItem) expect(items.has(v.harItem)).toBe(true);
          }
        }
      }
      // 10+ funny SE lines
      const seLinjer = k.scener.flatMap((s) => s.hotspots.map((h) => h.se));
      expect(seLinjer.length).toBeGreaterThanOrEqual(10);
    },
  );

  /** Every chapter is solvable from a fresh save with the steps below (no softlock). */
  const spill = (kap: M.Kapittel, steg: [string, string, string?][]) => {
    let save = M.nyttKapittel(kap);
    const hot = (scene: string, id: string) => {
      const h = kap.scener
        .find((s) => s.id === scene)!
        .hotspots.find((x) => x.id === id)!;
      expect(M.synlige(M.scene(kap, save), save)).toContain(h);
      return h;
    };
    for (const st of steg) {
      if (st[0] === "+") {
        const u = M.kombiner(kap, save, st[1], st[2] ?? "");
        expect(u.lyd).toBe("success");
        save = u.save;
        continue;
      }
      save = M.gaa(save, st[0]).save;
      const u = M.trykk(kap, save, hot(st[0], st[1]), null, st[2] ?? null);
      expect([u.tekst, u.lyd]).toEqual([u.tekst, "success"]);
      save = u.save;
    }
    expect(save.flags).toContain(kap.slutt);
    return save;
  };

  it("kapittel 2 kan spilles gjennom", () => {
    spill(KAPITLER[1], [
      ["tjernet", "snoehaugen"],
      ["tjernet", "hytta", "noekkel"],
      ["tjernet", "hytta"],
      ["verksted", "tavla"],
      ["verksted", "hyllene"],
      ["verksted", "sidebordet"],
      ["verksted", "krakken"],
      ["+", "sirup", "knekkebroed"],
      ["verksted", "radioroerene", "blikkboks"],
      ["verksted", "radioroerene", "grytevott"],
      ["tjernet", "rudolf", "sirupbroed"],
      ["tjernet", "tannhjulet", "varmboks"],
      ["tjernet", "peileskiva", "magnetnaal"],
    ]);
  });
});
