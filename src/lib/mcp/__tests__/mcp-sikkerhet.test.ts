/**
 * @jest-environment node
 */
import { describe, it, expect, afterEach, jest } from "@jest/globals";
import { memoryStore } from "@/lib/db";
import { ArgError, MAX_RESPONSE_BYTES, callTool } from "@/lib/mcp/tools";
import { mp3Duration } from "@/lib/mcp/clips";
import { POST } from "@/app/mcp/route";

const at = (day: number, hour: number, month = 12) =>
  new Date(
    `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00+01:00`,
  );
const screen = async (who: Parameters<typeof callTool>[0]) =>
  JSON.parse(await callTool(who, "get_screen"));
const operator = { sub: "op", name: "operator", level: "parent" as const };

afterEach(() => {
  jest.useRealTimers();
  memoryStore.reset();
});

describe("MCP-sikkerhet", () => {
  it("falsk klokke følger sub, ikke navn, også i preview_screen", async () => {
    jest.useFakeTimers({ now: at(10, 12, 11) });
    const a = { sub: "a", name: "far", level: "parent" as const };
    const b = { sub: "b", name: "far", level: "parent" as const };
    await callTool(a, "set_fake_now", { now: at(21, 8).toISOString() });
    expect((await screen(a)).day).toBe(21);
    expect((await screen(b)).day).toBeNull();
    const preview = async (who: typeof a) =>
      JSON.parse(await callTool(who, "preview_screen", { as_caller: "far" }));
    expect((await preview(b)).day).toBeNull();
    // Skjerm's view is real time, whoever set a fake clock.
    expect((await preview(a)).day).toBeNull();
    await callTool(a, "set_fake_now", { now: "" });
  });

  it("set_fake_now avviser tid utenfor sesongen", async () => {
    for (const now of ["+275760-01-01T00:00:00Z", "1999-12-01T00:00:00Z"]) {
      await expect(callTool(operator, "set_fake_now", { now })).rejects.toThrow(
        ArgError,
      );
    }
    expect((await screen(operator)).schema_version).toBe(1);
  });

  it("get_clips avviser dato i feil format", async () => {
    await expect(
      callTool("read", "get_clips", { date: "x".repeat(20000) }),
    ).rejects.toThrow(ArgError);
  });

  it("get_letters holder seg under 16 KB med mange brev", async () => {
    await memoryStore.putState(
      "nissekomm-santa-letters",
      Array.from({ length: 1000 }, () => ({
        day: 1,
        from: "x".repeat(5000),
        content: "y",
      })),
    );
    const out = await callTool(operator, "get_letters");
    expect(Buffer.byteLength(out)).toBeLessThan(MAX_RESPONSE_BYTES);
  });

  it("mp3Duration tåler avkuttet Xing-header", () => {
    const buf = Buffer.alloc(44);
    buf.set([0xff, 0xfb, 0x90, 0x00]);
    buf.write("Xing", 36, "latin1");
    buf[43] = 1;
    expect(mp3Duration(buf)).toBeNull();
  });

  it("prototype-navn er ukjente verktøy", async () => {
    for (const name of ["constructor", "__proto__", "toString"]) {
      await expect(callTool("read", name)).rejects.toThrow(ArgError);
    }
  });

  it("interne feil gir generisk tekst over HTTP", async () => {
    process.env.NISSEKOMM_MODE = "lan";
    process.env.MCP_DEV_TOKEN = "parent:foreldre-token-1";
    const spy = jest
      .spyOn(memoryStore, "getState")
      .mockRejectedValue(new Error("hemmelig DB-detalj"));
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      const res = await POST(
        new Request("http://localhost/mcp", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json, text/event-stream",
            authorization: "Bearer foreldre-token-1",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: { name: "get_letters", arguments: {} },
          }),
        }),
      ).then((r) => r.json());
      expect(res.result.isError).toBe(true);
      expect(res.result.content[0].text).toBe("intern feil");
    } finally {
      spy.mockRestore();
      log.mockRestore();
      delete process.env.MCP_DEV_TOKEN;
    }
  });
});
