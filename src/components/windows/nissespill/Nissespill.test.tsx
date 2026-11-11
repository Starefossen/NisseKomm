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

    // The pad is in plain sight; Winter explains what it is for
    expect(find(el, "Stempelputa")).toBeDefined();
    tap(el, "Winter");
    expect(el.textContent).toContain("Halt!");
    tap(el, "Vi leter etter en garnkurv. Med en bjelle i.");
    expect(el.textContent).toContain("SENGA mi i postkassen");
    tap(el, "Og stempelet?");
    tap(el, "Skjønner. Vi finner noe rødt.");

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

    // The form goes under IQ's door for a signature
    tap(el, "Skjema 4112-B");
    tap(el, "IQs dør");
    expect(el.textContent).toContain("brunsvidd hjørne");
    expect(GameEngine.getEventyrSave()?.inventory).toEqual([
      "baersaft",
      "skjema_signert",
    ]);

    // Remount mid-game: same scene and pockets
    el = mount();
    expect(el.textContent).toContain("IQs verksted");
    tap(el, "→ Ned trappa til torget");

    // Signed form with a dry pad is refused, juice wets the pad, then it passes
    tap(el, "Skjema 4112-B, signert");
    tap(el, "Winter");
    expect(el.textContent).toContain("helt nei");
    tap(el, "Kopp med tyttebærsaft");
    tap(el, "Stempelputa");
    expect(el.textContent).toContain("skogsbær");
    expect(GameEngine.getEventyrSave()?.inventory).toEqual([
      "skjema_signert",
      "kaffekopp",
    ]);
    tap(el, "Skjema 4112-B, signert");
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
      if (st[0] === "?") {
        // Dialog choice by its text; must be offered in the current save
        const d = kap.dialoger[st[1]];
        const n = Object.values(d.noder).find((x) =>
          x.valg?.some((v) => v.tekst === st[2]),
        )!;
        const v = M.valgSomVises(n, save).find((x) => x.tekst === st[2]);
        expect(v?.tekst).toBe(st[2]);
        save = M.velgSvar(save, v!);
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

  it("kapittel 1 kan spilles gjennom", () => {
    spill(KAPITLER[0], [
      ["torget", "bodene"],
      ["verksted", "kaffekoppen"],
      ["verksted", "sidebordet"],
      ["verksted", "doera", "skjema"],
      ["+", "tyttebaer", "kaffekopp"],
      ["torget", "stempelputa", "baersaft"],
      ["torget", "winter", "skjema_signert"],
      ["torget", "postkassen", "kaffekopp"],
    ]);
  });

  it("kapittel 2 kan spilles gjennom", () => {
    spill(KAPITLER[1], [
      ["tjernet", "snoehaugen"],
      ["tjernet", "hytta", "noekkel"],
      ["tjernet", "hytta"],
      ["tjernet", "benken"],
      ["verksted", "tavla"],
      ["verksted", "hyllene"],
      ["verksted", "sidebordet"],
      ["verksted", "krakken"],
      ["+", "sirup", "knekkebroed"],
      ["+", "blikkboks", "grytevott"],
      ["verksted", "radioroerene", "boks_i_vott"],
      ["tjernet", "rudolf", "sirupbroed"],
      ["tjernet", "tannhjulet", "varmboks"],
      // The box is cold again; the frozen water cup needs a second round
      ["verksted", "radioroerene", "boks_i_vott"],
      ["tjernet", "peileskiva", "varmboks"],
      ["tjernet", "peileskiva", "magnetnaal"],
    ]);
  });

  it("kapittel 3 kan spilles gjennom", () => {
    spill(KAPITLER[2], [
      ["kontor", "lysene"],
      ["?", "nissemor", "Rampenissen vil gi et lys til han i grotten."],
      ["?", "nissemor", "Vi skal passe på den."],
      ["kontor", "tekoppen"],
      ["+", "stearinlys", "tesil"],
      ["?", "julius", "Rampenissen vil gi et lys til han i grotten."],
      ["?", "julius", "Klare, høyre, foran flammen."],
      ["grotten", "klarekrystallene"],
      ["grotten", "sokkelen", "tesil_lanterne"],
      ["grotten", "sokkelen", "krystallskaar"],
      ["?", "radioen", "God jul fra Landås."],
      ["?", "radioen", "Vi kommer tilbake."],
    ]);
  });

  it("kapittel 4 kan spilles gjennom", () => {
    spill(KAPITLER[3], [
      ["?", "winter", "Hva står på listen?"],
      ["kontor", "blekkhuset"],
      ["kontor", "brevfuglen", "fjaer"],
      ["kontor", "skaala"],
      ["kontor", "brevfuglen", "klementin"],
      ["kontor", "taletrakten"],
      ["kontor", "brevbunken"],
      ["+", "magnet", "hyssing"],
      ["kontor", "vedkassa", "fiskesnoere"],
      ["kontor", "julius", "briller"],
      ["porten", "sleden", "bjelle"],
      ["?", "winter", "Kan vi få litt talg fra lanterna?"],
      ["porten", "lanterne_v"],
      ["porten", "hengslet", "talgstump"],
    ]);
  });
});
