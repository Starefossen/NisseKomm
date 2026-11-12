import type { ReactNode } from "react";
import { Frostrune } from "@/components/ui/Frostrune";

/*
 * Helpers for the day 1–12 printables, on top of ../PrintPage.
 * Runes go only on visible letters, never on ❄ squares (decided by Hans).
 */

/** One printed sheet; a new page starts before every sheet but the first. */
export function Ark({
  children,
  stil = "barn",
}: {
  children: ReactNode;
  stil?: "barn" | "forelder";
}) {
  const font = stil === "barn" ? "font-retro" : "font-sans";
  return (
    <div
      data-ark={stil}
      className={`${font} break-before-page first:break-before-auto pt-6 first:pt-0 print:pt-0`}
    >
      {children}
    </div>
  );
}

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

/** Card size that tiles an <Ark>: 8 «A7» (2 × 4) per sheet. */
export const A7 = "w-[92mm] h-[66mm]";

/**
 * Order for the back of a duplex sheet (long-edge flip): each row of a
 * grid with `kolonner` columns is reversed so backs land behind fronts.
 */
export function bakside<T>(liste: T[], kolonner: number): (T | null)[] {
  const ut: (T | null)[] = [];
  for (let i = 0; i < liste.length; i += kolonner) {
    const rad: (T | null)[] = liste.slice(i, i + kolonner);
    while (rad.length < kolonner) rad.push(null);
    ut.push(...rad.reverse());
  }
  return ut;
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
