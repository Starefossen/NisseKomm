import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Nissespill } from "./Nissespill";
import { KAPITLER, erLaastOpp, spilldag } from "./kapitler";
import { KAPITTEL_1 } from "./kapittel1";
import * as M from "./motor";
import * as P from "./minispill";
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

/** Tile labels to tap, in order, that solve the sliding puzzle shown in the DOM (BFS). */
function skyvLoesning(el: HTMLElement): string[] {
  const start = [...el.querySelectorAll("button")]
    .map((b) => b.getAttribute("aria-label") ?? "")
    .filter((l) => l === "Tomt felt" || /^Brikke \d$/.test(l))
    .map((l) => (l === "Tomt felt" ? P.HULL : Number(l.slice(7)) - 1));
  expect(start).toHaveLength(9);
  const key = (s: number[]) => s.join("");
  const forrige = new Map<string, [string, number] | null>([
    [key(start), null],
  ]);
  const koe = [start];
  while (koe.length) {
    const s = koe.shift()!;
    if (P.skyvLost(s)) {
      const ut: string[] = [];
      for (let k = key(s), p = forrige.get(k); p; k = p[0], p = forrige.get(k))
        ut.unshift(`Brikke ${p[1] + 1}`);
      return ut;
    }
    for (let i = 0; i < 9; i++) {
      const n = P.skyvFlytt(s, i);
      if (n !== s && !forrige.has(key(n))) {
        forrige.set(key(n), [key(s), s[i]]);
        koe.push(n);
      }
    }
  }
  throw new Error("uløselig");
}

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
    expect(el.textContent).toContain("ÅPNER DAG 10");
    expect(el.textContent).toContain("Noe tygger på noe");
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
    // Opener: camera boots, Floke wakes, then Rampenissen's three lines
    expect(el.textContent).toContain("FLOKE TILKOBLET");
    tap(el, "VIDERE");
    expect(el.textContent).toContain("Floke våkner");
    tap(el, "VIDERE");
    expect(el.textContent).toContain("hvisker fra hylla");
    expect(el.textContent).toContain("DOKKER Floke");
    tap(el, "HOPP OVER");
    expect(GameEngine.getEventyrSave()?.flags).toContain("k1_intro");
    expect(GameEngine.isIntroSeen("ugle-k1")).toBe(true);

    // The pad is in plain sight; Winter explains what it is for
    expect(find(el, "Stempelputa")).toBeDefined();
    tap(el, "Winter");
    expect(el.textContent).toContain("Halt!");
    tap(el, "Vi leter etter en garnkurv. Med en bjelle i.");
    // Rampenissen's aside waits for his button instead of cutting in
    expect(el.textContent).not.toContain("SENGA mi i postkassen");
    tap(el, "Og stempelet?");
    tap(el, "Skjønner. Vi finner noe rødt.");
    tap(el, "RAMPENISSEN");
    expect(el.textContent).toContain("SENGA mi i postkassen");
    tap(el, "RAMPENISSEN");

    // Berries, then up to the workshop for the cup and the form
    tap(el, "Julebodene");
    expect(GameEngine.getEventyrSave()?.inventory).toEqual(["tyttebaer"]);
    expect(el.textContent).toContain("LAGRET");
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
    expect(el.textContent).toContain("Skrinet er låst");

    // The stamp box: wheels to 1-6-4-0 (the sign's emptying time)
    jest.useFakeTimers();
    tap(el, "Stempelskrinet");
    expect(el.textContent).toContain("Stempelskrinet");
    for (const [hjul, n] of [
      [1, 1],
      [2, 6],
      [3, 4],
    ])
      for (let i = 0; i < n; i++) tap(el, `Hjul ${hjul} ned`);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(el.textContent).toContain("som en liten konge");
    tap(el, "Skjema 4112-B, signert");
    tap(el, "Winter");
    expect(el.textContent).toContain("til nød gyldig");

    // Frozen hatch: warm cup, then the postcard tiles
    tap(el, "Postkassen");
    expect(el.textContent).toContain("frosset fast");
    tap(el, "IQs kaffekopp");
    tap(el, "Postkassen");
    expect(el.textContent).toContain("Paragraf 101");
    tap(el, "Luka");
    for (const brikke of skyvLoesning(el)) tap(el, brikke);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    jest.useRealTimers();
    expect(el.textContent).toContain("TIL KAPITLENE");
    expect(el.textContent).toContain("KAPITTEL 1 FULLFØRT");
    expect(el.textContent).toContain("Fjær 0/2 · Ingen tips");
    const save = GameEngine.getEventyrSave();
    expect(save?.flags).toContain("k1_ferdig");
    tap(el, "TIL KAPITLENE");
    expect(el.textContent).toContain("Fullført · Fjær 0/2 · Ingen tips");
  });

  it("fjæra plukkes med SE, telles og overlever nytt kapittel", () => {
    const el = mount();
    tap(el, "SPILL");
    tap(el, "HOPP OVER");
    tap(el, "SE");
    tap(el, "Noe lite");
    expect(el.textContent).toContain("Fjær 1/2");
    expect(find(el, "Noe lite")).toBeUndefined();
    expect(GameEngine.getEventyrSave()?.fjaer).toEqual(["1:torget"]);
  });

  it("NOTAT åpner notatboka med dagens mål", () => {
    const el = mount();
    tap(el, "SPILL");
    tap(el, "HOPP OVER");
    tap(el, "NOTAT");
    expect(el.textContent).toContain("Hva gjør vi nå?");
    expect(el.textContent).toContain("garnkurven");
    expect(el.textContent).not.toContain("Noe rødt og tynt");
    tap(el, "Lukk notatboka");
    expect(el.textContent).not.toContain("Hva gjør vi nå?");
  });

  it("RAMPENISSEN-knappens TIPS følger første uløste gåte og stopper på nivå 3", () => {
    const el = mount();
    tap(el, "SPILL");
    tap(el, "HOPP OVER");
    tap(el, "RAMPENISSEN");
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
      fjaer: [],
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
      if (st[0] === "!") {
        // Mini-puzzle: BRUK on the hotspot must open it, then the UI reports it solved
        const [scene, id] = st[1].split("/");
        save = M.gaa(save, scene).save;
        const u = M.trykk(kap, save, hot(scene, id), null, null);
        expect(u.puslespill).toBe(st[2]);
        const l = M.losPuslespill(kap, save, st[2]!);
        expect(l.lyd).toBe("success");
        save = l.save;
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
      ["!", "torget/skrinet", "skrin"],
      ["torget", "winter", "skjema_signert"],
      ["torget", "postkassen", "kaffekopp"],
      ["!", "torget/luka", "frostluke"],
    ]);
  });

  it("kapittel 2 kan spilles gjennom", () => {
    spill(KAPITLER[1], [
      ["!", "tjernet/hytta", "hyttelaas"],
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
      ["!", "tjernet/mottakeren", "mottaker"],
    ]);
  });

  it("kapittel 3 kan spilles gjennom", () => {
    spill(KAPITLER[2], [
      ["kontor", "lysene"],
      ["?", "hjerterud", "Rampenissen vil gi et lys til det som er i grotta."],
      ["?", "hjerterud", "Vi skal passe på den."],
      ["kontor", "tekoppen"],
      ["+", "stearinlys", "tesil"],
      // The lantern held to the clear shelf shows the chain and thaws the shard
      ["grotten", "klarekrystallene", "tesil_lanterne"],
      ["grotten", "klarekrystallene"],
      ["grotten", "sokkelen", "tesil_lanterne"],
      ["grotten", "sokkelen", "krystallskaar"],
      ["!", "grotten/lyshylla", "lysveien"],
      ["!", "grotten/knottene", "stemme"],
      ["?", "radioen", "Skal vi si noe?"],
      ["?", "radioen", "Vi lar lyset stå."],
      ["?", "radioen", "Vi går. Lyset blir."],
    ]);
  });

  it("kapittel 3: lanterna kan stå på sokkelen før skåret er løst", () => {
    spill(KAPITLER[2], [
      ["kontor", "lysene"],
      ["?", "hjerterud", "Rampenissen vil gi et lys til det som er i grotta."],
      ["?", "hjerterud", "Vi skal passe på den."],
      ["kontor", "tekoppen"],
      ["+", "stearinlys", "tesil"],
      ["grotten", "sokkelen", "tesil_lanterne"],
      // The pedestal light reaches the lowest crystal, so the shard is loose (en_av)
      ["grotten", "klarekrystallene"],
      ["grotten", "sokkelen", "krystallskaar"],
      ["!", "grotten/lyshylla", "lysveien"],
      ["!", "grotten/knottene", "stemme"],
      ["?", "radioen", "Vi lar lyset stå."],
      ["?", "radioen", "Vi går. Lyset blir."],
    ]);
  });

  it("kapittel 4 kan spilles gjennom i valgfri rekkefølge", () => {
    // Port first, then bell, then glasses: Winter's list is no longer ordered
    spill(KAPITLER[3], [
      ["?", "winter", "Hva står på listen?"],
      ["?", "winter", "Kan vi få litt talg fra lanterna?"],
      ["porten", "lanterne_v"],
      ["porten", "hengslet", "talgstump"],
      ["kontor", "taletrakten"],
      ["kontor", "brevbunken"],
      ["+", "magnet", "hyssing"],
      ["kontor", "vedkassa", "fiskesnoere"],
      ["!", "kontor/sprekken", "fiskevei"],
      ["kontor", "vedkassa"],
      ["porten", "sleden", "bjelle"],
      ["kontor", "blekkhuset"],
      ["kontor", "brevfuglen", "fjaer"],
      ["kontor", "skaala"],
      ["kontor", "brevfuglen", "klementin"],
      ["kontor", "julius", "briller"],
      ["?", "winter", "Alt på lista er gjort. Sjekk!"],
      ["!", "porten/skriveplata", "avgangsstempel"],
    ]);
  });

  it("kapittel 4: Winter godtar ikke sjekk før alle tre punkter er gjort", () => {
    const kap = KAPITLER[3];
    const start = kap.dialoger.winter.noder.start;
    const med = (...flags: string[]) =>
      M.valgSomVises(start, { ...M.nyttKapittel(kap), flags }).map(
        (v) => v.tekst,
      );
    expect(med("winter_snakket", "briller_levert", "port_smurt")).toContain(
      "Vi tror vi er ferdige. Sjekk!",
    );
    expect(med("briller_levert", "port_smurt")).not.toContain(
      "Alt på lista er gjort. Sjekk!",
    );
    expect(med("briller_levert", "bjelle_montert", "port_smurt")).toContain(
      "Alt på lista er gjort. Sjekk!",
    );
  });
});
