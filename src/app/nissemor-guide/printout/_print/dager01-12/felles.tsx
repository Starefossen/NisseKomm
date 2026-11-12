import type { ReactNode } from "react";
import { Frostrune } from "@/components/ui/Frostrune";

/*
 * Helpers for the printables in the <Utskrift> frame.
 * Runes go only on visible letters, never on ❄ squares (decided by Hans).
 */

import { Iskrystall } from "@/components/ui/Iskrystall";
export { Iskrystall };

/**
 * A frostlapp row: one cell per letter; null = ice crystal. A letter cell
 * gets its rune in the corner; ❄ cells get none.
 */
export function Ruter({
  celler,
  nummer = false,
  runer,
  storrelse = "w-[15mm] h-[20mm]",
}: {
  celler: (ReactNode | null)[];
  nummer?: boolean;
  /** Per-cell runes, overriding the default (rune on visible letters only).
   *  Only for cards where the meta puzzle teaches or tests the runes (day 3, 7). */
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
            <span className="absolute top-[1mm] right-[1mm]">
              <Frostrune letter={runer ? runer[i]! : (c as string)} size={12} />
            </span>
          )}
          {c ?? <Iskrystall size={28} />}
        </div>
      ))}
    </div>
  );
}

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
