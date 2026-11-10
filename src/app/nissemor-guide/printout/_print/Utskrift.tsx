"use client";

import { Suspense, type ReactNode } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { Frostrune } from "@/components/ui/Frostrune";

/**
 * Shared print layout for /nissemor-guide/printout/<navn>.
 * On screen: guide navigation, a note for the parent and a preview of the sheets.
 * In print: only the <Ark> sheets, A4, no app chrome.
 */
export function Utskrift({
  tittel,
  papir,
  children,
  merknad,
}: {
  tittel: string;
  /** E.g. "1 side, tykt papir, tosidig". */
  papir: string;
  merknad?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<div className="p-8">Laster ...</div>}>
      <GuideAuth>
        <style>{`@page { size: A4; margin: 8mm; } @media print { body { background: white !important; } }`}</style>
        <div className="print:hidden bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <GuideNavigation currentPage="printout" />
            <h1 className="text-4xl font-bold text-center">🖨️ {tittel}</h1>
            <p className="text-xl text-center">{papir}</p>
            {merknad && <div className="text-lg opacity-80">{merknad}</div>}
            <button
              onClick={() => window.print()}
              className="px-6 py-3 min-h-11 bg-(--neon-green) border-4 border-(--neon-green) text-black font-bold text-xl hover:opacity-80"
            >
              SKRIV UT
            </button>
          </div>
        </div>
        <div className="bg-gray-500 py-8 print:p-0 print:bg-white flex flex-col items-center gap-8 print:block">
          {children}
        </div>
      </GuideAuth>
    </Suspense>
  );
}

/**
 * One A4 sheet (194 × 281 mm printable inside 8 mm margins).
 * barn: retro NisseKomm look in black and white. forelder: plain.
 */
export function Ark({
  children,
  stil = "barn",
  className = "",
}: {
  children: ReactNode;
  stil?: "barn" | "forelder";
  className?: string;
}) {
  const font =
    stil === "barn" ? "font-['VT323',monospace]" : "font-sans text-base";
  return (
    <section
      data-ark={stil}
      className={`bg-white text-black w-[194mm] min-h-[281mm] print:min-h-0 p-[4mm] shadow-xl print:shadow-none break-after-page print:break-inside-avoid overflow-hidden ${font} ${className}`}
    >
      {children}
    </section>
  );
}

/**
 * A piece to cut out: dashed cut line around it, optional rune in the
 * top-right corner and a faint number in the bottom-left (gaater rules).
 */
export function Klipp({
  children,
  rune,
  nr,
  rute = false,
  className = "",
}: {
  children?: ReactNode;
  rune?: string;
  nr?: number;
  /** A solid cell inside a card instead of a dashed cut line. */
  rute?: boolean;
  className?: string;
}) {
  const kant = rute
    ? "border-2 border-black"
    : "border-2 border-dashed border-gray-400";
  return (
    <div className={`relative ${kant} ${className}`}>
      {rune && (
        <Frostrune
          letter={rune}
          size={14}
          className="absolute top-[2mm] right-[2mm]"
        />
      )}
      {nr !== undefined && (
        <span className="absolute bottom-[1mm] left-[2mm] text-xs text-gray-400">
          {nr}
        </span>
      )}
      {children}
    </div>
  );
}

/** Ice crystal for ❄ cells: drawn, not the emoji, so it prints the same everywhere. */
export function Iskrystall({ size = 32 }: { size?: number }) {
  const arm = "M0 -10 V10 M-3 -7 L0 -10 L3 -7 M-3 7 L0 10 L3 7";
  return (
    <svg
      viewBox="-12 -12 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      aria-hidden
    >
      {[0, 60, 120].map((r) => (
        <path key={r} d={arm} transform={`rotate(${r})`} />
      ))}
    </svg>
  );
}

/** A frostlapp row: one cell per letter; null = ice crystal. Runes per cell go in the corner. */
export function Ruter({
  celler,
  runer = [],
  nummer = false,
  storrelse = "w-[15mm] h-[20mm]",
}: {
  celler: (string | null)[];
  runer?: (string | undefined)[];
  nummer?: boolean;
  storrelse?: string;
}) {
  return (
    <div className="flex gap-[2mm] justify-center">
      {celler.map((c, i) => (
        <Klipp
          key={i}
          rune={runer[i]}
          nr={nummer ? i + 1 : undefined}
          rute
          className={`${storrelse} flex items-center justify-center text-4xl`}
        >
          {c ?? <Iskrystall size={28} />}
        </Klipp>
      ))}
    </div>
  );
}

/** Card sizes that tile an <Ark>: 8 «A7» (2 × 4) or 2 «A6» per sheet. */
export const A7 = "w-[92mm] h-[66mm]";
export const A6 = "w-[92mm] h-[134mm]";

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
