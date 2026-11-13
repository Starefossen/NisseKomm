/** @jest-environment node */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { avbrytKutt, kuttDag, kuttStatus, startKutt } from "./kutt-jobb";

let rot: string;
const skript = (kode: string) =>
  writeFileSync(
    path.join(rot, "assets/bin/julius-dag.py"),
    `import sys, time\nprint(sys.argv[1:])\n${kode}`,
  );

beforeEach(() => {
  rot = mkdtempSync(path.join(tmpdir(), "kutt-"));
  mkdirSync(path.join(rot, "assets/bin"), { recursive: true });
  mkdirSync(path.join(rot, "assets/out"), { recursive: true });
  jest.spyOn(process, "cwd").mockReturnValue(rot);
});
afterEach(() => {
  jest.restoreAllMocks();
  rmSync(rot, { recursive: true, force: true });
});

describe("kutt-jobb", () => {
  it("only days 1–24 are accepted", () => {
    expect([0, 25, 1.5, "13", NaN, null].map(kuttDag)).toEqual(
      Array(6).fill(null),
    );
    expect(kuttDag(13)).toBe(13);
  });

  it("runs the script with only the day and --kutt, one run per day", async () => {
    skript("time.sleep(1)\n");
    const a = startKutt(13);
    expect(a.startet).toBe(true);
    expect(kuttStatus(13).status).toBe("kjorer");
    expect(startKutt(13).startet).toBe(false);
    expect(await a.klar).toBe(0);
    expect(kuttStatus(13).status).toBe("ferdig");
    const { readFileSync } = await import("node:fs");
    expect(
      readFileSync(path.join(rot, "assets/out/kutt-13.log"), "utf8"),
    ).toContain("['13', '--kutt']");
  });

  it("a failing run is «feil» with the log path; a new run clears it", async () => {
    skript("sys.exit('galt')\n");
    expect(await startKutt(5).klar).toBe(1);
    expect(kuttStatus(5)).toEqual({
      status: "feil",
      logg: "assets/out/kutt-05.log",
    });
    skript("pass\n");
    expect(await startKutt(5).klar).toBe(0);
    expect(kuttStatus(5).status).toBe("ferdig");
  });

  it("a ✂ saved while a run is going queues a second run instead of being dropped", async () => {
    const { readFileSync } = await import("node:fs");
    const teller = path.join(rot, "n");
    skript(
      `open(${JSON.stringify(teller)}, "a").write("x")\ntime.sleep(0.5)\nprint("/m/video/julius/dag-13-v3.mp4")\n`,
    );
    const a = startKutt(13);
    const b = startKutt(13);
    expect(b).toEqual({ startet: false, ko: true });
    expect(kuttStatus(13).ko).toBe(true);
    expect(await a.klar).toBe(0);
    expect(readFileSync(teller, "utf8")).toBe("xx");
    expect(kuttStatus(13)).toEqual({
      status: "ferdig",
      logg: "assets/out/kutt-13.log",
      ny: "video/julius/dag-13-v3.mp4",
    });
  });

  it("Avbryt and the time limit kill the run", async () => {
    skript("time.sleep(30)\n");
    const a = startKutt(7);
    expect(avbrytKutt(7)).toBe(true);
    expect(await a.klar).toBe(1);
    expect(kuttStatus(7).status).toBe("feil");
    expect(await startKutt(7, 200).klar).toBe(1);
  });

  it("without assets/ (the image) nothing starts", () => {
    rmSync(path.join(rot, "assets"), { recursive: true });
    expect(startKutt(2).startet).toBe(false);
  });
});
