/**
 * @jest-environment node
 */
import { expect, test } from "@jest/globals";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createFileStore, resetState } from "../db";

test("file store survives a restart: session and state", async () => {
  const file = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "nk-")),
    "s.json",
  );
  const a = createFileStore(file);
  const expires = Date.now() + 60_000;
  await a.setSession("h", { role: "parent", expires });
  await a.putState("nissekomm-codes", [{ day: 1, kode: "X" }]);

  const b = createFileStore(file);
  expect(await b.getSession("h")).toEqual({ role: "parent", expires });
  expect((await b.getState())["nissekomm-codes"]).toEqual([
    { day: 1, kode: "X" },
  ]);

  await resetState(b);
  const c = createFileStore(file);
  expect((await c.getState())["nissekomm-codes"]).toBeNull();
  expect(await c.getSession("h")).not.toBeNull();
});
