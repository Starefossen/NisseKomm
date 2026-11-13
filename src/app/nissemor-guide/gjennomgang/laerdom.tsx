"use client";

import { useState } from "react";
import type { Endring, Laerdom } from "@/lib/laerdom";
import { Lagremelding, useLagring } from "../lagring";
import type { Linje } from "./ko";
import { taggType } from "@/lib/vurdering-tagger";

const knapp =
  "inline-flex items-center justify-center min-h-11 min-w-11 px-3 border-2 border-(--neon-green) hover:bg-(--neon-green)/20";

async function send(e: Endring): Promise<Laerdom> {
  const r = await fetch("/api/media/laerdom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(e),
  });
  if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
  return r.json();
}

/** «Gjør til regel» / «Avvis» under one Lærdom suggestion. */
export function Forslag({ l, ny }: { l: Linje; ny: (d: Laerdom) => void }) {
  const [tekst, setTekst] = useState<string | null>(null);
  const { status, lagrer, kjør } = useLagring();
  const gjør = (e: Endring) => kjør(async () => ny(await send(e)));
  // A rule needs a type the generators read (vurdering-tagger.json); other notes can only be dismissed.
  const type = taggType(l.id);
  if (tekst === null || !type)
    return (
      <div className="flex flex-wrap gap-2 items-center">
        {type && (
          <button
            type="button"
            className={knapp}
            onClick={() => setTekst(`unngå: ${l.notat ?? ""}`)}
          >
            Gjør til regel
          </button>
        )}
        <button
          type="button"
          className={knapp}
          disabled={lagrer}
          onClick={() => gjør({ handling: "avvis", kilder: [l.id] })}
        >
          Avvis
        </button>
        <Lagremelding status={status} />
      </div>
    );
  return (
    <form
      className="flex flex-wrap gap-2 items-center"
      onSubmit={(ev) => {
        ev.preventDefault();
        gjør({ handling: "regel", type, regel: tekst, kilder: [l.id] });
      }}
    >
      <label className="flex-1 min-w-64">
        <span className="sr-only">Regel for {type}</span>
        <input
          autoFocus
          value={tekst}
          maxLength={200}
          onChange={(ev) => setTekst(ev.target.value)}
          placeholder="unngå: … / gjør: …"
          className="w-full min-h-11 px-2 bg-black border-2 border-(--neon-green)"
        />
      </label>
      <button
        type="submit"
        className={knapp}
        disabled={lagrer || !tekst.trim()}
      >
        Lagre regel ({type})
      </button>
      <button type="button" className={knapp} onClick={() => setTekst(null)}>
        Avbryt
      </button>
      <Lagremelding status={status} />
    </form>
  );
}

/** The rules in assets/laerdom.json; the generators read the active ones. */
export function Regler({ d, ny }: { d: Laerdom; ny: (d: Laerdom) => void }) {
  const { status, lagrer, kjør } = useLagring();
  if (!d.regler.length) return null;
  return (
    <div data-testid="regler">
      <h2 className="text-2xl text-(--gold) mt-3">
        Regler (generatorene leser de aktive)
      </h2>
      <ul>
        {d.regler.map((r, i) => (
          <li
            key={i}
            className={`border-b border-(--neon-green)/30 p-2 ${r.aktiv ? "" : "opacity-50"}`}
          >
            <span className="text-(--gold)">{r.type}:</span> {r.regel}{" "}
            <span className="text-base">({r.dato})</span>{" "}
            <button
              type="button"
              className={knapp}
              disabled={lagrer}
              onClick={() =>
                kjør(async () =>
                  ny(
                    await send({ handling: r.aktiv ? "av" : "på", indeks: i }),
                  ),
                )
              }
            >
              {r.aktiv ? "Slå av" : "Slå på"}
            </button>
          </li>
        ))}
      </ul>
      <Lagremelding status={status} />
      <p className="text-base">
        Lagret i assets/laerdom.json; en agent committer filen.
      </p>
    </div>
  );
}
