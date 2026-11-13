/** @jest-environment node */
import { describe, it, expect } from "@jest/globals";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import manus from "@/data/julius-manus.json";
import { innholdsHash, medVersjon, versjonAv } from "./vurdering-versjon";

const alle = Object.values(manus).flat();

describe("manusport (julius-dag.py)", () => {
  it("TS and python hash the take key the same way", () => {
    expect(alle.length).toBeGreaterThan(80);
    for (const s of alle) expect(innholdsHash(s.key)).toBe(s.hash);
  });

  it("src/data/julius-manus.json matches docs/manus (python3 assets/bin/julius-dag.py manus)", () => {
    execFileSync("python3", ["assets/bin/julius-dag.py", "manus", "--sjekk"]);
  });

  it("gate, lock and sidecar (julius-dag.py test-port)", () => {
    execFileSync("python3", ["assets/bin/julius-dag.py", "test-port"]);
  });

  it("a segment id carries the baked hash; changed text is a new version", async () => {
    const dir = tmpdir();
    const s = manus["14"][0];
    expect(await versjonAv(dir, "manus/julius/dag-14#s1")).toBe(s.hash);
    const v = await medVersjon(dir, {
      "manus/julius/dag-14#s1": { vurdering: "godkjent", versjon: "gammel" },
    });
    expect(v["manus/julius/dag-14#s1"].forrige?.vurdering).toBe("godkjent");
  });
});

describe("segmentHint (list_vurderinger)", () => {
  it("points a redo at the segment", async () => {
    const { segmentHint } = await import("./segmenter");
    expect(segmentHint("video/julius/dag-14#s3", "lag_paa_nytt")).toContain(
      "julius-dag.py 14 --suffix -vN --segment 3",
    );
    expect(segmentHint("manus/julius/dag-14#s3", "lag_paa_nytt")).toContain(
      "segment 3",
    );
    expect(segmentHint("manus/julius/dag-14#s3", "godkjent")).toBe("");
  });
});
