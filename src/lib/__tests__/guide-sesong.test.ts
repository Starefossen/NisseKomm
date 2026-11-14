/** @jest-environment node */
import { describe, it, expect } from "@jest/globals";
import bakt from "@/data/guide-innhold.json";
import { getAllOppdrag } from "@/lib/oppdrag";
import { nyeRuner } from "@/lib/runeorden";
import {
  sesongLinje,
  sesongFramdrift,
  DOK,
  RESERVESETT,
  SEKSJONER,
  TRAAD_IDER,
  traaderPerDag,
  delsystemer,
  forSesongen,
  handleliste,
  historien,
  kveldDag,
  sammendrag,
  seksjon,
  varden,
} from "@/lib/guide-sesong";
import { UTSKRIFTER } from "@/app/nissemor-guide/printout/filer";
import { KAPITLER } from "@/components/windows/nissespill/kapitler";

const filer: Record<string, string> = bakt;

describe("guide-sesong", () => {
  it.each(SEKSJONER)("%s har seksjonen «%s»", (k, tittel) => {
    expect(seksjon(filer[DOK[k]], tittel).length).toBeGreaterThan(50);
  });

  it("seksjon stopper ved neste overskrift på samme nivå", () => {
    const md = "## A\nx\n### A.1\ny\n## B\nz";
    expect(seksjon(md, "A")).toBe("## A\nx\n### A.1\ny\n");
    expect(seksjon(md, "A.1")).toBe("### A.1\ny\n");
  });

  it.each(Array.from({ length: 24 }, (_, i) => i + 1))(
    "dag %i har kveldsliste, strek og sammendrag fra docs",
    (n) => {
      const d = kveldDag(n)!;
      expect(d.strek.tekst.length).toBeGreaterThan(10);
      expect(d.strek.minutter).toBeGreaterThan(0);
      expect(d.iKveld.length).toBeGreaterThan(5);
      expect(d.brikkeH.length).toBeGreaterThan(10);
      expect(d.mekanikk.length).toBeGreaterThan(10);
      expect(d.minutter).toBeGreaterThan(0);
      expect(d.slikLoses.length).toBeGreaterThan(1);
      expect(d.reserve.length).toBeGreaterThan(10);
      expect(d.utskrifter.length).toBeGreaterThan(0);
      for (const u of d.utskrifter)
        expect(UTSKRIFTER as readonly string[]).toContain(u);
      expect(sammendrag(n)).toMatch(new RegExp(`^### Dag ${n} \\(`));
      expect(delsystemer(n).length).toBeGreaterThanOrEqual(10);
    },
  );

  it.each(getAllOppdrag().map((q) => [q.dag, q.kode] as const))(
    "dag %i har en hinttrapp på 3–4 trinn uten koden",
    (n, kode) => {
      const { hint } = kveldDag(n)!;
      expect(hint.length).toBeGreaterThanOrEqual(3);
      expect(hint.length).toBeLessThanOrEqual(4);
      // Same rule as kodelekkasje.test.ts: digits as a whole number, words anywhere.
      const lekk = /^\d+$/.test(kode)
        ? new RegExp(`(?<!\\d)${kode}(?!\\d)`)
        : new RegExp(kode, "i");
      for (const h of hint) {
        expect(h).not.toMatch(lekk);
        expect(h.length).toBeGreaterThan(20);
      }
    },
  );

  it("har forberedelser, handleliste og førsesongsradio", () => {
    const f = forSesongen();
    expect(f.innen25.length).toBeGreaterThan(5);
    expect(f.byggeplan.map((b) => b.steg.length)).toEqual([6, 4, 10]);
    expect(f.sjekkliste).toHaveLength(5);
    expect(f.handleliste.varer.length).toBeGreaterThan(20);
    expect(f.handleliste.sum).toMatch(/kr/);
    expect(f.morgen1).toMatch(/^Morgenen 1\. desember/);
    expect(f.radio.map((r) => r.dato)).toContain("2026-11-30");
  });

  it("Historien har tekst i hver del", () => {
    for (const h of historien())
      for (const d of h.deler) expect(d.length).toBeGreaterThan(50);
  });

  it("Varden skjuler dagens brikker før koden og viser dem etter", () => {
    const v = varden(7);
    expect(v.uloest.dag).toContain("[skjult]");
    expect(v.loest.dag).not.toContain('"mail":"[skjult]"');
  });
});

describe("reservesett", () => {
  it("hver dag med nye runer har reservesett i kveldslista", () => {
    for (let d = 1; d <= 24; d++)
      if (nyeRuner(d).size)
        expect([d, kveldDag(d)?.reservesett]).toEqual([d, RESERVESETT[d]]);
    for (const [d, u] of Object.entries(RESERVESETT))
      expect(kveldDag(Number(d))?.reservesett).toBe(u);
  });

  describe("handleliste", () => {
    const varer = handleliste();
    const dager = Array.from({ length: 24 }, (_, i) => kveldDag(i + 1)!);
    const lenket = (id: string) =>
      dager.filter((d) => d.varer.some((v) => v.id === id)).map((d) => d.dag);

    it("har unike id-er som ikke endres", () => {
      const ider = varer.map((v) => v.id);
      expect(new Set(ider).size).toBe(ider.length);
      // Synced ticks are keyed on these; renaming an item drops its tick.
      expect(ider).toEqual(
        expect.arrayContaining([
          "klementiner",
          "maskeringsteip",
          "ametyst",
          "runde-gullklistremerker",
        ]),
      );
    });

    it("hver vare finnes på en dag eller er generell", () => {
      const d1 = new Set(forSesongen().dag1.map((v) => v.id));
      const mangler = varer.filter(
        (v) => !v.generell && !lenket(v.id).length && !d1.has(v.id),
      );
      expect(mangler.map((v) => v.vare)).toEqual([]);
    });

    it("en vare med dager er lenket på minst én av dem", () => {
      const feil = varer
        .filter((v) => !v.generell)
        .filter((v) => {
          const egne = [...v.dager.matchAll(/\d+/g)].map((m) => Number(m[0]));
          return !lenket(v.id).some((d) => egne.includes(d));
        });
      expect(feil.map((v) => `${v.vare}: ${v.dager}`)).toEqual([]);
    });
  });
});

it.each([5, 18, 24])("dag %i: sammendrag har ikke utkastets gåte", (n) => {
  const s = sammendrag(n);
  for (const gml of [
    "V M S J L F O",
    "T _ R B _ L _ N S",
    "J U L E _ _ _ _",
    "Gåte.",
    "Brikke S",
  ])
    expect(s).not.toContain(gml);
});

describe("sesongLinje", () => {
  it("has all 24 days and no code without fasit", () => {
    const uten = sesongLinje(false);
    expect(uten.dager.map((d) => d.dag)).toEqual(
      Array.from({ length: 24 }, (_, i) => i + 1),
    );
    for (const d of uten.dager) {
      const q = getAllOppdrag().find((o) => o.dag === d.dag)!;
      const tekst = JSON.stringify(d).toLowerCase();
      expect(tekst).not.toContain(q.kode.toLowerCase());
      if (q.bonusoppdrag)
        expect(tekst).not.toContain(q.bonusoppdrag.foreldre_kode.toLowerCase());
    }
    expect(sesongLinje(true).dager[0].kode).toBe(getAllOppdrag()[0].kode);
  });
  it("names symbol cards in Norwegian, not by id", () => {
    for (const s of sesongLinje(false).baner.symboler)
      expect(s.tittel).toMatch(/^\S+ (hjerte|sol|måne)$/);
  });
});

describe("sesongFramdrift", () => {
  // Day 12 with progress: 1–11 solved except day 9, like TIDSMASKIN leaves it
  const loste = getAllOppdrag().filter((q) => q.dag <= 11 && q.dag !== 9);
  const state = {
    "nissekomm-codes": loste.map((q) => ({ day: q.dag, kode: q.kode })),
    "nissekomm-failed-attempts": { 9: 3, 12: 1 },
    "nissekomm-bonusoppdrag-completed": [11],
    "nissekomm-collected-symbols": loste
      .flatMap((q) => (q.symbol_clue ? [q.symbol_clue] : []))
      .slice(1)
      .map((c) => ({ symbolId: c.symbolId })),
    "nissekomm-eventyr": {
      kapittel: 2,
      sceneId: "x",
      inventory: [],
      flags: [],
      hints: {},
      fjaer: ["1:torget", "1:kafeen", "2:x"],
      parkert: {
        1: { sceneId: "y", inventory: [], flags: [KAPITLER[0].slutt] },
      },
    },
    "nissekomm-slede": {
      tundra: { poeng: 1900, bjeller: 3 },
      "Kristian/tundra": { poeng: 1900, bjeller: 3 },
      "Håkon/tundra": { poeng: 700, bjeller: 1 },
    },
  };
  const f = sesongFramdrift(state);

  it("maps solved days, wrong attempts, bonus and milestones", () => {
    expect(f.lost).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 10, 11]);
    expect(f.sisteLost).toBe(11);
    expect(f.feil).toEqual({ 9: 3, 12: 1 });
    expect(f.bonus).toEqual([11]);
    expect(f.milepaeler).toEqual(["M1", "M2"]);
  });
  it("maps the side quests per lane", () => {
    const [k1, k2, k3] = Object.values(f.baner.ugleposten);
    expect(k1).toEqual({
      status: "ferdig",
      detalj: "Fullført · 2 fjær funnet her",
    });
    expect([k2.status, k3.status]).toEqual(["paagaar", "ikke"]);
    expect(f.fjaer).toEqual({ funnet: 3, maal: 8 });
    const tundra = f.baner.sledeflukt["Tundra-testen"];
    expect(tundra.status).toBe("ferdig");
    expect(tundra.detalj).toContain("Kristian 1900 p");
    expect(tundra.detalj).toContain("Håkon 700 p");
    expect(
      Object.values(f.baner.sledeflukt).filter((x) => x.status === "ferdig"),
    ).toHaveLength(1);
    const kort = Object.values(f.baner.symboler);
    expect(kort).toHaveLength(9);
    expect(f.symboler.funnet).toBe(state["nissekomm-collected-symbols"].length);
    expect(kort[0].status).toBe("ikke");
    expect(kort[1].status).toBe("ferdig");
  });
  it("keys every lane by a title the Sesongkart shows", () => {
    const baner = sesongLinje(false).baner;
    for (const [bane, ting] of Object.entries(f.baner)) {
      const titler = baner[bane as keyof typeof f.baner].map((e) => e.tittel);
      for (const t of Object.keys(ting)) expect(titler).toContain(t);
    }
  });
  it("never carries a code, also with every day solved", () => {
    // Number codes collide with day numbers, so a marker proves that the
    // stored `kode` field itself never leaves; word codes are checked by name.
    // Lane keys are the plan's own titles (a stage is named after a code
    // word), so only what the progress adds is checked: the values.
    const f = sesongFramdrift({
      ...state,
      "nissekomm-codes": getAllOppdrag().map((q) => ({
        day: q.dag,
        kode: `${q.kode}-MERKE`,
      })),
    });
    const alt = JSON.stringify({
      ...f,
      baner: Object.values(f.baner).map((b) => Object.values(b)),
    }).toLowerCase();
    expect(alt).not.toContain("merke");
    const ord = (k: string) => /\D/.test(k);
    for (const q of getAllOppdrag()) {
      if (ord(q.kode)) expect(alt).not.toContain(q.kode.toLowerCase());
      if (q.bonusoppdrag)
        expect(alt).not.toContain(q.bonusoppdrag.foreldre_kode.toLowerCase());
    }
  });
  it("is empty on an empty state", () => {
    const tom = sesongFramdrift({});
    expect(tom.lost).toEqual([]);
    expect(tom.sisteLost).toBe(0);
    expect(tom.milepaeler).toEqual([]);
  });
});

describe("tråder (historie §4b)", () => {
  const per = traaderPerDag();
  it("dekker alle 24 dager med kjente id-er", () => {
    expect([...per.keys()].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 24 }, (_, i) => i + 1),
    );
    for (const ids of per.values())
      for (const id of ids) expect(TRAAD_IDER).toContain(id);
  });
  it.each(TRAAD_IDER)("tråden %s har minst én dag", (id) => {
    expect([...per.values()].some((ids) => ids.includes(id))).toBe(true);
  });
});
