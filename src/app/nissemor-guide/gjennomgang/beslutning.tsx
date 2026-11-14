"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Beslutning } from "@/lib/beslutninger";
import type { Sesong } from "../_kveld/felles";
import { useKo, type Data } from "./celle";
import { SIDE } from "./felles";
import { besøk, lesHistorikk, skrivHistorikk } from "./historikk";
import { linjeHref, nesteLinje } from "./ko";

const knapp =
  "min-h-11 px-3 py-2 border-2 text-left w-full hover:bg-(--neon-green)/20";

/**
 * One open choice: 1–4 picks an option, Enter saves with the optional «hvorfor».
 * Reads and updates the page's queue data (`d.server`), so the answered one is
 * gone from «Venter på deg» at once; N (and Enter once answered) opens the next line.
 */
export function BeslutningVisning({
  id,
  d,
  sesong,
}: {
  id: string;
  d: Data;
  sesong: Sesong;
}) {
  const router = useRouter();
  const slug = id.replace(/^beslutning\//, "");
  const [valgt, setValgt] = useState<number | null>(null);
  const [hvorfor, setHvorfor] = useState("");
  const [feil, setFeil] = useState("");
  const { liste, ko } = useKo(d, sesong);
  const b: Beslutning | null | "mangler" = d.server
    ? ((d.server.beslutninger ?? []).find((x) => x.slug === slug) ?? "mangler")
    : null;
  const neste = nesteLinje(ko?.venter ?? [], id);
  const nesteHref = neste && linjeHref(neste, liste, "&k=venter");

  // P in the next item comes back here.
  useEffect(() => skrivHistorikk(besøk(lesHistorikk(), id)), [id]);

  const lagre = async () => {
    if (valgt === null || !b || b === "mangler" || b.svar) return;
    const r = await fetch("/api/beslutninger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, valg: valgt, hvorfor }),
    });
    if (!r.ok) return setFeil(await r.text());
    const ny: Beslutning = (await r.json()).beslutning;
    d.settServer((s) => ({
      ...s,
      beslutninger: (s.beslutninger ?? []).map((x) =>
        x.slug === slug ? ny : x,
      ),
    }));
    setFeil("");
  };

  useEffect(() => {
    const ned = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey || !b || b === "mangler")
        return;
      const iTekst = (ev.target as HTMLElement).tagName === "TEXTAREA";
      const n = Number(ev.key);
      if (!iTekst && n >= 1 && n <= b.valg.length) setValgt(n - 1);
      else if (!iTekst && ev.key.toLowerCase() === "n" && nesteHref)
        router.push(nesteHref);
      else if (ev.key === "Enter" && !ev.shiftKey) {
        if (b.svar && nesteHref) router.push(nesteHref);
        else void lagre();
      } else return;
      ev.preventDefault();
    };
    window.addEventListener("keydown", ned);
    return () => window.removeEventListener("keydown", ned);
  });

  if (b === null) return <p>Laster …</p>;
  if (b === "mangler") return <p>Fant ikke {id}.</p>;
  return (
    <div className="space-y-3" data-testid="beslutning">
      <Link href={SIDE} className="underline text-(--gold)">
        ← Tilbake til køen
      </Link>
      <p className="text-(--cold-blue)">
        BESLUTNING · {b.av.replace(/^agent:/, "")}
      </p>
      <h1 className="text-3xl text-(--gold)">{b.spørsmål}</h1>
      <p className="whitespace-pre-wrap">{b.kontekst}</p>
      {b.lenker.length > 0 && (
        <p className="text-base">
          Gjelder:{" "}
          {b.lenker.map((l) => (
            <Link
              key={l}
              href={`${SIDE}?id=${encodeURIComponent(l)}`}
              className="underline text-(--gold) mr-3 inline-block min-h-11 py-2"
            >
              {l}
            </Link>
          ))}
        </p>
      )}
      <ol className="space-y-2">
        {b.valg.map((v, i) => {
          const svar = b.svar?.valg === i;
          const på = b.svar ? svar : valgt === i;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={!!b.svar}
                onClick={() => setValgt(i)}
                aria-pressed={på}
                className={`${knapp} ${på ? "border-(--gold) bg-(--gold)/20" : "border-(--neon-green)/60"}`}
              >
                {i + 1}. {v}
                {i === b.anbefalt && (
                  <span className="text-(--cold-blue)"> ★ anbefalt</span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
      {b.svar ? (
        <p className="text-(--gold)" data-testid="besvart">
          Besvart {b.svar.dato}
          {b.svar.hvorfor ? `. Hvorfor: ${b.svar.hvorfor}` : ""}
        </p>
      ) : (
        <>
          <label className="block">
            Hvorfor (valgfritt, havner i beslutninger.md)
            <textarea
              value={hvorfor}
              onChange={(e) => setHvorfor(e.target.value)}
              rows={3}
              className="block w-full bg-black border-2 border-(--neon-green)/60 p-2"
            />
          </label>
          <button
            type="button"
            onClick={lagre}
            disabled={valgt === null}
            className="min-h-11 px-4 border-2 border-(--gold) disabled:opacity-40"
          >
            Lagre svar (Enter)
          </button>
          {feil && <p className="text-(--christmas-red)">{feil}</p>}
        </>
      )}
      {nesteHref ? (
        <Link
          href={nesteHref}
          data-testid="neste"
          className="inline-block min-h-11 px-4 py-2 border-2 border-(--gold) text-(--gold)"
        >
          {neste!.type === "beslutning" ? "Neste beslutning" : "Neste i køen"} →
          (N)
        </Link>
      ) : (
        b.svar && <p>Ingen flere venter på deg.</p>
      )}
      <p className="text-base text-(--neon-green)/80">
        {b.svar
          ? "N eller Enter: neste"
          : `1–${b.valg.length} velg · Enter lagrer · ⇧Enter ny linje · N neste`}
      </p>
    </div>
  );
}
