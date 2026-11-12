"use client";

/*
 * Utskrift: the shared print frame. Hans' printer takes A4 only.
 *
 *   <Utskrift navn="dag01-tradkort" papir="tykt" tosidig
 *     deler={[{ str: "A7", antall: 6, forside: (i) => …, bakside: (i) => … }]}
 *     instruks={{ klipp: "…", brett: "…", hvor: "…" }} />
 *
 * - `navn` is the key in ../filer.ts; the title comes from there.
 * - `str`: "A4" | "A5" | "A6" | "A7" | "A3" | { b, h } in mm. A5 is true ISO
 *   (148 × 210). A6 (97 × 140) and A7 (97 × 70) are trimmed so 4 and 8 tile
 *   the printable area (194 × 280 at 8 mm margin); use { b, h } for anything
 *   else. A3 prints as 2 × A4 (194 × 550 mm) with a 10 mm glue strip.
 * - Parts are packed in order, row by row, as many per sheet as fit, each with
 *   a dashed cut line and corner marks. `bakside` (with `tosidig`) prints the
 *   backs mirrored for a long-edge flip.
 * - On screen: an instruction box (never printed) with paper, «100 %», sheet
 *   count and `instruks`. Content uses mm so it prints at actual size.
 */

import type { ReactNode } from "react";
import { utskriftTittel } from "../filer";

export type Str = "A3" | "A4" | "A5" | "A6" | "A7" | { b: number; h: number };

export interface Del {
  str: Str;
  antall?: number;
  forside: (i: number) => ReactNode;
  bakside?: (i: number) => ReactNode;
}

const B = 194;
const H = 280;
const LIM = 10;
const MAAL: Record<Exclude<Str, object>, { b: number; h: number }> = {
  A3: { b: B, h: 2 * H - LIM },
  A4: { b: B, h: H },
  A5: { b: 148, h: 210 },
  A6: { b: 97, h: 140 },
  A7: { b: 97, h: 70 },
};
export const mm = (s: Str) => (typeof s === "string" ? MAAL[s] : s);

interface Plass {
  x: number;
  y: number;
  b: number;
  h: number;
  del: Del;
  i: number;
}
export type Ark = { plasser: Plass[]; a3?: "topp" | "bunn" };

/** Shelf packing: left to right, new row when full, new sheet when out of height. */
export function pakk(deler: Del[]): Ark[] {
  const ark: Ark[] = [];
  let cur: Ark | null = null;
  let x = 0,
    y = 0,
    rad = 0;
  for (const del of deler) {
    const { b, h } = mm(del.str);
    for (let i = 0; i < (del.antall ?? 1); i++) {
      if (del.str === "A3") {
        const p = { x: 0, y: 0, b, h, del, i };
        ark.push({ plasser: [p], a3: "topp" }, { plasser: [p], a3: "bunn" });
        cur = null;
        continue;
      }
      if (b > B || h > H) throw new Error(`${b}×${h} mm passer ikke på A4`);
      if (cur && x + b > B + 0.01) {
        x = 0;
        y += rad;
        rad = 0;
      }
      if (!cur || y + h > H + 0.01) {
        cur = { plasser: [] };
        ark.push(cur);
        x = y = rad = 0;
      }
      cur.plasser.push({ x, y, b, h, del, i });
      x += b;
      rad = Math.max(rad, h);
    }
  }
  return ark;
}

// Lines are inline borders, not Tailwind or outline: they must print even
// when the stylesheet or background graphics are lost (Safari/Firefox print).
const SVART = "0.3mm solid #000";
const hjorner = [
  { top: 0, left: 0, borderTop: SVART, borderLeft: SVART },
  { top: 0, right: 0, borderTop: SVART, borderRight: SVART },
  { bottom: 0, left: 0, borderBottom: SVART, borderLeft: SVART },
  { bottom: 0, right: 0, borderBottom: SVART, borderRight: SVART },
];

function Klipp({ p, bak }: { p: Plass; bak: boolean }) {
  const x = bak ? B - p.x - p.b : p.x;
  return (
    <div
      style={{
        position: "absolute",
        overflow: "hidden",
        boxSizing: "border-box",
        border: "0.2mm dashed #888",
        left: `${x}mm`,
        top: `${p.y}mm`,
        width: `${p.b}mm`,
        height: `${p.h}mm`,
      }}
    >
      {hjorner.map((c, i) => (
        <span
          key={i}
          style={{ position: "absolute", width: "4mm", height: "4mm", ...c }}
        />
      ))}
      {bak ? p.del.bakside?.(p.i) : p.del.forside(p.i)}
    </div>
  );
}

function A3Halv({ p, halv }: { p: Plass; halv: "topp" | "bunn" }) {
  return (
    <>
      <div
        className="absolute left-0 w-full"
        style={{
          top: halv === "topp" ? 0 : `-${H - LIM}mm`,
          height: `${p.h}mm`,
        }}
      >
        {p.del.forside(p.i)}
      </div>
      {halv === "topp" ? (
        <>
          <span
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "8mm",
              borderBottom: "0.6mm solid #000",
            }}
          />
          <span
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: "8mm",
              borderBottom: "0.6mm solid #000",
            }}
          />
        </>
      ) : (
        <div
          className="absolute top-0 left-0 w-full flex items-center justify-center text-[3mm] font-sans text-gray-600 bg-[repeating-linear-gradient(45deg,#0000_0_2mm,#0002_2mm_3mm)] "
          style={{ height: `${LIM}mm`, borderBottom: "0.3mm solid #000" }}
        >
          LIM HER · legg nederkanten av ark 1 langs streken
        </div>
      )}
    </>
  );
}

const PAPIR = { vanlig: "vanlig papir (80 g)", tykt: "tykt papir (160–200 g)" };

export function Utskrift({
  navn,
  papir,
  tosidig = false,
  farge = false,
  deler,
  instruks,
}: {
  navn: string;
  papir: keyof typeof PAPIR;
  tosidig?: boolean;
  farge?: boolean;
  deler: Del[];
  instruks: { klipp?: string; brett?: string; hvor: string; merk?: string };
}) {
  const ark = pakk(deler);
  const sider = ark.flatMap((a) => {
    const sider = [{ a, bak: false }];
    if (tosidig && !a.a3) sider.push({ a, bak: true });
    return sider;
  });
  const a3 = ark.some((a) => a.a3);
  return (
    <div>
      <style>
        {
          "@page { size: A4; margin: 8mm; } * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }"
        }
      </style>
      <div className="print:hidden max-w-[210mm] mx-auto mb-6 border-2 border-(--neon-green) bg-black p-4 space-y-2 text-(--neon-green) font-retro text-xl">
        <h1 className="text-4xl text-(--gold)">{utskriftTittel(navn)}</h1>
        <p>
          <b>Papir:</b> {ark.length} ark A4, {PAPIR[papir]}
          {farge && ", fargeutskrift"}
          {tosidig && ", tosidig (vend på langsiden)"}.
        </p>
        <p>
          <b>Skriv ut i 100 % / «Faktisk størrelse»</b>, ikke «Tilpass til
          side». Da blir målene riktige.
        </p>
        {a3 && (
          <p>
            <b>Skjøt:</b> klipp ark 1 langs nederkanten, lim det over limfeltet
            øverst på ark 2 så bildet går i ett.
          </p>
        )}
        {instruks.klipp && (
          <p>
            <b>Klipp:</b> {instruks.klipp}
          </p>
        )}
        {instruks.brett && (
          <p>
            <b>Brett:</b> {instruks.brett}
          </p>
        )}
        <p>
          <b>Hvor og når:</b> {instruks.hvor}
        </p>
        {instruks.merk && <p>{instruks.merk}</p>}
        <button
          onClick={() => window.print()}
          className="px-6 py-3 min-h-11 bg-(--neon-green) text-black font-bold hover:opacity-80"
        >
          SKRIV UT
        </button>
      </div>
      {sider.map(({ a, bak }, n) => (
        <div
          key={n}
          className="bg-white text-black w-[210mm] h-[297mm] p-[8mm] mx-auto mb-6 print:w-auto print:h-auto print:p-0 print:m-0 break-after-page last:break-after-auto"
        >
          <div
            data-ark={bak ? "bak" : "for"}
            style={{
              position: "relative",
              overflow: "hidden",
              width: `${B}mm`,
              height: `${H}mm`,
            }}
          >
            {a.a3 ? (
              <A3Halv p={a.plasser[0]} halv={a.a3} />
            ) : (
              a.plasser.map((p, i) => <Klipp key={i} p={p} bak={bak} />)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
