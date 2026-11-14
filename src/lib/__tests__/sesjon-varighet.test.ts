/**
 * @jest-environment node
 */
import { expect, test } from "@jest/globals";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

test("both roles' sessions last weeks and survive a dev restart", async () => {
  process.env.NISSEKOMM_MODE = "lan";
  const file = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "nk-")),
    "s.json",
  );
  const { createFileStore } = await import("../db");
  const { startSession, hasRole } = await import("../auth");
  const g = globalThis as { nissekommStore?: unknown };
  for (const role of ["kid", "parent"] as const) {
    g.nissekommStore = createFileStore(file);
    const res = NextResponse.json({});
    await startSession(new NextRequest("http://localhost/"), res, role);
    const c = res.cookies.getAll().find((k) => k.value)!;
    expect(c.maxAge).toBeGreaterThanOrEqual(30 * 24 * 60 * 60);
    g.nissekommStore = createFileStore(file); // restart: fresh store from file
    const req = new NextRequest("http://localhost/", {
      headers: { cookie: `${c.name}=${c.value}` },
    });
    expect(await hasRole(req, role)).toBe(true);
  }
});
