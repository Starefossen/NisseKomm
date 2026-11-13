"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Verdikt } from "@/app/api/media/vurdering/route";
import { mediaUrl } from "@/lib/media";
import { Lagremelding, useLagring } from "../lagring";
import { LysbordBilde } from "../lysbord";
import { lagre } from "../vurdering";
import { CELLE, type CelleData } from "./celle";
import type { Element } from "./elementer";

const KNAPPER: [Verdikt, string, string][] = [
  ["godkjent", "Godkjent (G)", "g"],
  ["ok", "OK (O)", "o"],
  ["lag_paa_nytt", "Lag på nytt (L)", "l"],
];

/**
 * A group of small images as thumbnails: pick several (click, shift-click,
 * «Velg alle uvurderte») and give them one verdict and note. The name under
 * each thumbnail opens the item in the element view.
 */
export function Rutenett({
  rad,
  data,
  lenke,
  uvurdert,
}: {
  rad: Element[];
  data: (e: Element) => CelleData;
  lenke: (e: Element) => string;
  uvurdert: (e: Element) => boolean;
}) {
  const [valgt, setValgt] = useState<Set<string>>(new Set());
  const [sist, setSist] = useState<number | null>(null);
  const [notat, setNotat] = useState("");
  const [mangler, setMangler] = useState(false);
  const felt = useRef<HTMLInputElement>(null);
  const { status, kjør } = useLagring();

  const velg = (i: number, shift: boolean) => {
    const ny = new Set(valgt);
    if (shift && sist !== null) {
      const [a, b] = [Math.min(sist, i), Math.max(sist, i)];
      rad.slice(a, b + 1).forEach((e) => ny.add(e.id));
    } else if (ny.has(rad[i].id)) ny.delete(rad[i].id);
    else ny.add(rad[i].id);
    setValgt(ny);
    setSist(i);
  };

  const send = (v: Verdikt) => {
    if (!valgt.size) return;
    if (v === "lag_paa_nytt" && !notat.trim()) {
      setMangler(true);
      felt.current?.focus();
      return;
    }
    setMangler(false);
    const ider = [...valgt];
    // The server writes one at a time under its file lock.
    void kjør(
      () => Promise.all(ider.map((id) => lagre(id, v, notat))),
      `✓ ${ider.length} lagret`,
    ).then((ok) => {
      if (ok) {
        setValgt(new Set());
        setNotat("");
      }
    });
  };

  useEffect(() => {
    const ned = (ev: KeyboardEvent) => {
      const mal = ev.target as HTMLElement;
      if (ev.metaKey || ev.ctrlKey || ev.altKey || ev.shiftKey) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(mal.tagName)) return;
      const k = KNAPPER.find(([, , t]) => t === ev.key.toLowerCase());
      if (!k || !valgt.size) return;
      ev.preventDefault();
      send(k[0]);
    };
    window.addEventListener("keydown", ned);
    return () => window.removeEventListener("keydown", ned);
  });

  return (
    <div data-testid="rutenett">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <button
          type="button"
          onClick={() =>
            setValgt(new Set(rad.filter(uvurdert).map((e) => e.id)))
          }
          className="min-h-11 px-3 border-2 border-(--neon-green) hover:bg-(--neon-green)/20"
        >
          Velg alle uvurderte
        </button>
        {valgt.size > 0 && (
          <button
            type="button"
            onClick={() => setValgt(new Set())}
            className="min-h-11 px-3 underline"
          >
            Fjern valg ({valgt.size})
          </button>
        )}
        {KNAPPER.map(([v, tekst]) => (
          <button
            key={v}
            type="button"
            data-verdikt={v}
            disabled={!valgt.size}
            onClick={() => send(v)}
            className="min-h-11 px-3 border-2 border-(--neon-green) hover:bg-(--neon-green)/20 disabled:opacity-40"
          >
            {tekst}
          </button>
        ))}
        <input
          ref={felt}
          value={notat}
          onChange={(ev) => setNotat(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") send("lag_paa_nytt");
          }}
          placeholder="Notat for alle valgte"
          className="min-h-11 flex-1 min-w-48 bg-black border-2 border-(--neon-green) px-2 text-base"
        />
        <Lagremelding status={status} />
      </div>
      {mangler && !notat.trim() && (
        <p role="alert" className="text-sm text-(--christmas-red)">
          Skriv hva som må endres
        </p>
      )}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2">
        {rad.map((e, i) => {
          const c = data(e);
          const på = valgt.has(e.id);
          return (
            <li
              key={e.id}
              className={`border-4 ${på ? "border-(--gold)" : "border-transparent"}`}
            >
              <button
                type="button"
                aria-pressed={på}
                aria-label={`Velg ${e.tittel}`}
                onClick={(ev) => velg(i, ev.shiftKey)}
                className={`block w-full aspect-square p-1 ${CELLE[c.status][1]}`}
                title={`${e.tittel}: ${CELLE[c.status][0]}${c.notat ? ` – ${c.notat}` : ""}`}
              >
                <LysbordBilde
                  klikk={false}
                  gruppe="rutenett"
                  src={mediaUrl(e.id)}
                  alt={e.tittel}
                  loading="lazy"
                  className="w-full h-full object-contain bg-black [image-rendering:pixelated]"
                />
              </button>
              <Link
                href={lenke(e)}
                className="block text-sm underline break-all min-h-11 py-1"
              >
                {e.tittel}
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="text-base text-(--neon-green)/80">
        Klikk velger, Shift-klikk velger et område. G/O/L gir alle valgte samme
        vurdering (L krever notat). Navnet åpner ett element. F viser bildet i
        lysbordet (←/→ blar).
      </p>
    </div>
  );
}
