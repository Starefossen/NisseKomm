/** @jest-environment node */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import { memoryStore } from "@/lib/db";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

let testDir: string;

function makeReq(
  method: "GET" | "POST",
  body?: unknown,
  headers: Record<string, string> = {},
) {
  return new NextRequest("http://lan/api/media/vurdering", {
    method,
    headers: {
      ...headers,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

beforeEach(async () => {
  testDir = mkdtempSync(path.join(tmpdir(), "vurdering-test-"));
  process.env.MEDIA_DIR = testDir;
  process.env.NISSEKOMM_MODE = "lan";
  process.env.MCP_DEV_TOKEN = "read:readtoken1,parent:parenttoken1";
  // The raw clip is read from cwd/assets/out; a checkout with real takes must not leak in.
  jest.spyOn(process, "cwd").mockReturnValue(testDir);
  // Verdicts need the file to exist (fable r3 #5).
  for (const f of [
    ...[1, 2, 3, 5].map((d) => `video/julius/dag-0${d}.mp4`),
    "audio/rampenissen/dag-02.mp3",
  ]) {
    mkdirSync(path.dirname(path.join(testDir, f)), { recursive: true });
    writeFileSync(path.join(testDir, f), f);
  }
  memoryStore.reset();
  for (const role of ["kid", "parent"] as const) {
    await memoryStore.setSession(sha(role), {
      role,
      expires: Date.now() + 60_000,
    });
  }
});

afterEach(() => {
  jest.restoreAllMocks();
  rmSync(testDir, { recursive: true, force: true });
  delete process.env.MEDIA_DIR;
  delete process.env.NISSEKOMM_MODE;
});

describe("API /api/media/vurdering - Authentication", () => {
  it("requires parent cookie or bearer token", async () => {
    // Unauthenticated
    const resGetUnauth = await GET(makeReq("GET"));
    expect(resGetUnauth.status).toBe(401);

    const resPostUnauth = await POST(
      makeReq("POST", {
        path: "video/julius/dag-01.mp4",
        vurdering: "godkjent",
      }),
    );
    expect(resPostUnauth.status).toBe(401);

    // Kid role is forbidden
    const resKid = await POST(
      makeReq(
        "POST",
        { path: "video/julius/dag-01.mp4", vurdering: "godkjent" },
        { cookie: "__Host-nissekomm=kid" },
      ),
    );
    expect(resKid.status).toBe(403);

    // Parent role cookie succeeds
    const resParentCookie = await POST(
      makeReq(
        "POST",
        { path: "video/julius/dag-01.mp4", vurdering: "godkjent" },
        { cookie: "__Host-nissekomm-guide=parent" },
      ),
    );
    expect(resParentCookie.status).toBe(200);

    // Parent bearer succeeds
    const resBearer = await POST(
      makeReq(
        "POST",
        {
          path: "video/julius/dag-02.mp4",
          vurdering: "lag_paa_nytt",
          notat: "for mørk",
        },
        { authorization: "Bearer parenttoken1" },
      ),
    );
    expect(resBearer.status).toBe(200);

    // Read bearer is forbidden
    const resReadBearer = await POST(
      makeReq(
        "POST",
        { path: "video/julius/dag-03.mp4", vurdering: "godkjent" },
        { authorization: "Bearer readtoken1" },
      ),
    );
    expect(resReadBearer.status).toBe(403);
  });

  it("returns 404 in public mode", async () => {
    process.env.NISSEKOMM_MODE = "public";
    const res = await POST(
      makeReq(
        "POST",
        { path: "video/julius/dag-01.mp4", vurdering: "godkjent" },
        { cookie: "__Host-nissekomm-guide=parent" },
      ),
    );
    expect(res.status).toBe(404);
  });
});

describe("API /api/media/vurdering - Validation", () => {
  const auth = { cookie: "__Host-nissekomm-guide=parent" };

  it("rejects invalid json or non-object bodies with 400", async () => {
    const rawReq = new NextRequest("http://lan/api/media/vurdering", {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(rawReq);
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe("Ugyldig forespørsel");
    expect(text).not.toMatch(/Error|stack|at /);

    const resArray = await POST(makeReq("POST", [1, 2, 3], auth));
    expect(resArray.status).toBe(400);
  });

  it("rejects invalid, empty, or traversal paths with 400", async () => {
    for (const badPath of [
      "",
      "   ",
      123,
      null,
      "../secret.json",
      "video/../../etc/passwd",
      "/absolute/path.mp4",
      "video/null\0byte.mp4",
    ]) {
      const res = await POST(
        makeReq("POST", { path: badPath, vurdering: "godkjent" }, auth),
      );
      expect(res.status).toBe(400);
      expect(await res.text()).toBe("Ugyldig forespørsel");
    }
  });

  it("rejects ids that name nothing (day 99, a segment the script lacks, an unknown guide id)", async () => {
    for (const p of [
      "video/julius/dag-99#s1",
      "video/julius/dag-13#s9",
      "video/julius/dag-99.mp4",
      "dag/31/kveld",
      "noe/helt/annet",
      "video/julius/dag-13.mp4#s1",
    ]) {
      const res = await POST(
        makeReq("POST", { path: p, vurdering: "godkjent" }, auth),
      );
      expect(res.status).toBe(400);
    }
    const ok = await POST(
      makeReq(
        "POST",
        { path: "dag/04/gaatekart", vurdering: "godkjent" },
        auth,
      ),
    );
    expect(ok.status).toBe(200);
  });

  it("rejects unrecognized verdicts with 400", async () => {
    for (const badVerdict of ["approved", "redo", "OK", 42, true]) {
      const res = await POST(
        makeReq(
          "POST",
          { path: "video/julius/dag-01.mp4", vurdering: badVerdict },
          auth,
        ),
      );
      expect(res.status).toBe(400);
      expect(await res.text()).toBe("Ugyldig forespørsel");
    }
  });

  it("rejects invalid or oversized notes with 400", async () => {
    const resType = await POST(
      makeReq(
        "POST",
        {
          path: "video/julius/dag-01.mp4",
          vurdering: "godkjent",
          notat: 12345,
        },
        auth,
      ),
    );
    expect(resType.status).toBe(400);

    const resLong = await POST(
      makeReq(
        "POST",
        {
          path: "video/julius/dag-01.mp4",
          vurdering: "godkjent",
          notat: "a".repeat(1001),
        },
        auth,
      ),
    );
    expect(resLong.status).toBe(400);
  });
});

describe("API /api/media/vurdering - Functionality", () => {
  const auth = { cookie: "__Host-nissekomm-guide=parent" };

  it("saves verdicts and notes, and serves them via GET", async () => {
    // Initial GET returns empty map
    const initialGet = await GET(makeReq("GET", undefined, auth));
    expect(initialGet.status).toBe(200);
    expect(await initialGet.json()).toEqual({});

    // Save item 1
    const res1 = await POST(
      makeReq(
        "POST",
        {
          path: "video/julius/dag-01.mp4",
          vurdering: "godkjent",
          notat: "Godkjent av Hans",
        },
        auth,
      ),
    );
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.ok).toBe(true);
    expect(body1.path).toBe("video/julius/dag-01.mp4");
    expect(body1.entry).toMatchObject({
      vurdering: "godkjent",
      notat: "Godkjent av Hans",
    });

    // Save item 2
    const res2 = await POST(
      makeReq(
        "POST",
        {
          path: "audio/rampenissen/dag-02.mp3",
          vurdering: "lag_paa_nytt",
          notat: "Stemmen var litt uklar",
        },
        auth,
      ),
    );
    expect(res2.status).toBe(200);

    // GET should return both
    const afterGet = await GET(makeReq("GET", undefined, auth));
    expect(afterGet.status).toBe(200);
    const all = await afterGet.json();
    expect(all["video/julius/dag-01.mp4"]).toMatchObject({
      vurdering: "godkjent",
      notat: "Godkjent av Hans",
    });
    expect(all["audio/rampenissen/dag-02.mp3"]).toMatchObject({
      vurdering: "lag_paa_nytt",
      notat: "Stemmen var litt uklar",
    });
  });

  it("tags alone never restamp a verdict onto changed content", async () => {
    const fs = await import("node:fs/promises");
    const fil = "video/julius/dag-03.mp4";
    await fs.mkdir(path.join(testDir, "video/julius"), { recursive: true });
    await fs.writeFile(path.join(testDir, fil), "tagning 1");
    await POST(makeReq("POST", { path: fil, vurdering: "godkjent" }, auth));
    await fs.writeFile(path.join(testDir, fil), "tagning nummer 2");
    const res = await POST(
      makeReq("POST", { path: fil, tagger: ["pause"], tid: 4 }, auth),
    );
    expect(res.status).toBe(200);
    const all = await (await GET(makeReq("GET", undefined, auth))).json();
    expect(all[fil].vurdering).toBeUndefined();
    expect(all[fil].forrige).toMatchObject({ vurdering: "godkjent" });
  });

  it("a saved ✂ starts the cut for that day; kid and public mode never do", async () => {
    const fs = await import("node:fs");
    // A stand-in julius-dag.py in a scratch root: its log shows the arguments it got.
    const rot = fs.mkdtempSync(path.join(testDir, "rot-"));
    fs.mkdirSync(path.join(rot, "assets/bin"), { recursive: true });
    fs.mkdirSync(path.join(rot, "assets/out"));
    fs.writeFileSync(
      path.join(rot, "assets/bin/julius-dag.py"),
      "import sys\nprint(sys.argv[1:])\n",
    );
    jest.spyOn(process, "cwd").mockReturnValue(rot);
    const exit = path.join(rot, "assets/out/kutt-14.exit");
    const id = "video/julius/dag-14#s3";
    const kutt = {
      path: id,
      vurdering: "kutt",
      kutt: { retning: "slutt", t: 4 },
    };
    try {
      const kid = await POST(
        makeReq("POST", kutt, { cookie: "__Host-nissekomm=kid" }),
      );
      expect(kid.status).toBe(403);
      await POST(makeReq("POST", { path: id, vurdering: "godkjent" }, auth));
      process.env.NISSEKOMM_MODE = "public";
      expect((await POST(makeReq("POST", kutt, auth))).status).toBe(404);
      process.env.NISSEKOMM_MODE = "lan";
      expect(fs.existsSync(path.join(rot, "assets/out/kutt-14.log"))).toBe(
        false,
      );
      expect((await POST(makeReq("POST", kutt, auth))).status).toBe(200);
      for (let i = 0; i < 60 && !fs.existsSync(exit); i++)
        await new Promise((r) => setTimeout(r, 50));
      expect(
        fs.readFileSync(path.join(rot, "assets/out/kutt-14.log"), "utf8"),
      ).toContain("['14', '--kutt']");
    } finally {
      jest.spyOn(process, "cwd").mockReturnValue(testDir);
    }
  });

  it("a cut check outlives notes and ends with the next verdict", async () => {
    const fs = await import("node:fs/promises");
    const id = "video/julius/dag-14#s3";
    const j = path.join(testDir, "video/julius");
    await fs.mkdir(j, { recursive: true });
    const join = (f: string, raw: string) =>
      fs.writeFile(
        path.join(j, f),
        JSON.stringify([{ s: 3, start: 0, slutt: 1, hash: "h", raw }]),
      );
    // The newest join holds the cut take the check was given to.
    await join("dag-14.segmenter.json", "aaaaaaaaaaaa");
    await fs.writeFile(
      path.join(testDir, "media-vurdering.json"),
      JSON.stringify({
        format: 2,
        sesong: 2026,
        elementer: {
          [id]: {
            historikk: [],
            vurderinger: [
              {
                fil: id,
                hash: "h",
                versjon: "aaaaaaaaaaaa",
                vurdering: "ok",
                kuttsjekk: { retning: "slutt", t: 4 },
              },
            ],
          },
        },
      }),
    );
    const get = async () =>
      (await (await GET(makeReq("GET", undefined, auth))).json())[id];
    await POST(makeReq("POST", { path: id, notat: "hørt" }, auth));
    expect(await get()).toMatchObject({
      vurdering: "ok",
      kuttsjekk: { retning: "slutt" },
    });
    // A newer take: the check belonged to the cut take, so it is not carried.
    await join("dag-14-v2.segmenter.json", "bbbbbbbbbbbb");
    const ny = await get();
    expect(ny.forrige).toMatchObject({ vurdering: "ok", notat: "hørt" });
    expect(ny.forrige.kuttsjekk).toBeUndefined();
    expect(ny.kuttsjekk).toBeUndefined();
    await fs.rm(path.join(j, "dag-14-v2.segmenter.json"));
    await POST(makeReq("POST", { path: id, vurdering: "godkjent" }, auth));
    const d = await get();
    expect(d.vurdering).toBe("godkjent");
    expect(d.kuttsjekk).toBeUndefined();
  });

  it("stamps a segment verdict with the take that was watched", async () => {
    const fs = await import("node:fs/promises");
    const j = path.join(testDir, "video/julius");
    await fs.mkdir(j, { recursive: true });
    const side = (raw: string) =>
      JSON.stringify([
        { s: 3, start: 0, slutt: 1, hash: "h", raw, replikk: "", flagg: [] },
      ]);
    await fs.writeFile(
      path.join(j, "dag-14.segmenter.json"),
      side("aaaaaaaaaaaa"),
    );
    await fs.utimes(path.join(j, "dag-14.segmenter.json"), 1, 1);
    await fs.writeFile(
      path.join(j, "dag-14-v2.segmenter.json"),
      side("bbbbbbbbbbbb"),
    );
    const id = "video/julius/dag-14#s3";
    const bad = await POST(
      makeReq(
        "POST",
        { path: id, vurdering: "godkjent", raw: "cccccccccccc" },
        auth,
      ),
    );
    expect(bad.status).toBe(400);
    const res = await POST(
      makeReq(
        "POST",
        { path: id, vurdering: "godkjent", raw: "aaaaaaaaaaaa" },
        auth,
      ),
    );
    expect((await res.json()).entry.versjon).toBe("aaaaaaaaaaaa");
    // The newest join holds another take: the verdict is not on it.
    const all = await (await GET(makeReq("GET", undefined, auth))).json();
    expect(all[id].vurdering).toBeUndefined();
    expect(all[id].forrige).toMatchObject({ vurdering: "godkjent" });
  });

  it("stamps real time even when the app mocks the date", async () => {
    process.env.NEXT_PUBLIC_MOCK_MONTH = "12";
    process.env.NEXT_PUBLIC_MOCK_DAY = "10";
    try {
      const before = Date.now();
      const res = await POST(
        makeReq(
          "POST",
          { path: "video/julius/dag-01.mp4", vurdering: "godkjent" },
          auth,
        ),
      );
      const { entry } = await res.json();
      const t = Date.parse(entry.oppdatert);
      expect(t).toBeGreaterThanOrEqual(before);
      expect(t).toBeLessThanOrEqual(Date.now());
    } finally {
      delete process.env.NEXT_PUBLIC_MOCK_MONTH;
      delete process.env.NEXT_PUBLIC_MOCK_DAY;
    }
  });

  it("rejects lag på nytt without a note and accepts ok", async () => {
    const uten = await POST(
      makeReq(
        "POST",
        {
          path: "video/julius/dag-05.mp4",
          vurdering: "lag_paa_nytt",
          notat: "  ",
        },
        auth,
      ),
    );
    expect(uten.status).toBe(400);
    const ok = await POST(
      makeReq(
        "POST",
        {
          path: "video/julius/dag-05.mp4",
          vurdering: "ok",
          notat: "litt mørk",
        },
        auth,
      ),
    );
    expect(ok.status).toBe(200);
    expect((await ok.json()).entry).toMatchObject({ vurdering: "ok" });
  });

  it("can clear verdict or update note independently", async () => {
    // Save initial
    await POST(
      makeReq(
        "POST",
        {
          path: "video/julius/dag-01.mp4",
          vurdering: "lag_paa_nytt",
          notat: "Prøv igjen",
        },
        auth,
      ),
    );

    // Clear verdict but keep note
    const clearVerdictRes = await POST(
      makeReq(
        "POST",
        {
          path: "video/julius/dag-01.mp4",
          vurdering: null,
        },
        auth,
      ),
    );
    expect(clearVerdictRes.status).toBe(200);
    const bodyClear = await clearVerdictRes.json();
    expect(bodyClear.entry.vurdering).toBeUndefined();
    expect(bodyClear.entry.notat).toBe("Prøv igjen");

    // Clear note as well -> deletes entry
    const clearAllRes = await POST(
      makeReq(
        "POST",
        {
          path: "video/julius/dag-01.mp4",
          vurdering: null,
          notat: "",
        },
        auth,
      ),
    );
    expect(clearAllRes.status).toBe(200);
    const bodyEmpty = await clearAllRes.json();
    expect(bodyEmpty.entry).toBeNull();
  });
});

describe("API /api/media/vurdering - Trenger mer", () => {
  const auth = { cookie: "__Host-nissekomm-guide=parent" };
  const send = async (body: unknown) => POST(makeReq("POST", body, auth));
  const id = "dag/04/gaatekart";

  it("rejects bad requests", async () => {
    for (const b of [
      { path: id, trenger: { hva: "dans" } },
      { path: id, trenger: "skisse" },
      { path: id, trenger: { hva: "skisse", notat: 5 } },
      { path: id, forklaring: 3 },
      { path: id, levert: "ja" },
      { path: id, levert: true },
      { path: "dag/99/gaatekart", trenger: { hva: "skisse" } },
    ])
      expect((await send(b)).status).toBe(400);
  });

  it("round trip: ask, deliver, judge; the verdict stays", async () => {
    await send({ path: id, vurdering: "ok", notat: "litt tynt" });
    let r = await (
      await send({
        path: id,
        trenger: { hva: "forklaring", notat: "hvorfor?" },
      })
    ).json();
    expect(r.entry.vurdering).toBe("ok");
    expect(r.entry.notat).toBe("litt tynt");
    expect(r.entry.trenger).toMatchObject({
      hva: "forklaring",
      notat: "hvorfor?",
    });
    expect(r.entry.trenger.levert).toBeUndefined();
    r = await (await send({ path: id, forklaring: "Fordi." })).json();
    expect(r.entry.forklaring).toBe("Fordi.");
    expect(r.entry.trenger.levert).toBeTruthy();
    expect(r.entry.vurdering).toBe("ok");
    r = await (await send({ path: id, vurdering: "godkjent" })).json();
    expect(r.entry.trenger.lest).toBeTruthy();
    expect(r.entry.forklaring).toBe("Fordi.");
    r = await (await send({ path: id, trenger: null })).json();
    expect(r.entry.trenger).toBeUndefined();
  });

  it("a verdict while «Trenger mer» is open closes it (one G, not two)", async () => {
    await send({ path: id, trenger: { hva: "skisse" } });
    const r = await (await send({ path: id, vurdering: "godkjent" })).json();
    expect(r.entry.vurdering).toBe("godkjent");
    expect(r.entry.trenger).toBeUndefined();
    expect(r.entry.merknad).toBe("trenger lukket av dom");
  });

  it("asks without any verdict, and a sketch delivers with levert", async () => {
    let r = await (await send({ path: id, trenger: { hva: "skisse" } })).json();
    expect(r.entry.vurdering).toBeUndefined();
    expect(r.vurderinger[id].trenger.hva).toBe("skisse");
    r = await (await send({ path: id, levert: true })).json();
    expect(r.entry.trenger.levert).toBeTruthy();
  });
});
