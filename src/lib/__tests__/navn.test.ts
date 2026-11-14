import { describe, it, expect } from "@jest/globals";
import { fyll, fyllDyp, settFamilie } from "../navn";
import { GameEngine } from "../game-engine";
import { StorageManager } from "../storage";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const navnLoader = require("../../../scripts/navn-loader.cjs");

describe("name tokens", () => {
  it("the loader hides every casing of the names", () => {
    const ut = navnLoader(
      "Kristian KRISTIAN kristian Håkon håkon HANNA Hannas Landås landås LANDÅS",
    );
    expect(ut).not.toMatch(/kristian|håkon|hanna|landås/i);
    settFamilie({ barn: ["Kristian", "Håkon", "Hanna"], hjem: "Landås" });
    expect(fyll(ut)).toBe(
      "Kristian KRISTIAN kristian Håkon håkon HANNA Hannas Landås landås LANDÅS",
    );
  });

  it("fills bundled data in place", () => {
    settFamilie({ barn: ["A", "B", "C"], hjem: "D" });
    const data = {
      ord: ["{{B3^}}", "{{B2^}}"],
      x: { t: "hei {{B1}} på {{HJEM}}" },
    };
    fyllDyp(data);
    expect(data).toEqual({ ord: ["C", "B"], x: { t: "hei A på D" } });
  });

  it("reads tokens an older build stored as names", () => {
    settFamilie({ barn: ["Kristian", "Håkon", "Hanna"], hjem: "Landås" });
    StorageManager.saveSantaLetters([
      { day: 1, content: "hei", from: "{{B2}}" },
      { day: 2, content: "hei", from: "Hanna" },
    ] as never);
    expect(GameEngine.getSantaLetters().map((l) => l.from)).toEqual([
      "Håkon",
      "Hanna",
    ]);
    StorageManager.setSledeResultat("{{B1}}/tundra", { poeng: 1, bjeller: 1 });
    expect(GameEngine.getSledeResultaterFor("Kristian").tundra).toBeDefined();
  });
});
