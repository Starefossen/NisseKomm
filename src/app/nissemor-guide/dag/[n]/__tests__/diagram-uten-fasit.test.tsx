/** @jest-environment node */
import { describe, it, expect } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";
import { Gaatekart, skjul } from "../gaatekart";
import { gaatekart, kveldDag } from "@/lib/guide-sesong";
import { getAllOppdrag } from "@/lib/oppdrag";

// Without «Vis fasit» neither the diagram, the step texts nor the solution board may hold a code.
const rens = (s: string) => s.toUpperCase().replace(/[^A-ZÆØÅ0-9]/g, "");

describe("gåtekartet uten fasit", () => {
  for (const q of getAllOppdrag()) {
    it(`dag ${q.dag} viser ikke koden`, () => {
      const d = kveldDag(q.dag);
      if (!d) return;
      const t = (s: string) => skjul(s, q.kode, false);
      const html = (vis: boolean) =>
        renderToStaticMarkup(
          <Gaatekart
            vid="x"
            k={gaatekart(q.dag)}
            d={d}
            epost={q.nissemail_tekst ?? ""}
            vis={vis}
            kode={q.kode}
            t={vis ? (s) => s : t}
          />,
        );
      const tekst = rens(html(false).replace(/<[^>]+>/g, " "));
      expect(tekst).not.toContain(rens(q.kode));
      expect(html(false)).not.toContain('data-testid="losningstavle"');
      expect(html(true)).toContain('data-testid="losningstavle"');
    });
  }
});
