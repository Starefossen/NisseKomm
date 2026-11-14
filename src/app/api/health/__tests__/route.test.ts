/** @jest-environment node */
import { afterEach, expect, jest, test } from "@jest/globals";

const url = process.env.DATABASE_URL;
afterEach(() => {
  process.env.DATABASE_URL = url;
  jest.resetModules();
});

test("health er alltid 200, også uten database", async () => {
  process.env.DATABASE_URL = "postgres://x:y@127.0.0.1:1/z";
  const { GET } = await import("../route");
  expect(GET().status).toBe(200);
});

test("ready er 200 uten DATABASE_URL og 503 når Postgres ikke svarer", async () => {
  delete process.env.DATABASE_URL;
  expect((await (await import("../../ready/route")).GET()).status).toBe(200);
  jest.resetModules();
  process.env.DATABASE_URL = "postgres://x:y@127.0.0.1:1/z";
  expect((await (await import("../../ready/route")).GET()).status).toBe(503);
});

test("oppstart avslutter ikke når migreringen feiler", async () => {
  process.env.DATABASE_URL = "postgres://x:y@127.0.0.1:1/z";
  const exit = jest.spyOn(process, "exit");
  const env = process.env as Record<string, string>;
  const rt = env.NEXT_RUNTIME;
  env.NEXT_RUNTIME = "nodejs";
  jest.doMock("@/lib/db", () => ({
    migrateWithRetry: () => new Promise(() => {}),
  }));
  try {
    const { register } = await import("@/instrumentation");
    await register();
    expect(exit).not.toHaveBeenCalled();
  } finally {
    if (rt === undefined) delete env.NEXT_RUNTIME;
    else env.NEXT_RUNTIME = rt;
    exit.mockRestore();
    jest.dontMock("@/lib/db");
  }
});

test("migreringen prøver igjen med økende pause til den lykkes", async () => {
  const { migrateWithRetry } = await import("@/lib/db");
  const err = jest.spyOn(console, "error").mockImplementation(() => {});
  let n = 0;
  const waits: number[] = [];
  await migrateWithRetry(
    async () => {
      if (++n < 6) throw new Error("nede");
    },
    async (ms) => {
      waits.push(ms);
    },
  );
  expect(waits).toEqual([5000, 10000, 20000, 40000, 60000]);
  err.mockRestore();
});
