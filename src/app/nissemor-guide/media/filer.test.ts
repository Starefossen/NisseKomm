import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "fs";
import path from "path";

// Filer shows Gjennomgang's numbers, never a count of its own.
describe("Filer", () => {
  const kilde = readFileSync(path.join(__dirname, "page.tsx"), "utf8");
  const kort = readFileSync(path.join(__dirname, "kort.tsx"), "utf8");
  it("has the progress bar from fremdrift() and the matrix cell", () => {
    expect(kilde).toMatch(/<Fremdriftslinjer[\s\S]*total=\{fd\.total\}/);
    expect(kilde).toMatch(/useKo\(d, sesong\)/);
    expect(kilde).toMatch(/<StatusBrikke/);
  });
  it("counts no verdicts and has no review buttons", () => {
    expect(kilde).not.toMatch(/godkjent\/OK|mangler vurdering|dayRows/);
    expect(kort).not.toMatch(/<Vurderingsknapper\s/);
  });
});
