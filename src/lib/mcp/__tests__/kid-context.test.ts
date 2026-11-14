/**
 * @jest-environment node
 */
import { describe, it, expect, afterEach, jest } from "@jest/globals";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getAllOppdrag } from "@/lib/oppdrag";
import { memoryStore } from "@/lib/db";
import { KID_GUIDANCE, MAX_RESPONSE_BYTES, callTool } from "@/lib/mcp/tools";
import gaatebiter from "@/data/gaatebiter.json";
import statisk from "@/data/statisk_innhold.json";
import videoer from "@/data/julius_videoer.json";

const quests = getAllOppdrag();
const pieces = gaatebiter.biter;
const at = (day: number, hour: number) =>
  new Date(
    `2026-12-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00+01:00`,
  );

type Node = { navn: string; type: string; innhold?: string; barn?: Node[] };
const files: Node[] = [];
(function walk(ns: Node[]) {
  for (const n of ns) {
    if (n.type === "fil") files.push(n);
    else walk(n.barn ?? []);
  }
})(statisk.filer as Node[]);
const fileText = (name: string) => files.find((f) => f.navn === name)!.innhold!;
const symbolDay = (id: string) =>
  quests.find((q) => q.symbol_clue?.symbolId === id)!.dag;

/** Realistic state on day `d` with days 1..solvedTo solved. */
async function play(d: number, solvedTo: number) {
  const done = quests.filter((q) => q.dag <= solvedTo);
  await memoryStore.putState(
    "nissekomm-codes",
    done.map((q) => ({ kode: q.kode, dato: "x" })),
  );
  await memoryStore.putState(
    "nissekomm-unlocked-files",
    done.flatMap((q) => q.reveals?.files ?? []),
  );
  await memoryStore.putState(
    "nissekomm-solved-decryptions",
    done.flatMap((q) =>
      q.decryption_challenge ? [q.decryption_challenge.challengeId] : [],
    ),
  );
  // Cards are scanned on their day, before the code.
  await memoryStore.putState(
    "nissekomm-collected-symbols",
    quests.filter((q) => q.symbol_clue && q.dag <= d).map((q) => q.symbol_clue),
  );
  jest.useFakeTimers({ now: at(d, 21) });
}

const strings = (v: unknown): string[] =>
  typeof v === "string"
    ? [v]
    : v && typeof v === "object"
      ? Object.values(v).flatMap(strings)
      : [];
const kid = async (who: Parameters<typeof callTool>[0] = "read") =>
  JSON.parse(await callTool(who, "get_kid_context"));

/** Texts that are day d's pieces (today's own mail and transcript included). */
function pieceTexts(d: number): string[] {
  const q = quests.find((x) => x.dag === d)!;
  const out = [
    q.nissemail_tekst,
    videoer.find((v) => v.dag === d)!.transkripsjon,
  ];
  for (const p of pieces.filter((x) => x.dag === d)) {
    const from = "fra_dag" in p ? quests.find((x) => x.dag === p.fra_dag)! : q;
    if (p.type === "fil") out.push(fileText(p.id!));
    if (p.type === "symbol") {
      out.push(
        quests.find((x) => x.symbol_clue?.symbolId === p.id)!.symbol_clue!
          .description,
      );
    }
    if (p.type === "epost") out.push(from.nissemail_tekst);
    if (p.type === "ps") out.push(from.julius_ps!);
    if (p.type === "transkripsjon") {
      out.push(videoer.find((v) => v.dag === from.dag)!.transkripsjon);
    }
  }
  return out;
}

afterEach(() => {
  jest.useRealTimers();
  memoryStore.reset();
});

describe("gaatebiter.json mot docs/gaater-2026.md", () => {
  const doc = readFileSync(
    path.join(process.cwd(), "docs/gaater-2026.md"),
    "utf8",
  );
  const parts = doc.split(/^### Dag (\d+) /m);
  const section = new Map<number, string>();
  for (let i = 1; i < parts.length; i += 2) {
    section.set(Number(parts[i]), parts[i + 1].split("\n## ")[0]);
  }
  const has = (dag: number, type: string, id: string | number) =>
    pieces.some(
      (p) =>
        p.dag === dag &&
        p.type === type &&
        ("fra_dag" in p ? p.fra_dag : p.id) === id,
    );

  it("hver bit har et ordrett sitat fra sin dag og finnes i dataene", () => {
    expect(section.size).toBe(24);
    for (const p of pieces) {
      expect(section.get(p.dag)).toContain(p.sitat);
      if (p.type === "fil")
        expect(files.some((f) => f.navn === p.id)).toBe(true);
      if (p.type === "symbol")
        expect(symbolDay(p.id!)).toBeLessThanOrEqual(p.dag);
      if ("fra_dag" in p) expect(p.fra_dag).toBeLessThan(p.dag);
    }
  });

  it("alt dokumentet nevner som bit, står i lista", () => {
    const symbols = quests
      .filter((q) => q.symbol_clue)
      .map((q) => q.symbol_clue!.symbolId);
    const names = new Set(files.map((f) => f.navn));
    const days = (s: string) => s.match(/\d+/g)!.map(Number);
    for (const [dag, text] of section) {
      for (const m of text.matchAll(/`(?:[A-Z]+\/)?([^`/]+)`/g)) {
        if (names.has(m[1]))
          expect([dag, m[1], has(dag, "fil", m[1])]).toEqual([dag, m[1], true]);
      }
      for (const m of text.matchAll(/symbol (\d)\/9/g)) {
        expect(has(dag, "symbol", symbols[Number(m[1]) - 1])).toBe(true);
      }
      const q = quests.find((x) => x.dag === dag)!;
      if (q.symbol_clue)
        expect(has(dag, "symbol", q.symbol_clue.symbolId)).toBe(true);
      const list = String.raw`dag (\d+(?:(?:, | og )\d+)*)`;
      for (const [re, type] of [
        [new RegExp(`PS ${list}`, "g"), "ps"],
        [new RegExp(`e-posten ${list}`, "g"), "epost"],
        [
          new RegExp(`(?:transkriptet fra|sa Julius) ${list}`, "g"),
          "transkripsjon",
        ],
      ] as const) {
        for (const m of text.matchAll(re)) {
          for (const n of days(m[1])) {
            if (n !== dag)
              expect([dag, type, n, has(dag, type, n)]).toEqual([
                dag,
                type,
                n,
                true,
              ]);
          }
        }
      }
    }
  });
});

describe("get_kid_context", () => {
  it("dag 1–24 før løsning: ingen dagens eller senere kode, ingen av dagens biter", async () => {
    for (let d = 1; d <= 24; d++) {
      await play(d, d - 1);
      const out = await kid();
      const all = strings(out);
      for (const q of quests.filter((x) => x.dag >= d)) {
        const re = new RegExp(
          `(?<![\\p{L}\\p{N}])${q.kode}(?![\\p{L}\\p{N}])`,
          "iu",
        );
        for (const s of all)
          expect([d, q.kode, re.test(s)]).toEqual([d, q.kode, false]);
      }
      for (const t of pieceTexts(d)) {
        for (const s of all) expect([d, s.includes(t)]).toEqual([d, false]);
      }
      const today = out.days.find((x: { day: number }) => x.day === d);
      expect(today).toEqual({
        day: d,
        solved: false,
        mail: "[skjult]",
        video_transcript: "[skjult]",
      });
      memoryStore.reset();
    }
  });

  it("dag 1–24 etter løsning: dagens biter vises", async () => {
    for (let d = 1; d <= 24; d++) {
      await play(d, d);
      const out = await kid();
      const today = out.days.find((x: { day: number }) => x.day === d);
      expect(today.solved).toBe(true);
      expect(today.mail).not.toBe("[skjult]");
      expect(today.video_transcript).not.toBe("[skjult]");
      expect(JSON.stringify({ ...out, guidance: "" })).not.toContain(
        "[skjult]",
      );
      for (const p of pieces.filter((x) => x.dag === d && x.type === "fil")) {
        expect(
          out.files.find((f: { path: string }) => f.path.endsWith(`/${p.id}`))
            ?.piece_for,
        ).toContain(d);
      }
      for (const p of pieces.filter(
        (x) => x.dag === d && x.type === "symbol",
      )) {
        expect(
          out.symbols.find((s: { id: string }) => s.id === p.id)?.description,
        ).toBeTruthy();
      }
      expect(Buffer.byteLength(JSON.stringify(out))).toBeLessThanOrEqual(
        MAX_RESPONSE_BYTES,
      );
      memoryStore.reset();
    }
  });

  it("eldre biter i dagens gåte er skjult og merket (dag 5: dag 2, dag 21: stjernetegn)", async () => {
    await play(5, 4);
    const day2 = (await kid()).days.find((x: { day: number }) => x.day === 2);
    expect(day2).toMatchObject({ ps: "[skjult]", recap: "[skjult]" });
    // piece_for names only solved days; [5] would point at today's clue.
    expect(day2.piece_for).toBeUndefined();
    memoryStore.reset();
    await play(21, 20);
    const map = (await kid()).files.find((f: { path: string }) =>
      f.path.endsWith("stjernetegn.txt"),
    );
    expect(map).toEqual({
      path: "/DEKRYPTERT/stjernetegn.txt",
      content: "[skjult]",
      piece_for: [18],
    });
  });

  it("piece_for peker aldri på en framtidig eller uløst dag", async () => {
    for (let d = 1; d <= 24; d++) {
      await play(d, d - 1);
      const out = await kid();
      for (const x of [...out.days, ...out.files, ...out.symbols]) {
        const days = Array.isArray(x.piece_for)
          ? x.piece_for
          : Object.values(x.piece_for ?? {}).flat();
        for (const n of days) expect([d, n < d]).toEqual([d, true]);
      }
      memoryStore.reset();
    }
  });

  it("en uløst eldre dag står som skjult, ikke utelatt", async () => {
    await play(10, 9);
    await memoryStore.putState(
      "nissekomm-codes",
      quests
        .filter((q) => q.dag <= 9 && q.dag !== 3)
        .map((q) => ({ kode: q.kode, dato: "x" })),
      true,
    );
    const day3 = (await kid()).days.find((x: { day: number }) => x.day === 3);
    expect(day3).toEqual({
      day: 3,
      solved: false,
      mail: "[skjult]",
      video_transcript: "[skjult]",
    });
  });

  it("guidance er ordrett, også når svaret kuttes", async () => {
    await play(24, 24);
    await memoryStore.putState(
      "nissekomm-earned-badges",
      Array.from({ length: 30 }, (_, i) => `merke-${i}-${"x".repeat(400)}`),
    );
    const text = await callTool("read", "get_kid_context");
    expect(Buffer.byteLength(text)).toBeLessThanOrEqual(MAX_RESPONSE_BYTES);
    const out = JSON.parse(text);
    expect(out.guidance).toBe(KID_GUIDANCE);
    expect(out.schema_version).toBe(1);
    expect(out.now).toBe("2026-12-24T21:00:00+01:00");
    expect(out.truncated).toBe(true);
    expect(out.days[0].day).toBe(24);
  });

  it("dag 24 med alt løst holder seg under 10 KB, med guidance og alle dager", async () => {
    await play(24, 24);
    await memoryStore.putState("nissekomm-earned-badges", ["varmebaerer"]);
    const text = await callTool("read", "get_kid_context");
    expect(Buffer.byteLength(text)).toBeLessThan(10 * 1024);
    const out = JSON.parse(text);
    expect(out.guidance).toBe(KID_GUIDANCE);
    expect(out.days).toHaveLength(24);
    expect(out.symbols).toHaveLength(9);
    expect(
      out.files.some((f: { path: string }) => f.path.endsWith(".log")),
    ).toBe(false);
    expect(out.days[1]).toEqual({
      day: 23,
      solved: true,
      title: expect.any(String),
      recap: expect.any(String),
    });
  });

  it("read og parent får det samme; bare operatørens falske klokke gjelder for operatøren", async () => {
    await play(10, 9);
    const op = { sub: "op", name: "operator", level: "parent" as const };
    expect(await kid("parent")).toEqual(await kid("read"));
    await callTool(op, "set_fake_now", { now: "2026-12-03T10:00:00+01:00" });
    expect((await kid(op)).day).toBe(3);
    expect((await kid("read")).day).toBe(10);
    expect(
      (await kid({ sub: "varden", name: "varden", level: "read" })).day,
    ).toBe(10);
  });
});

describe("romjul", () => {
  it("26.12 and 15.1 see day 24: unsolved pieces hidden, no codes; 1.2 sees nothing", async () => {
    await play(24, 22);
    jest.setSystemTime(new Date("2026-12-26T12:00:00+01:00"));
    const out = JSON.stringify(await kid());
    expect(out).toContain("[skjult]");
    for (const q of quests.filter((x) => x.dag >= 23)) {
      if (!/^\d+$/.test(q.kode))
        expect(out.toUpperCase()).not.toContain(q.kode.toUpperCase());
    }
    jest.setSystemTime(new Date("2027-01-15T12:00:00+01:00"));
    const mid = await kid();
    expect(mid.day).toBe(24);
    expect(JSON.stringify(mid)).toContain("[skjult]");
    jest.setSystemTime(new Date("2027-02-01T12:00:00+01:00"));
    const jan = JSON.stringify(await kid());
    for (const q of quests) {
      if (!/^\d+$/.test(q.kode))
        expect(jan.toUpperCase()).not.toContain(q.kode.toUpperCase());
    }
  });
});
