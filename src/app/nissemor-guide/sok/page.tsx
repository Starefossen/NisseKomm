"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import type { Treff } from "@/lib/guide-innhold";

function SokInnhold() {
  const [q, setQ] = useState("");
  const [treff, setTreff] = useState<Treff[] | null>(null);
  const [feil, setFeil] = useState(false);

  const sok = async (e: FormEvent) => {
    e.preventDefault();
    setFeil(false);
    const res = await fetch(`/api/guide/sok?q=${encodeURIComponent(q)}`).catch(
      () => null,
    );
    if (!res?.ok) return setFeil(true);
    setTreff(await res.json());
  };

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-retro p-3 sm:p-4 md:p-8">
      <GuideNavigation />
      <div className="max-w-4xl mx-auto text-lg">
        <h1 className="text-3xl mb-4">Søk</h1>
        <form onSubmit={sok} className="flex gap-2 mb-4">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Manus, apptekster, Ugleposten, bibliotek"
            aria-label="Søkeord"
            autoFocus
            className="flex-1 min-h-11 bg-black border-2 border-(--neon-green) px-3 focus:outline-none focus:border-(--gold)"
          />
          <button
            type="submit"
            className="min-h-11 px-4 border-2 border-(--neon-green) hover:bg-(--neon-green)/20"
          >
            Søk
          </button>
        </form>
        {feil && <p className="text-(--christmas-red)">Søket feilet.</p>}
        {treff && treff.length === 0 && (
          <p className="mb-2">
            Ingen treff. Prøv et kortere ord, for eksempel et navn eller en
            gjenstand.
          </p>
        )}
        {treff && treff.length > 0 && (
          <p className="mb-2 text-sm">
            {treff.length} treff{treff.length >= 60 && " (viser de første)"}
          </p>
        )}
        <ul className="space-y-2">
          {treff?.map((t, i) => (
            <li key={i}>
              <Link
                href={t.lenke}
                className="block border-2 border-(--neon-green) bg-black p-3 hover:bg-(--neon-green)/10"
              >
                <span className="block text-sm text-(--gold)">{t.kilde}</span>
                <span className="whitespace-pre-wrap break-words">
                  {t.foer}
                  <mark className="bg-(--gold) text-black">{t.treff}</mark>
                  {t.etter}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function SokSide() {
  return (
    <GuideAuth>
      <SokInnhold />
    </GuideAuth>
  );
}
