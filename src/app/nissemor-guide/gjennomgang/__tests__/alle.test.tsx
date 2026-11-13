import { describe, it, expect } from "@jest/globals";
import { alleOppfylt } from "../visning";

describe("alleOppfylt", () => {
  it("lights the button whose condition is met", () => {
    expect(alleOppfylt(["godkjent", "godkjent"])).toBe("godkjent");
    expect(alleOppfylt(["godkjent", "ok"])).toBe("ok");
    expect(alleOppfylt(["godkjent", "lag_paa_nytt"])).toBeNull();
    expect(alleOppfylt(["godkjent", undefined])).toBeNull();
    expect(alleOppfylt([])).toBeNull();
  });
});
