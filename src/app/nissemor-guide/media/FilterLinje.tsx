"use client";

import { useEffect, useState } from "react";
import {
  GJENSTAAR,
  HANDLINGER,
  LAGRET,
  STANDARD,
  TILSTANDER,
  TOMT,
  TYPER,
  antall,
  erGjenstaar,
  fraQuery,
  tilQuery,
  type Filter,
  type Gruppe,
  type Rad,
} from "./filter";

/** Filter from the URL, else the last one used, else «Hva gjenstår»; written back to both. */
export function useFilter(): [Filter, (f: Filter) => void] {
  const [f, setF] = useState<Filter>(STANDARD);
  useEffect(() => {
    const fra =
      fraQuery(location.search) ?? fraQuery(localStorage.getItem(LAGRET) ?? "");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL and localStorage only exist after mount
    if (fra) setF(fra);
  }, []);
  const sett = (ny: Filter) => {
    setF(ny);
    const q = tilQuery(ny);
    localStorage.setItem(LAGRET, q);
    const url = new URL(location.href);
    url.search = q;
    history.replaceState(history.state, "", url);
  };
  return [f, sett];
}

const chip = (på: boolean) =>
  `min-h-11 px-3 border-2 cursor-pointer text-lg ${
    på
      ? "border-(--gold) bg-(--gold) text-black"
      : "border-(--neon-green) hover:bg-(--neon-green)/20"
  }`;

export function FilterLinje({
  f,
  sett,
  rader,
}: {
  f: Filter;
  sett: (f: Filter) => void;
  rader: Rad[];
}) {
  const gruppe = (g: Gruppe, valg: readonly (readonly [string, string])[]) =>
    valg.map(([v, navn]) => {
      const på = f[g].includes(v);
      return (
        <button
          key={v}
          type="button"
          aria-pressed={på}
          onClick={() =>
            sett({
              ...f,
              [g]: på ? f[g].filter((x) => x !== v) : [...f[g], v],
            })
          }
          className={chip(på)}
        >
          {navn} ({antall(rader, { ...f, [g]: [v] })})
        </button>
      );
    });
  const rad = "flex flex-wrap items-center gap-2";
  return (
    <div className="flex flex-col gap-2 mb-6 p-3 border-2 border-(--neon-green) bg-black">
      <div className={rad}>
        <button
          type="button"
          aria-pressed={erGjenstaar(f)}
          onClick={() => sett({ ...f, s: erGjenstaar(f) ? [] : GJENSTAAR })}
          className={chip(erGjenstaar(f))}
        >
          Hva gjenstår ({antall(rader, { ...f, s: GJENSTAAR })})
        </button>
        <button
          type="button"
          onClick={() => sett(TOMT)}
          className={chip(false)}
        >
          Vis alt
        </button>
      </div>
      <div className={rad}>{gruppe("s", TILSTANDER)}</div>
      <div className={rad}>{gruppe("a", HANDLINGER)}</div>
      <div className={rad}>{gruppe("t", TYPER)}</div>
      <div className={rad}>
        <label className="flex items-center gap-2 min-h-11">
          Dag
          <select
            value={f.d ?? ""}
            onChange={(e) =>
              sett({ ...f, d: e.target.value ? Number(e.target.value) : null })
            }
            className="bg-black border-2 border-(--neon-green) min-h-11 px-2 text-(--neon-green)"
          >
            <option value="">alle</option>
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <input
          type="search"
          value={f.q}
          onChange={(e) => sett({ ...f, q: e.target.value })}
          placeholder="Søk i sti eller notat"
          className="flex-1 min-w-48 min-h-11 bg-black border-2 border-(--neon-green) px-2 text-(--neon-green)"
        />
      </div>
    </div>
  );
}
