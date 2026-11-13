"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Beslutning } from "@/lib/beslutninger";

const SIDE = "/nissemor-guide/gjennomgang";
const knapp =
  "min-h-11 px-3 py-2 border-2 text-left w-full hover:bg-(--neon-green)/20";

/** One open choice: 1–4 picks an option, Enter saves with the optional «hvorfor». */
export function BeslutningVisning({ id }: { id: string }) {
  const slug = id.replace(/^beslutning\//, "");
  const [b, setB] = useState<Beslutning | null | "mangler">(null);
  const [valgt, setValgt] = useState<number | null>(null);
  const [hvorfor, setHvorfor] = useState("");
  const [feil, setFeil] = useState("");

  useEffect(() => {
    fetch("/api/beslutninger")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((alle: Beslutning[]) =>
        setB(alle.find((x) => x.slug === slug) ?? "mangler"),
      )
      .catch(() => setB("mangler"));
  }, [slug]);

  const lagre = async () => {
    if (valgt === null || !b || b === "mangler" || b.svar) return;
    const r = await fetch("/api/beslutninger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, valg: valgt, hvorfor }),
    });
    if (!r.ok) return setFeil(await r.text());
    setB((await r.json()).beslutning);
    setFeil("");
  };

  useEffect(() => {
    const ned = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey || !b || b === "mangler")
        return;
      const iTekst = (ev.target as HTMLElement).tagName === "TEXTAREA";
      const n = Number(ev.key);
      if (!iTekst && n >= 1 && n <= b.valg.length) setValgt(n - 1);
      else if (ev.key === "Enter" && !ev.shiftKey) void lagre();
      else return;
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
      <p className="text-base text-(--neon-green)/80">
        1–{b.valg.length} velg · Enter lagrer · ⇧Enter ny linje
      </p>
    </div>
  );
}
