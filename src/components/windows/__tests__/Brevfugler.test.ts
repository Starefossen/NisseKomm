import { describe, it, expect } from "@jest/globals";
import { erBrevetFrossent } from "../Brevfugler";

describe("Brevfugler: Kuldes brev", () => {
  it("er fryst dag 14 (og fram til julaften)", () => {
    expect(erBrevetFrossent(14, false)).toBe(true);
    expect(erBrevetFrossent(23, false)).toBe(true);
  });

  it("har tint dag 24", () => {
    expect(erBrevetFrossent(24, false)).toBe(true);
    expect(erBrevetFrossent(24, true)).toBe(false);
  });
});
