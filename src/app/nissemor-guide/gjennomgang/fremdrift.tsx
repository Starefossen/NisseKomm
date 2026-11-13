"use client";

import Link from "next/link";
import { FREMDRIFT, type Fremdrift } from "./ko";

interface Rad {
  navn: string;
  n: number;
  telling: Record<Fremdrift, number>;
}

const pst = (x: number, n: number) => Math.round((100 * x) / Math.max(1, n));

/** One stacked bar; a segment links to the queue filtered to that status (and type). */
function Stolpe({ r, side, type }: { r: Rad; side: string; type?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-40 shrink-0 text-base">
        {r.navn} ({r.n})
      </span>
      <div className="flex flex-1 h-6 border-2 border-(--neon-green)">
        {FREMDRIFT.map(([st, navn, farge]) =>
          r.telling[st] ? (
            <Link
              key={st}
              href={`${side}?s=${st}${type ? `&g=${encodeURIComponent(type)}` : ""}`}
              title={`${navn}: ${r.telling[st]} av ${r.n} (${pst(r.telling[st], r.n)} %)`}
              aria-label={`${r.navn}, ${navn}: ${r.telling[st]} av ${r.n}`}
              className={`${farge} h-full hover:opacity-70`}
              style={{ width: `${pst(r.telling[st], r.n)}%` }}
            />
          ) : null,
        )}
      </div>
    </div>
  );
}

export function Fremdriftslinjer({
  total,
  typer,
  side,
}: {
  total: Rad;
  typer: Rad[];
  side: string;
}) {
  return (
    <div data-testid="fremdrift" className="flex flex-col gap-1">
      <Stolpe r={total} side={side} />
      <div className="hidden sm:flex flex-col gap-1">
        {typer.map((r) => (
          <Stolpe key={r.navn} r={r} side={side} type={r.navn} />
        ))}
      </div>
      <p className="text-base">
        {FREMDRIFT.map(([st, navn, farge]) => (
          <span key={st} className="mr-3 whitespace-nowrap">
            <span className={`inline-block w-3 h-3 ${farge}`} /> {navn}{" "}
            {total.telling[st]}
          </span>
        ))}
      </p>
    </div>
  );
}
