/** @jest-environment node */
import { afterEach, expect, jest, test } from "@jest/globals";

const url = process.env.DATABASE_URL;
afterEach(() => {
  process.env.DATABASE_URL = url;
  jest.resetModules();
});

test("health er 200 uten DATABASE_URL", async () => {
  delete process.env.DATABASE_URL;
  const { GET } = await import("../route");
  expect((await GET()).status).toBe(200);
});

test("health er 503 når Postgres ikke svarer", async () => {
  process.env.DATABASE_URL = "postgres://x:y@127.0.0.1:1/z";
  const { GET } = await import("../route");
  expect((await GET()).status).toBe(503);
});

test("oppstart avslutter prosessen når migreringen feiler", async () => {
  process.env.DATABASE_URL = "postgres://x:y@127.0.0.1:1/z";
  const exit = jest
    .spyOn(process, "exit")
    .mockImplementation((() => undefined) as never);
  const env = process.env as Record<string, string>;
  const rt = env.NEXT_RUNTIME;
  env.NEXT_RUNTIME = "nodejs";
  try {
    const { register } = await import("@/instrumentation");
    await register();
    expect(exit).toHaveBeenCalledWith(1);
  } finally {
    if (rt === undefined) delete env.NEXT_RUNTIME;
    else env.NEXT_RUNTIME = rt;
    exit.mockRestore();
  }
});
