/** @jest-environment node */
import { describe, it, expect } from "@jest/globals";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import manus from "@/data/radio-manus.json";
import { innholdsHash, versjonAv } from "./vurdering-versjon";

describe("radioport (rampenissen-tts.sh)", () => {
  it("TS and python hash the spoken text the same way", () => {
    expect(Object.keys(manus)).toHaveLength(24);
    for (const m of Object.values(manus))
      expect(innholdsHash(m.tekst)).toBe(m.hash);
  });

  it("--force on an existing clip makes a candidate -vN, never touches the plain file (rampenissen-tts.sh selftest)", () => {
    expect(
      execFileSync("bash", ["assets/bin/rampenissen-tts.sh", "selftest"], {
        env: { ...process.env, GEMINI_API_KEY: "test" },
      }).toString(),
    ).toContain("ok");
  });

  it("src/data/radio-manus.json matches docs/manus (python3 assets/bin/medie.py radio-manus)", () => {
    execFileSync("python3", ["assets/bin/medie.py", "radio-manus", "--sjekk"]);
  });

  it("manus/radio/dag-NN carries the baked hash", async () => {
    expect(await versjonAv(tmpdir(), "manus/radio/dag-05")).toBe(
      manus["5"].hash,
    );
  });
});
