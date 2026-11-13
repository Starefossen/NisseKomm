import { describe, it, expect } from "@jest/globals";
import { fasitKjede } from "./gaatekart";

describe("fasitKjede", () => {
  it("chains the steps without blind alleys and ends in the code", () => {
    expect(
      fasitKjede(
        ["H3 og H5 gir M og A (ikke R)", "Les S1  to ganger"],
        "KOMPASS",
      ),
    ).toBe("H3 og H5 gir M og A → Les S1 to ganger → KOMPASS");
  });
});
