/**
 * Kid-visible text agrees with the characters' entitet.md
 * (assets/characters/<id>/, fixture src/data/entiteter.json):
 * names spelled as listed, nobody named before fra_dag, no banned phrase.
 * A wrong pronoun near a name only warns: the next «han»/«hun» is often
 * someone else.
 */
import { execFileSync } from "node:child_process";
import { describe, it, expect } from "@jest/globals";
import entiteter from "@/data/entiteter.json";
import { visible } from "./synlig-tekst";

type Entitet = {
  id: string;
  navn: string[];
  pronomen: string;
  fra_dag: number;
  ikke: string[];
};
const ENT = entiteter as Entitet[];

// Words close to a name that are real words or other figures. Each is a
// question for Hans the first time it shows up.
// «Floken» (day 8 title, a tangle of wires) is the noun, not the owl Floke.
const OK_WORDS = new Set<string>(["Floken"]);

const word = (n: string) =>
  new RegExp(`(?<![\\p{L}])${n.replace(/[.']/g, "\\$&")}(?![\\p{L}])`, "u");

const lev = (a: string, b: string) => {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = d[j];
      d[j] = Math.min(
        d[j] + 1,
        d[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = t;
    }
  }
  return d[b.length];
};

describe("entiteter", () => {
  it("fixture og CONTENT_GUIDE-blokken er oppdatert", () => {
    expect(() =>
      execFileSync("python3", ["assets/bin/medie.py", "entiteter", "--sjekk"], {
        stdio: "pipe",
      }),
    ).not.toThrow();
  });

  it.each(ENT.map((e) => [e.id, e] as const))(
    "%s: ikke nevnt før fra_dag",
    (_, e) => {
      const early = visible
        .filter(
          (v) => v.from < e.fra_dag && e.navn.some((n) => word(n).test(v.text)),
        )
        .map((v) => `dag ${v.from} ${v.where}`);
      expect(early).toEqual([]);
    },
  );

  it.each(ENT.map((e) => [e.id, e] as const))(
    "%s: ingen forbudte fraser",
    (_, e) => {
      const hits = visible.flatMap((v) =>
        e.ikke
          .filter((x) => word(x).test(v.text))
          .map((x) => `«${x}» i ${v.where}`),
      );
      expect(hits).toEqual([]);
    },
  );

  it("navn staves som i entitet.md", () => {
    const names = ENT.flatMap((e) => e.navn.filter((n) => !n.includes(" ")));
    const known = new Set(names);
    const near = new Set<string>();
    for (const v of visible) {
      for (const w of v.text.match(/\p{Lu}[\p{L}']*/gu) ?? []) {
        if (
          known.has(w) ||
          known.has(w.replace(/[s']$/, "")) ||
          OK_WORDS.has(w)
        )
          continue;
        for (const n of names) {
          const close =
            n.length <= 3
              ? w.toLowerCase() === n.toLowerCase()
              : w.length >= 4 && lev(w, n) <= (n.length > 7 ? 2 : 1);
          if (close) near.add(`${w} (${n}) i ${v.where}`);
        }
      }
    }
    expect([...near]).toEqual([]);
  });

  it("pronomen (bare advarsel)", () => {
    for (const e of ENT) {
      const wrong = e.pronomen === "han" ? "hun" : "han";
      for (const n of e.navn) {
        const re = new RegExp(`${n}[^.!?»\\n]*\\b${wrong}\\b`, "u");
        for (const v of visible) {
          const m = v.text.match(re);
          if (m)
            console.warn(
              `entiteter: «${m[0]}» (${e.id} er ${e.pronomen}) i ${v.where}`,
            );
        }
      }
    }
  });
});
