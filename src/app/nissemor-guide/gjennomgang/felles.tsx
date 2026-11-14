"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { GJENSTAAR } from "../media/filter";
import { KOLONNER, type Element, type Tilstand } from "./elementer";

export const SIDE = "/nissemor-guide/gjennomgang";
export const REKKEFOLGE = "nissekomm-guide-gjennomgang-rekkefolge";
export const href = (id: string, ekstra = "") =>
  `${SIDE}?id=${encodeURIComponent(id)}${ekstra}`;
const UTVALG_NOKKEL = "nissekomm-guide-gjennomgang-utvalg";

/**
 * Filter: Status (Gjenstår | Alt) and Type (an element's `gruppe`, from the
 * type registry). URL `?f=gjenstaar|alle&t=<gruppe>`; an old `?f=julius`
 * still means type Julius.
 */
export interface Utvalg {
  s: "gjenstaar" | "alle";
  t: string | null;
}
const KOLONNE_NAVN: Record<string, string> = Object.fromEntries(KOLONNER);
export const typeNavn = (g: string) => KOLONNE_NAVN[g] ?? g;

export const passerUtvalg = (u: Utvalg, e: Element, celle: Tilstand) =>
  (u.s === "alle" || GJENSTAAR.includes(celle)) && (!u.t || e.gruppe === u.t);

function lesUtvalg(f: string | null, t: string | null): Utvalg {
  if (f && f !== "gjenstaar" && f !== "alle") return { s: "alle", t: f };
  return { s: f === "gjenstaar" ? "gjenstaar" : "alle", t };
}
export const utvalgUrl = (u: Utvalg) =>
  `&f=${u.s}${u.t ? `&t=${encodeURIComponent(u.t)}` : ""}`;

/** From `?f=`/`?t=`, else the last one used, else everything. */
export function useUtvalg(): [Utvalg, (u: Utvalg) => void] {
  const sp = useSearchParams();
  const [u, setU] = useState<Utvalg>(() => {
    if (sp.has("f")) return lesUtvalg(sp.get("f"), sp.get("t"));
    const [f, t] = (localStorage.getItem(UTVALG_NOKKEL) ?? "alle").split("|");
    return lesUtvalg(f, t || null);
  });
  const sett = (ny: Utvalg) => {
    localStorage.setItem(UTVALG_NOKKEL, `${ny.s}|${ny.t ?? ""}`);
    const url = new URL(location.href);
    url.searchParams.set("f", ny.s);
    if (ny.t) url.searchParams.set("t", ny.t);
    else url.searchParams.delete("t");
    history.replaceState(history.state, "", url);
    setU(ny);
  };
  return [u, sett];
}

/** A compact select with its label inside the frame: «Type: Alle ▾». */
export function Valg({
  navn,
  children,
  ...p
}: { navn: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="relative inline-flex items-center h-11 border border-(--neon-green)/60 pl-2 hover:bg-(--neon-green)/10 whitespace-nowrap">
      <span className="text-(--neon-green)/70">{navn}:</span>
      <select
        aria-label={navn}
        {...p}
        className="appearance-none bg-transparent h-full pl-1 pr-6 cursor-pointer [field-sizing:content] [&>option]:bg-black"
      >
        {children}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-2">
        ▾
      </span>
    </label>
  );
}

/** Status as a two-way switch, Type as a dropdown with what remains per type. */
export function UtvalgValg({
  u,
  sett,
  liste,
  gjenstaar,
}: {
  u: Utvalg;
  sett: (u: Utvalg) => void;
  liste: Element[];
  gjenstaar: (e: Element) => boolean;
}) {
  const typer = [...new Set(liste.map((e) => e.gruppe))];
  const igjen = (g: string) =>
    liste.filter((e) => e.gruppe === g && gjenstaar(e)).length;
  return (
    <div className="flex flex-wrap items-center gap-2 text-base">
      <div
        role="group"
        aria-label="Status"
        className="inline-flex h-11 border border-(--neon-green)/60"
      >
        {(
          [
            ["gjenstaar", "Gjenstår"],
            ["alle", "Alt"],
          ] as const
        ).map(([k, navn]) => (
          <button
            key={k}
            type="button"
            aria-pressed={u.s === k}
            onClick={() => sett({ ...u, s: k })}
            className={`min-w-11 px-3 ${u.s === k ? "bg-(--gold) text-black" : "hover:bg-(--neon-green)/20"}`}
          >
            {navn}
          </button>
        ))}
      </div>
      <Valg
        navn="Type"
        value={u.t ?? ""}
        onChange={(ev) => sett({ ...u, t: ev.target.value || null })}
      >
        <option value="">Alle ({liste.filter(gjenstaar).length})</option>
        {typer.map((g) => (
          <option key={g} value={g}>
            {typeNavn(g)} ({igjen(g)})
          </option>
        ))}
      </Valg>
    </div>
  );
}

export const pil =
  "h-11 w-11 shrink-0 inline-flex items-center justify-center border border-(--neon-green)/60 text-xl hover:bg-(--neon-green)/20";
export const knapp =
  "inline-flex items-center justify-center min-h-11 min-w-11 px-3 border-2 border-(--neon-green) hover:bg-(--neon-green)/20";

export const FANER = [
  ["venter", "Venter på deg"],
  ["agent", "Hos agent"],
  ["laerdom", "Lærdom"],
  ["arbeid", "Under arbeid"],
] as const;
export type Fane = (typeof FANER)[number][0];

export const kr = (n: number) =>
  n.toLocaleString("nb-NO", { maximumFractionDigits: 1 });

/** The queue: what waits for Hans, what waits for an agent, and the lessons. */
