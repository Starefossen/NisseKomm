"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { GameEngine } from "@/lib/game-engine";
import { MediaListe, useMediaData } from "../media/kort";
import { useVisVurdering } from "../vurdering";
import type { bibliotek } from "@/lib/guide-innhold";

type Entitet = Awaited<ReturnType<typeof bibliotek>>[number];

const TYPENAVN: Record<Entitet["type"], string> = {
  characters: "Karakterer",
  locations: "Steder",
  objects: "Gjenstander",
};

function EntitetKort({
  e,
  media,
}: {
  e: Entitet;
  media: ReturnType<typeof useMediaData>;
}) {
  const ut = e.medier.flatMap((m) => (m.ut ? [m.ut] : []));
  const visVurdering = useVisVurdering();
  return (
    <details
      id={e.id}
      className="border-2 border-(--neon-green) bg-black mb-3 scroll-mt-4"
    >
      <summary className="min-h-11 flex items-center px-3 cursor-pointer text-xl">
        {e.navn}
        <span className="ml-auto text-sm text-(--neon-green)/80">
          {e.bilder.length} bilder · {e.medier.length} medier
        </span>
      </summary>
      <div className="p-3 space-y-3">
        {e.beskrivelse && (
          <p className="whitespace-pre-wrap">{e.beskrivelse}</p>
        )}
        {e.bilder.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {e.bilder.map((b) => (
              <figure key={b}>
                {/* eslint-disable-next-line @next/next/no-img-element -- parent-only route */}
                <img
                  src={`/api/guide/fil/${e.type}/${e.id}/${encodeURIComponent(b)}`}
                  alt={`${e.navn}: ${b}`}
                  loading="lazy"
                  className="w-full border border-(--neon-green)/40"
                />
                <figcaption className="text-sm break-all">{b}</figcaption>
              </figure>
            ))}
          </div>
        )}
        <details>
          <summary className="min-h-11 flex items-center cursor-pointer text-(--gold)">
            entitet.md
          </summary>
          <pre className="whitespace-pre-wrap text-sm">{e.entitet}</pre>
        </details>
        <h3 className="text-(--gold)">Brukt av</h3>
        {e.medier.length === 0 && <p>Ingen medier.</p>}
        <ul className="text-sm">
          {e.medier.map((m) => (
            <li key={m.jobb}>
              {m.jobb}
              {m.ut && ` → ${m.ut}`}
            </li>
          ))}
        </ul>
        {visVurdering && ut.length > 0 && (
          <details>
            <summary className="min-h-11 flex items-center cursor-pointer text-(--gold)">
              Vis medier med status
            </summary>
            <MediaListe paths={ut} data={media} />
          </details>
        )}
        <Link
          href="/nissemor-guide/media"
          className="inline-flex items-center min-h-11 underline"
        >
          Til Filer
        </Link>
      </div>
    </details>
  );
}

const SIDER = [
  ["/nissemor-guide/gjennomganger", "Gjennomganger (rapportene)"],
  ["/nissemor-guide/printout", "Utskrifter"],
  ["/nissemor-guide/media", "Filer"],
  ["/nissemor-guide/brevfugler", "Brev fra barna"],
  ["/nissemor-guide/symboler", "Symbolkort med QR-koder"],
  ["/nissemor-guide/forberedelser", "Forberedelser og handleliste"],
] as const;

function Merker() {
  const tjent = new Set(GameEngine.getEarnedBadges().map((b) => b.badgeId));
  return (
    <section id="merker" className="mb-6 scroll-mt-4">
      <h2 className="text-2xl text-(--gold) mb-2">Merker</h2>
      <ul>
        {GameEngine.getAllBadges().map((b) => (
          <li key={b.id} className="mb-2">
            <span className={tjent.has(b.id) ? "text-(--gold)" : ""}>
              {tjent.has(b.id) ? "✓ " : "☐ "}
              {b.navn}
            </span>
            : {b.beskrivelse}
          </li>
        ))}
      </ul>
    </section>
  );
}

function BibliotekInnhold() {
  const visVurdering = useVisVurdering();
  const [liste, setListe] = useState<Entitet[] | null>(null);
  const [feil, setFeil] = useState(false);
  const media = useMediaData();

  useEffect(() => {
    fetch("/api/guide/bibliotek")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setListe)
      .catch(() => setFeil(true));
  }, []);

  // An anchor from search opens its entry.
  useEffect(() => {
    const aapne = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const el = id && document.getElementById(id);
      if (!el) return;
      if (el instanceof HTMLDetailsElement) el.open = true;
      el.scrollIntoView();
    };
    aapne();
    window.addEventListener("hashchange", aapne);
    return () => window.removeEventListener("hashchange", aapne);
  }, [liste]);

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-retro p-3 sm:p-4 md:p-8">
      <GuideNavigation />
      <div className="max-w-4xl mx-auto text-lg">
        <h1 className="text-3xl mb-4">Bibliotek</h1>
        {visVurdering && (
          <Link
            href="/nissemor-guide/gjennomgang"
            className="flex items-center min-h-11 px-3 mb-2 border-4 border-(--gold) text-(--gold) text-2xl hover:bg-(--gold)/20"
          >
            Gjennomgang: hele sesongen, celle for celle
          </Link>
        )}
        <ul className="grid sm:grid-cols-2 gap-2 mb-6">
          {SIDER.map(([href, navn]) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center min-h-11 px-3 border-2 border-(--neon-green) hover:bg-(--neon-green)/20"
              >
                {navn}
              </Link>
            </li>
          ))}
        </ul>
        <Merker />
        {feil && <p className="text-(--christmas-red)">Kunne ikke laste.</p>}
        {!liste && !feil && <p>Laster …</p>}
        {liste &&
          (Object.keys(TYPENAVN) as Entitet["type"][]).map((type) => (
            <section key={type} className="mb-6">
              <h2 className="text-2xl text-(--gold) mb-2">{TYPENAVN[type]}</h2>
              {liste
                .filter((e) => e.type === type)
                .map((e) => (
                  <EntitetKort key={e.id} e={e} media={media} />
                ))}
            </section>
          ))}
      </div>
    </div>
  );
}

export default function BibliotekSide() {
  return (
    <GuideAuth>
      <BibliotekInnhold />
    </GuideAuth>
  );
}
