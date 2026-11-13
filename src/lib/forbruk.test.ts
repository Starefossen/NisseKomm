/** @jest-environment node */
import { describe, it, expect } from "@jest/globals";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { BUDSJETT, BUDSJETT_FRA, PRIS, forbruk } from "./forbruk";

describe("forbruk (TS mirror of assets/bin/forbruk.py)", () => {
  it("prices and budget match forbruk.py", () => {
    const py = readFileSync("assets/bin/forbruk.py", "utf8");
    for (const [k, v] of Object.entries(PRIS))
      expect(py).toMatch(new RegExp(`"${k}": ${v}\\b`));
    expect(py).toContain(`BUDSJETT = ${BUDSJETT}.0`);
    const [y, m, d] = BUDSJETT_FRA.split("-").map(Number);
    expect(py).toContain(`BUDSJETT_FRA = date(${y}, ${m}, ${d})`);
  });

  it("spent and left agree with forbruk.py rapport on the same log", () => {
    const logg = path.join(
      mkdtempSync(path.join(tmpdir(), "forbruk-")),
      "f.jsonl",
    );
    const rad = (t: string, type: string, antall?: number) =>
      JSON.stringify({
        t,
        type,
        modell: "m",
        skript: "s",
        element: "e",
        ...(antall ? { antall } : {}),
      });
    writeFileSync(
      logg,
      [
        rad("2026-11-12T23:59:59", "video"),
        rad("2026-11-13T00:00:01", "video"),
        rad("2026-11-14T10:00:00", "bilde", 3),
        rad("2026-11-15T10:00:00", "tts"),
        rad("2026-11-15T10:00:00", "transkripsjon"),
      ].join("\n") + "\n",
    );
    const ut = execFileSync("python3", ["assets/bin/forbruk.py", "rapport"], {
      env: { ...process.env, FORBRUK_LOGG: logg },
      encoding: "utf8",
    });
    const [, brukt, igjen] = ut.match(/brukt (\d+), igjen (\d+)/)!;
    const f = forbruk(readFileSync(logg, "utf8"));
    expect(Math.round(f.brukt)).toBe(Number(brukt));
    expect(Math.round(f.igjen)).toBe(Number(igjen));
    expect(f.brukt).toBeCloseTo(17 + 4.2 + 0.2);
  });
});
