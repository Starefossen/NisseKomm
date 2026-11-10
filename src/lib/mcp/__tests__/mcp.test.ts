/**
 * @jest-environment node
 */
import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  jest,
} from "@jest/globals";
import { SignJWT, exportJWK, generateKeyPair, type JWK } from "jose";
import { getAllOppdrag } from "@/lib/oppdrag";
import { memoryStore } from "@/lib/db";
import { CODE_WORDS, TOOLS, callTool } from "@/lib/mcp/tools";
import { POST } from "@/app/mcp/route";

const ISS = "https://id.example/oauth2/openid/mcp";
const READER = "071d4ebd-89ba-445b-80a6-c1bfd5e756ba";
const PARENT = "00e6aa3b-4146-4ea1-9a81-0498eb2585d6";
const READ_TOOLS = Object.keys(TOOLS).filter((t) => TOOLS[t].level === "read");

describe("read-verktøy lekker ikke koder eller hint", () => {
  const quests = getAllOppdrag();
  const hints = quests.map((q) => q.fysisk_hint).filter((h) => h.length > 12);
  const allSolved = {
    "nissekomm-codes": quests.map((q) => ({ kode: q.kode, dato: "x" })),
    "nissekomm-earned-badges": ["a"],
  };

  afterEach(() => {
    jest.useRealTimers();
    memoryStore.reset();
  });

  it("finner kodene i src/data", () => {
    expect(CODE_WORDS.length).toBeGreaterThanOrEqual(24);
  });

  const solvedUpTo = (n: number) => ({
    "nissekomm-codes": quests
      .filter((q) => q.dag <= n)
      .map((q) => ({ kode: q.kode, dato: "x" })),
  });

  it.each(Array.from({ length: 24 }, (_, i) => i + 1))("dag %i", async (d) => {
    // [state, highest day the kids have solved]
    const cases: Array<[Record<string, unknown>, number]> = [
      [{}, 0],
      [solvedUpTo(d - 1), d - 1],
      [allSolved, d],
    ];
    for (const [state, upTo] of cases) {
      memoryStore.reset();
      for (const [k, v] of Object.entries(state)) {
        await memoryStore.putState(k, v);
      }
      const earned = new Set(
        quests.filter((q) => q.dag <= upTo).map((q) => q.kode.toUpperCase()),
      );
      const forbidden = CODE_WORDS.filter(
        (c) => !/^\d+$/.test(c) && !earned.has(c.toUpperCase()),
      );
      for (const hour of [7, 10, 21]) {
        jest.useFakeTimers({ now: new Date(2026, 11, d, hour) });
        for (const tool of READ_TOOLS) {
          const out = await callTool("read", tool, {
            date: `2026-12-${String(d).padStart(2, "0")}`,
          });
          for (const c of forbidden) {
            expect(out.toUpperCase()).not.toContain(c.toUpperCase());
          }
          for (const h of hints) expect(out).not.toContain(h);
        }
        jest.useRealTimers();
      }
    }
  });

  it("løste koder fra før i dag står igjen (Kulde etter dag 7)", async () => {
    await memoryStore.putState(
      "nissekomm-codes",
      solvedUpTo(7)["nissekomm-codes"],
    );
    jest.useFakeTimers({ now: new Date(2026, 11, 8, 10) });
    expect(await callTool("read", "get_today_quest")).toMatch(/KULDE/i);
    memoryStore.reset();
    expect(await callTool("read", "get_today_quest")).not.toMatch(/KULDE/i);
  });

  it("dag 24 gir gyldig JSON med riktig dag og dato", async () => {
    jest.useFakeTimers({ now: new Date(2026, 11, 24, 10) });
    expect(JSON.parse(await callTool("read", "get_state")).date).toBe(
      "2026-12-24",
    );
    expect(JSON.parse(await callTool("read", "get_today_quest")).day).toBe(24);
  });

  it("dagens oppdrag viser bare i dag", async () => {
    jest.useFakeTimers({ now: new Date(2026, 11, 5, 10) });
    const q = JSON.parse(await callTool("read", "get_today_quest"));
    expect(q.day).toBe(5);
    expect(Object.keys(q).sort()).toEqual(
      ["day", "mail", "schema_version", "title", "video_transcript"].sort(),
    );
  });
});

describe("autentisering", () => {
  let jwk: JWK;
  let key: CryptoKey;
  let otherKey: CryptoKey;

  beforeAll(async () => {
    const kp = await generateKeyPair("ES256");
    key = kp.privateKey;
    otherKey = (await generateKeyPair("ES256")).privateKey;
    jwk = { ...(await exportJWK(kp.publicKey)), kid: "k1", alg: "ES256" };
    process.env.NISSEKOMM_MODE = "lan";
    process.env.MCP_ISSUER = ISS;
    process.env.MCP_JWKS_URL = `${ISS}/public_key.jwk`;
    process.env.MCP_CALLERS = JSON.stringify({
      [READER]: { name: "varden-jwt", level: "read" },
      [PARENT]: { name: "operator-jwt", level: "parent" },
    });
    jest.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response(JSON.stringify({ keys: [jwk] }), {
          headers: { "content-type": "application/json" },
        }),
    );
  });

  const token = (
    claims: Record<string, unknown> = {},
    opts: { aud?: string; sub?: string; k?: CryptoKey } = {},
  ) =>
    new SignJWT({ scope: "openid groups", ...claims })
      .setProtectedHeader({ alg: "ES256", typ: "at+jwt", kid: "k1" })
      .setIssuer(ISS)
      .setAudience(opts.aud ?? "mcp")
      .setSubject(opts.sub ?? READER)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(opts.k ?? key);

  const call = (auth: string | null, name: string, id = 1) =>
    POST(
      new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          ...(auth ? { authorization: `Bearer ${auth}` } : {}),
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id,
          method: "tools/call",
          params: { name, arguments: { day: 3 } },
        }),
      }),
    );

  it("uten token gir 401", async () => {
    expect((await call(null, "get_state")).status).toBe(401);
  });

  it("feil audience gir 401", async () => {
    const t = await token({}, { aud: "noe-annet" });
    expect((await call(t, "get_state")).status).toBe(401);
  });

  it("ukjent sub gir 401", async () => {
    const t = await token({}, { sub: "ukjent" });
    expect((await call(t, "get_state")).status).toBe(401);
  });

  it("manglende scope og feil nøkkel gir 401", async () => {
    expect(
      (await call(await token({ scope: "openid" }), "get_state")).status,
    ).toBe(401);
    expect(
      (await call(await token({}, { k: otherKey }), "get_state")).status,
    ).toBe(401);
  });

  it("feil typ, alg, utsteder og manglende eller utløpt exp gir 401", async () => {
    const jwt = (
      header: Record<string, string>,
      exp: string | number | null,
      iss = ISS,
    ) => {
      const s = new SignJWT({ scope: "openid groups" })
        .setProtectedHeader({ alg: "ES256", kid: "k1", ...header })
        .setIssuer(iss)
        .setAudience("mcp")
        .setSubject(PARENT)
        .setIssuedAt(Math.floor(Date.now() / 1000) - 3600);
      if (exp !== null) s.setExpirationTime(exp);
      return s.sign(key);
    };
    const ok = await jwt({ typ: "at+jwt" }, "5m");
    expect((await call(ok, "get_state")).status).toBe(200);
    const bad = [
      await jwt({ typ: "JWT" }, "5m"),
      await jwt({}, "5m"),
      await jwt({ typ: "at+jwt" }, null),
      // Past the 60 s clock tolerance.
      await jwt({ typ: "at+jwt" }, Math.floor(Date.now() / 1000) - 120),
      await jwt({ typ: "at+jwt" }, "5m", "https://evil.example"),
      // alg confusion: HS256 keyed with the public JWK's bytes.
      await new SignJWT({ scope: "openid groups" })
        .setProtectedHeader({ alg: "HS256", typ: "at+jwt", kid: "k1" })
        .setIssuer(ISS)
        .setAudience("mcp")
        .setSubject(PARENT)
        .setExpirationTime("5m")
        .sign(new TextEncoder().encode(JSON.stringify(jwk))),
      "ikke.en.jwt",
    ];
    for (const t of bad) expect((await call(t, "get_state")).status).toBe(401);
  });

  it("read ser ikke parent-verktøy i tools/list", async () => {
    const res = await POST(
      new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          authorization: `Bearer ${await token()}`,
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      }),
    );
    const names = (await res.json()).result.tools.map(
      (t: { name: string }) => t.name,
    );
    expect(names.sort()).toEqual([...READ_TOOLS].sort());
  });

  it("read kan lese, men ikke kalle parent-verktøy", async () => {
    const t = await token();
    const ok = await (await call(t, "get_state")).json();
    expect(ok.result.isError).toBeUndefined();
    const denied = await (await call(t, "give_hint")).json();
    expect(denied.result.isError).toBe(true);
  });

  it("parent kan få hint", async () => {
    const t = await token({}, { sub: PARENT });
    const res = await (await call(t, "give_hint")).json();
    expect(res.result.isError).toBeUndefined();
    expect(res.result.content[0].text).not.toContain(getAllOppdrag()[2].kode);
  });

  it("dev-token virker utenfor produksjon og aldri i produksjon", async () => {
    process.env.MCP_DEV_TOKEN = "parent:dev-hemmelig";
    expect((await call("dev-hemmelig", "give_hint")).status).toBe(200);
    const env = process.env as Record<string, string>;
    const old = env.NODE_ENV;
    env.NODE_ENV = "production";
    try {
      expect((await call("dev-hemmelig", "give_hint")).status).toBe(401);
    } finally {
      env.NODE_ENV = old;
      delete process.env.MCP_DEV_TOKEN;
    }
  });

  it("public-modus gir 404", async () => {
    process.env.NISSEKOMM_MODE = "public";
    try {
      expect((await call(await token(), "get_state")).status).toBe(404);
    } finally {
      process.env.NISSEKOMM_MODE = "lan";
    }
  });
});
