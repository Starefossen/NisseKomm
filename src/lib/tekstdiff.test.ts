/** @jest-environment node */
import { describe, expect, it } from "@jest/globals";
import { feltDiff, ordDiff, parseFelt } from "./tekstdiff";

describe("tekstdiff", () => {
  it("parser felt, også nummererte punkter", () => {
    expect([...parseFelt("**Strek:** a b\n\n**Merk:** c").keys()]).toEqual([
      "Strek",
      "Merk",
    ]);
    const j = parseFelt(
      "1. **Replikk:** «Hei»\n   - Handling: vinker\n2. **Replikk:** «Ha det»",
    );
    expect(j.get("1 Handling")).toBe("vinker");
    expect(j.get("2 Replikk")).toBe("«Ha det»");
  });

  it("flyttet felt: teksten står i Merk nå", () => {
    const d = feltDiff(
      "**Strek:** fort av teppe. iMac-ene grå 09–12 hele dagen\n\n**Merk:** Helg.",
      "**Strek:** fort av teppe.\n\n**Merk:** Helg. iMac-ene grå 09–12 hele dagen",
    );
    expect(d.find((f) => f.felt === "Strek")!.deler).toContainEqual({
      t: "f",
      s: "iMac-ene grå 09–12 hele dagen",
      dir: "til",
      felt: "Merk",
    });
    expect(
      d
        .find((f) => f.felt === "Merk")!
        .deler.some((x) => x.t === "f" && x.dir === "fra"),
    ).toBe(true);
  });

  it("fjernet setning vises som -", () => {
    const d = feltDiff(
      "**Klipp:** Hei. Dette er borte. Ha det.",
      "**Klipp:** Hei. Ha det.",
    );
    expect(d).toHaveLength(1);
    expect(d[0].deler).toContainEqual({ t: "-", s: "Dette er borte." });
  });

  it("lang uendret tekst brettes uten å kutte midt i", () => {
    const lang = Array.from({ length: 60 }, (_, i) => `o${i}`).join(" ");
    const d = ordDiff(`A ${lang} B`, `A ${lang} C`);
    expect(d.find((x) => x.t === "…")).toEqual({ t: "…", n: 57 });
    expect(d.at(-1)).toEqual({ t: "+", s: "C" });
    expect(
      d
        .filter((x) => x.t === "=")
        .map((x) => x.t === "=" && x.s)
        .join(" "),
    ).toContain("o56 o57 o58 o59");
  });
});
