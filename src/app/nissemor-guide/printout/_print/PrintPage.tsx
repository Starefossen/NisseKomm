"use client";

import type { ReactNode } from "react";
import { Frostrune } from "@/components/ui/Frostrune";

/**
 * Shared A4 print layout. On screen: a short note for Nissemor, a print button
 * and a white preview of the sheet. On paper: only the sheet.
 */
export function PrintPage({
  title,
  paper,
  note,
  children,
}: {
  title: string;
  /** Paper and sides, e.g. "1 ark, tykt papir, tosidig". */
  paper?: string;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="print:p-0">
      <style>{"@page { size: A4; margin: 10mm; }"}</style>
      <div className="print:hidden max-w-4xl mx-auto space-y-4 mb-6 text-(--neon-green) font-retro">
        <h1 className="text-4xl font-bold text-center">🖨️ {title}</h1>
        {paper && <p className="text-xl text-center">{paper}</p>}
        {note && <div className="text-lg opacity-80">{note}</div>}
        <button
          onClick={() => window.print()}
          className="px-6 py-3 min-h-11 bg-(--neon-green) border-4 border-(--neon-green) text-black font-bold text-xl hover:opacity-80"
        >
          SKRIV UT
        </button>
      </div>
      <div className="bg-white text-black mx-auto w-[190mm] p-4 print:w-auto print:p-0">
        {children}
      </div>
    </div>
  );
}

/** Starts a new printed sheet (e.g. the back side for duplex printing). */
export function NewSheet({ children }: { children: ReactNode }) {
  return <div className="break-before-page pt-6 print:pt-0">{children}</div>;
}

/**
 * Card with a dashed cut line. `rune` puts a Frostrune in the top-right corner,
 * `nr` a faint number in the top-left.
 */
export function CutCard({
  children,
  rune,
  nr,
  className = "",
}: {
  children: ReactNode;
  rune?: string;
  nr?: string | number;
  className?: string;
}) {
  return (
    <div
      className={`relative border-2 border-dashed border-black p-2 break-inside-avoid flex flex-col items-center justify-center ${className}`}
    >
      {nr !== undefined && (
        <span className="absolute top-1 left-2 text-sm text-gray-400">
          {nr}
        </span>
      )}
      {rune && (
        <span className="absolute top-1 right-1">
          <Frostrune letter={rune} size={14} />
        </span>
      )}
      {children}
    </div>
  );
}
