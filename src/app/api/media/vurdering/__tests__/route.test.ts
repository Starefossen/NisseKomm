/** @jest-environment node */
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
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
  memoryStore.reset();
  for (const role of ["kid", "parent"] as const) {
    await memoryStore.setSession(sha(role), {
      role,
      expires: Date.now() + 60_000,
    });
  }
});

afterEach(() => {
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
