import type { ReactNode } from "react";
import { Frostrune } from "@/components/ui/Frostrune";

/*
 * Helpers for the printables in the <Utskrift> frame.
 * Visible letters carry their rune in the corner; a ❄ square only when its
 * rune is new that day (gaater-2026 Meta 1, `@/lib/runeorden`). Runes on ❄
 * squares are marked `data-skjult`.
 */

import { Iskrystall } from "@/components/ui/Iskrystall";
export { Iskrystall };

/**
 * A frostlapp row: one cell per letter; null = ice crystal. A letter cell
 * gets its rune in the corner; ❄ cells only via `runer`.
 */
export function Ruter({
  celler,
  nummer = false,
  runer,
  storrelse = "w-[15mm] h-[20mm]",
}: {
  celler: (ReactNode | null)[];
  nummer?: boolean;
  /** Per-cell runes, overriding the default (rune on visible letters only):
   *  `skjultRune` for each ❄ cell in a real skeleton. */
  runer?: (string | undefined)[];
  storrelse?: string;
}) {
  return (
    <div className="flex gap-[2mm] justify-center">
      {celler.map((c, i) => (
        <div
          key={i}
          className={`relative border-2 border-black ${storrelse} flex items-center justify-center text-4xl`}
        >
          {nummer && (
            <span className="absolute bottom-0 left-[1mm] text-xs text-gray-400">
              {i + 1}
            </span>
          )}
          {(runer ? runer[i] : typeof c === "string" && c) && (
            <span
              className="absolute top-[1mm] right-[1mm]"
              data-skjult={c === null || undefined}
            >
              <Frostrune letter={runer ? runer[i]! : (c as string)} size={12} />
            </span>
          )}
          {c ?? <Iskrystall size={28} />}
        </div>
      ))}
    </div>
  );
}

/** Side of the cut-off corner in mm: 1–2 mm under a runetavle box (26.4 mm wide). */
export const HJORNE = 25;
const PLASS = {
  tr: "top-0 right-0",
  tl: "top-0 left-0",
  br: "bottom-0 right-0",
  bl: "bottom-0 left-0",
} as const;

/**
 * A dotted cut-off corner with a NEW rune, big, for the runetavle
 * (gaater-2026 Meta 1). The parent must be `relative`.
 */
export function Klipphjorne({
  letter,
  hjorne = "tr",
}: {
  letter: string;
  hjorne?: keyof typeof PLASS;
}) {
  const kant = {
    tr: "border-l-2 border-b-2",
    tl: "border-r-2 border-b-2",
    br: "border-l-2 border-t-2",
    bl: "border-r-2 border-t-2",
  }[hjorne];
  return (
    <div
      data-klipp={letter}
      className={`absolute ${PLASS[hjorne]} ${kant} border-dotted border-black bg-white flex flex-col items-center justify-center font-retro`}
      // Inline mm, not Tailwind classes or em: the card's 40 mm letter must
      // never leak into the corner (Safari showed «klipp» at card size).
      style={{
        width: `${HJORNE}mm`,
        height: `${HJORNE}mm`,
        fontSize: "2.5mm",
        lineHeight: 1,
      }}
    >
      <Frostrune letter={letter} size={40} />
      <span
        data-klipp-tekst
        className="flex items-center text-gray-500"
        style={{ fontSize: "2.5mm", gap: "0.8mm", marginTop: "1mm" }}
      >
        {/* Scissors: two rings and crossed blades. */}
        <svg
          viewBox="0 0 10 10"
          width="10"
          height="10"
          style={{ width: "3mm", height: "3mm" }}
          aria-hidden
        >
          <g fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="2.2" cy="2.5" r="1.6" />
            <circle cx="2.2" cy="7.5" r="1.6" />
            <path d="M3.6 3.4 9.5 8M3.6 6.6 9.5 2" />
          </g>
        </svg>
        klipp
      </span>
    </div>
  );
}

/** Corners in fill order when one card carries several new runes. */
export const HJORNER = ["tr", "tl", "br", "bl"] as const;

/** n dots, for the order dots on card backs. */
export function Prikker({ n }: { n: number }) {
  return (
    <div className="flex gap-[3mm]" aria-label={`${n} prikker`}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="w-[5mm] h-[5mm] rounded-full bg-black" />
      ))}
    </div>
  );
}

/** Empty numbered squares the kids fill in (days 15, 16). */
export function Rutekort({ n }: { n: number }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-[2mm] font-retro">
      <div className="text-[5mm] tracking-widest">NISSEKOMM · RUTEKORT</div>
      <div className="flex gap-[1.5mm]">
        {Array.from({ length: n }, (_, i) => (
          <div
            key={i}
            className="w-[17mm] h-[20mm] border-[0.8mm] border-black text-[3mm] text-gray-500 p-[0.5mm]"
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}
