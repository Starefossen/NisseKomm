/**
 * @jest-environment node
 */
import {
  describe,
  it,
  expect,
  afterEach,
  beforeAll,
  jest,
} from "@jest/globals";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { getAllOppdrag } from "@/lib/oppdrag";
import { memoryStore } from "@/lib/db";
import {
  CODE_WORDS,
  MAX_RESPONSE_BYTES,
  TOOLS,
  TV_GRADE_OVERRIDE,
  callTool,
} from "@/lib/mcp/tools";
import { mp3Duration } from "@/lib/mcp/clips";
import { POST } from "@/app/mcp/route";

const quests = getAllOppdrag();
const at = (day: number, hour: number, month = 12) =>
  new Date(
    `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00+01:00`,
  );
const solvedUpTo = async (n: number) =>
  memoryStore.putState(
    "nissekomm-codes",
    quests.filter((q) => q.dag <= n).map((q) => ({ kode: q.kode, dato: "x" })),
  );
const screen = async (who: Parameters<typeof callTool>[0] = "read") =>
  JSON.parse(await callTool(who, "get_screen"));
const operator = { name: "operator", level: "parent" as const };

afterEach(() => {
  jest.useRealTimers();
  memoryStore.reset();
});

describe("get_screen", () => {
  it("har schema_version, Oslo-tid og dagens dører", async () => {
    await solvedUpTo(4);
    jest.useFakeTimers({ now: at(5, 7) });
    const s = await screen();
    expect(s.schema_version).toBe(1);
    expect(s.now).toBe("2026-12-05T07:00:00+01:00");
    expect(s.doors[3].state).toBe("completed");
    expect(s.doors[4].state).toBe("available");
    expect(s.doors[5].state).toBe("locked");
    expect(s.title).toBe(quests[4].tittel);
    expect(s.teaser).toBeTruthy();
  });

  it("ingen tittel før 06:00", async () => {
    jest.useFakeTimers({ now: at(5, 5) });
    const s = await screen();
    expect(s.title).toBeNull();
    expect(s.tv.phase).toBe("natt");
    expect(s.tv.phase_next_change_at).toBe("2026-12-05T06:00:00+01:00");
    expect(s.next_change_at).toBe("2026-12-05T06:00:00+01:00");
  });

  it.each([
    [7, "morgen", "2026-12-03T09:00:00+01:00"],
    [12, "dag", "2026-12-03T15:00:00+01:00"],
    [16, "skumring", "2026-12-03T19:00:00+01:00"],
    [22, "natt", "2026-12-04T06:00:00+01:00"],
  ])("kl. %i er fasen %s", async (hour, phase, next) => {
    jest.useFakeTimers({ now: at(3, hour) });
    const s = await screen();
    expect(s.tv.phase).toBe(phase);
    expect(s.tv.phase_next_change_at).toBe(next);
    expect(Date.parse(s.next_change_at)).toBeLessThanOrEqual(Date.parse(next));
  });

  it("TV-tilstand og events", async () => {
    for (const [day, state] of [
      [3, "rolig"],
      [17, "rolig"],
      [18, "storm"],
    ] as const) {
      jest.useFakeTimers({ now: at(day, 10) });
      const s = await screen();
      expect(s.tv.state).toBe(state);
      expect(s.tv.variant).toBe(`/media/video/tv/landsby-${state}.mp4`);
      expect(s).not.toHaveProperty("events");
      if (state === "rolig") {
        expect(s.tv.events.length).toBeGreaterThan(0);
        expect(s.tv.events[0]).toMatchObject({ kind: "overlay", url: null });
        expect(Date.parse(s.tv.events[0].at)).toBeGreaterThan(
          at(day, 10).getTime() - 60_000,
        );
      } else {
        expect(s.tv.events).toEqual([]);
        expect(s.tv.poster_url).toBe("/media/feed/sn%C3%B8fall-storm.png");
      }
    }
    await solvedUpTo(16);
    jest.useFakeTimers({ now: at(17, 10) });
    expect((await screen()).tv.poster_url).toBe(
      "/media/feed/landsby-rolig.jpg",
    );
    await solvedUpTo(17);
    jest.useFakeTimers({ now: at(17, 10) });
    expect((await screen()).tv.state).toBe("nordlys");
    await solvedUpTo(24);
    jest.useFakeTimers({ now: at(24, 10) });
    expect((await screen()).tv.state).toBe("dag24");
  });

  it("tv.grade mangler uten overstyring, none med", async () => {
    jest.useFakeTimers({ now: at(3, 7) });
    expect((await screen()).tv).not.toHaveProperty("grade");
    TV_GRADE_OVERRIDE.morgen = "none";
    try {
      expect((await screen()).tv.grade).toBe("none");
      jest.useFakeTimers({ now: at(3, 12) });
      expect((await screen()).tv).not.toHaveProperty("grade");
    } finally {
      delete TV_GRADE_OVERRIDE.morgen;
    }
  });

  it("Rampenissen sett etter 09 på hverdag, 10 i helgen", async () => {
    jest.useFakeTimers({ now: at(3, 9) }); // torsdag
    expect((await screen()).rampenissen_seen).toBe(true);
    jest.useFakeTimers({ now: at(5, 9) }); // lørdag
    expect((await screen()).rampenissen_seen).toBe(false);
  });

  it("frost_day: dag 10 først på dagen, dag 21 fra dag 20", async () => {
    const frostDays = async (d: number) => {
      jest.useFakeTimers({ now: at(d, 7) });
      return (await screen()).doors
        .filter((x: { frost_day: boolean }) => x.frost_day)
        .map((x: { day: number }) => x.day);
    };
    expect(await frostDays(9)).toEqual([]);
    expect(await frostDays(10)).toEqual([10]);
    expect(await frostDays(19)).toEqual([10]);
    expect(await frostDays(20)).toEqual([10, 21]);
  });

  it("today.solved, solved_at, milepæl og nedtelling", async () => {
    await solvedUpTo(6);
    jest.useFakeTimers({ now: at(7, 10) });
    let s = await screen();
    expect(s.today).toEqual({
      solved: false,
      solved_at: null,
      milestone_reached: false,
    });
    expect(s.milestone_latest).toEqual({ id: "M1", name: "Linjen" });
    expect(s.milestone_latest).not.toEqual(
      expect.objectContaining({ name: "Navnet" }),
    );
    expect(s.countdown_days).toBe(17);
    expect(s.season).toBe("2026");
    await memoryStore.putState(
      "nissekomm-codes",
      quests
        .filter((q) => q.dag <= 7)
        .map((q) => ({ kode: q.kode, dato: "2026-12-07T08:42:10.000Z" })),
    );
    s = await screen();
    expect(s.today).toEqual({
      solved: true,
      solved_at: "2026-12-07T09:42:00+01:00",
      milestone_reached: true,
    });
    expect(s.milestone_latest).toEqual({ id: "M2", name: "Navnet" });
    jest.useFakeTimers({ now: at(26, 10) });
    expect((await screen()).countdown_days).toBe(0);
  });

  it("NISSEKOMM_PUBLIC_BASE gir absolutte medie-URL-er", async () => {
    process.env.NISSEKOMM_PUBLIC_BASE = "https://nisse.example/";
    try {
      jest.useFakeTimers({ now: at(3, 10) });
      const s = await screen();
      expect(s.tv.variant).toBe(
        "https://nisse.example/media/video/tv/landsby-rolig.mp4",
      );
      expect(s.tv.poster_url).toBe(
        "https://nisse.example/media/feed/landsby-rolig.jpg",
      );
    } finally {
      delete process.env.NISSEKOMM_PUBLIC_BASE;
    }
  });

  it.each([1, 10, 17, 24])("dag %i: uopptjente koder sensureres", async (d) => {
    for (const upTo of [0, d - 1, d]) {
      memoryStore.reset();
      await solvedUpTo(upTo);
      const earned = new Set(
        quests.filter((q) => q.dag <= upTo).map((q) => q.kode.toUpperCase()),
      );
      jest.useFakeTimers({ now: at(d, 10) });
      for (const out of [
        await callTool("read", "get_screen"),
        await callTool(operator, "preview_screen", { as_caller: "skjerm" }),
      ]) {
        for (const c of CODE_WORDS) {
          if (/^\d+$/.test(c) || earned.has(c.toUpperCase())) continue;
          expect(out.toUpperCase()).not.toContain(c.toUpperCase());
        }
        expect(Buffer.byteLength(out)).toBeLessThan(MAX_RESPONSE_BYTES);
      }
    }
  });

  it("Kulde får navn når dag 7 er løst", async () => {
    jest.useFakeTimers({ now: at(8, 10) });
    expect((await screen()).antagonist_name).toBeNull();
    await solvedUpTo(7);
    expect((await screen()).antagonist_name).toBe("Kulde");
  });

  it("dag 10 frost før løsning", async () => {
    jest.useFakeTimers({ now: at(10, 7) });
    const s = await screen();
    expect(s.frost.active).toBe(true);
    expect(s.frost_percent).toBe(71);
  });
});

describe("set_fake_now", () => {
  it("gjelder bare kalleren og utløper etter 24 timer", async () => {
    jest.useFakeTimers({ now: at(10, 12, 11) });
    const res = JSON.parse(
      await callTool(operator, "set_fake_now", {
        now: at(21, 8).toISOString(),
      }),
    );
    expect(res.schema_version).toBe(1);
    expect((await screen(operator)).day).toBe(21);
    expect((await screen(operator)).frost.active).toBe(true);
    expect((await screen("read")).day).toBeNull();
    expect(
      JSON.parse(
        await callTool(operator, "preview_screen", { as_caller: "read" }),
      ).day,
    ).toBeNull();
    jest.setSystemTime(Date.now() + 23 * 3600 * 1000);
    expect((await screen(operator)).day).toBe(22);
    jest.setSystemTime(Date.now() + 2 * 3600 * 1000);
    expect((await screen(operator)).day).toBeNull();
  });

  it("tom now nullstiller, ugyldig now feiler", async () => {
    jest.useFakeTimers({ now: at(10, 12, 11) });
    await callTool(operator, "set_fake_now", { now: at(5, 8).toISOString() });
    await callTool(operator, "set_fake_now", { now: "" });
    expect((await screen(operator)).day).toBeNull();
    await expect(
      callTool(operator, "set_fake_now", { now: "i morgen" }),
    ).rejects.toThrow();
  });

  it("endrer TV-fasen", async () => {
    jest.useFakeTimers({ now: at(3, 12) });
    await callTool(operator, "set_fake_now", { now: at(3, 20).toISOString() });
    expect((await screen(operator)).tv.phase).toBe("natt");
    await callTool(operator, "set_fake_now", { now: "" });
  });
});

describe("get_clips", () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(path.join(tmpdir(), "clips-"));
    mkdirSync(path.join(dir, "audio/rampenissen"), { recursive: true });
    // 128 kbps, 44.1 kHz frame header plus 16 000 bytes = 1 s.
    const buf = Buffer.alloc(16000);
    buf.set([0xff, 0xfb, 0x90, 0x00]);
    writeFileSync(path.join(dir, "audio/rampenissen/dag-03.mp3"), buf);
    process.env.MEDIA_DIR = dir;
  });

  it("gir URL, varighet og sha256, ready false når fila mangler", async () => {
    jest.useFakeTimers({ now: at(4, 5) });
    const ok = JSON.parse(
      await callTool("read", "get_clips", { date: "2026-12-03" }),
    );
    expect(ok.schema_version).toBe(1);
    expect(ok.clips[0]).toMatchObject({
      url: "/media/audio/rampenissen/dag-03.mp3",
      ready: true,
      duration_s: 1,
    });
    expect(ok.clips[0].sha256).toMatch(/^[0-9a-f]{64}$/);
    const missing = JSON.parse(
      await callTool("read", "get_clips", { date: "2026-12-04" }),
    );
    expect(missing.clips[0]).toMatchObject({ ready: false, sha256: null });
  });

  it("aldri en dato etter i dag", async () => {
    jest.useFakeTimers({ now: at(4, 5) });
    const out = JSON.parse(
      await callTool("read", "get_clips", { date: "2026-12-05" }),
    );
    expect(out.clips).toEqual([]);
  });

  it("mp3Duration leser Xing-rammetall", () => {
    const buf = Buffer.alloc(400);
    buf.set([0xff, 0xfb, 0x90, 0x00]);
    buf.write("Xing", 36, "latin1");
    buf.writeUInt32BE(1, 40);
    buf.writeUInt32BE(441, 44); // 441 * 1152 / 44100 = 11.52 s
    expect(mp3Duration(buf)).toBe(11.52);
  });
});

describe("get_letters", () => {
  it("gir brev med navn og dato", async () => {
    await memoryStore.putState("nissekomm-santa-letters", [
      { day: 3, from: "Håkon", content: "Kjære Julius" },
      { day: 4, content: "x".repeat(5000) },
    ]);
    const out = JSON.parse(await callTool(operator, "get_letters"));
    expect(out.letters[0]).toEqual({
      from: "Håkon",
      date: "2026-12-03",
      day: 3,
      content: "Kjære Julius",
    });
    expect(out.letters[1].from).toBeNull();
    expect(out.letters[1].content.length).toBe(2000);
  });

  it("24 lange brev holder seg under 16 KB", async () => {
    await memoryStore.putState(
      "nissekomm-santa-letters",
      Array.from({ length: 24 }, (_, i) => ({
        day: i + 1,
        from: "Kristian",
        content: "æ".repeat(2000),
      })),
    );
    const out = await callTool(operator, "get_letters");
    expect(Buffer.byteLength(out)).toBeLessThan(MAX_RESPONSE_BYTES);
    expect(JSON.parse(out).letters).toHaveLength(24);
  });
});

describe("tilgang", () => {
  const PARENT_ONLY = ["get_letters", "set_fake_now", "preview_screen"];
  it("nye foreldreverktøy er parent", () => {
    for (const t of PARENT_ONLY) expect(TOOLS[t].level).toBe("parent");
    expect(TOOLS.get_screen.level).toBe("read");
    expect(TOOLS.get_clips.level).toBe("read");
  });

  it("read-token når ikke foreldreverktøy over HTTP", async () => {
    process.env.NISSEKOMM_MODE = "lan";
    process.env.MCP_DEV_TOKEN = "read:lese-token-1,parent:foreldre-token-1";
    const call = (tok: string, method: string, params: object = {}) =>
      POST(
        new Request("http://localhost/mcp", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json, text/event-stream",
            authorization: `Bearer ${tok}`,
          },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        }),
      ).then((r) => r.json());
    try {
      const list = await call("lese-token-1", "tools/list");
      const names = list.result.tools.map((t: { name: string }) => t.name);
      for (const t of PARENT_ONLY) {
        expect(names).not.toContain(t);
        const res = await call("lese-token-1", "tools/call", {
          name: t,
          arguments: { now: "2026-12-24T10:00:00+01:00", as_caller: "x" },
        });
        expect(res.result.isError).toBe(true);
      }
      const ok = await call("foreldre-token-1", "tools/call", {
        name: "get_letters",
        arguments: {},
      });
      expect(ok.result.isError).toBeUndefined();
    } finally {
      delete process.env.MCP_DEV_TOKEN;
    }
  });
});

// MCP_FIXTURES_DIR=<dir> writes example get_screen answers for Varden.
describe("get_screen-eksempler", () => {
  const dir = process.env.MCP_FIXTURES_DIR;
  it.each([
    ["morgen", 5, 7, 4],
    ["kveld", 5, 20, 5],
    ["frost", 10, 7, 9],
    ["dag24", 24, 18, 24],
  ])("%s", async (name, day, hour, upTo) => {
    await solvedUpTo(upTo);
    await memoryStore.putState(
      "nissekomm-earned-badges",
      upTo >= 24 ? ["portvokter", "snofalls-venn"] : [],
    );
    jest.useFakeTimers({ now: at(day, hour) });
    const out = await callTool("read", "get_screen");
    if (dir) {
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        path.join(dir, `get_screen-${name}.json`),
        JSON.stringify(JSON.parse(out), null, 2) + "\n",
      );
    }
    expect(JSON.parse(out).day).toBe(day);
  });
});
