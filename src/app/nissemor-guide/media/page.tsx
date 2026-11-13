"use client";

import { useState } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { LiveCam } from "@/components/windows/snofall-tv/LiveCam";
import {
  LANDSBY_EVENT_SECONDS,
  landsbyEventAllowed,
  type LandsbyEventKind,
} from "@/components/windows/snofall-tv/channels";
import {
  groupVersions,
  lookThrough,
  pathOf,
  REVIEW_GROUPS,
  reviewKind,
  sortReviewItems,
} from "./oversikt";
import { MediaListe, kilde } from "./kort";
import Link from "next/link";
import type { Sesong } from "../_kveld/felles";
import {
  StatusBrikke,
  useCelle,
  useData,
  useKo,
  type Data,
} from "../gjennomgang/celle";
import { alleElementer } from "../gjennomgang/elementer";
import { Fremdriftslinjer } from "../gjennomgang/fremdrift";
import { familie, versionKey } from "@/lib/media-status";
import { radAv, synlig } from "./filter";
import { FilterLinje, useFilter } from "./FilterLinje";

const SIDE = 50;
const box = "border-4 border-(--neon-green) bg-black p-4 mb-6";

function Gjennomsyn({ present }: { present: Set<string> | null }) {
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(12);
  const [solved, setSolved] = useState(false);
  const [shown, setShown] = useState<{
    kind: LandsbyEventKind;
    at: number;
  } | null>(null);
  const views = lookThrough(day, hour, solved);
  const eventAt = () => {
    if (!shown || !landsbyEventAllowed(shown.kind, day, solved)) return null;
    const progress =
      (performance.now() - shown.at) /
      (LANDSBY_EVENT_SECONDS[shown.kind] * 1000);
    return progress < 1 ? { kind: shown.kind, progress } : null;
  };
  return (
    <section id="gjennomsyn" className={box}>
      <h2 className="text-2xl mb-3">Snøfall TV-gjennomsyn</h2>
      <div className="flex flex-wrap items-center gap-6 mb-4 text-lg">
        <label className="flex items-center gap-2 min-h-11">
          Dag
          <select
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="bg-black border-2 border-(--neon-green) min-h-11 px-2 text-(--neon-green)"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 min-h-11">
          Klokka
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="bg-black border-2 border-(--neon-green) min-h-11 px-2 text-(--neon-green)"
          >
            <option value={8}>08 (morgen)</option>
            <option value={12}>12 (dag)</option>
            <option value={16}>16 (skumring)</option>
            <option value={21}>21 (natt)</option>
          </select>
        </label>
        <label className="flex items-center gap-2 min-h-11">
          <input
            type="checkbox"
            checked={solved}
            onChange={(e) => setSolved(e.target.checked)}
            className="w-5 h-5 accent-(--neon-green)"
          />
          Koden er løst
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {views.map((v) => {
          const file = v.src && pathOf(v.src);
          const missing = file && present && !present.has(file);
          const village = v.src?.endsWith("landsby-rolig.mp4");
          return (
            <figure key={v.key}>
              <div className="aspect-video border-2 border-(--neon-green)">
                <LiveCam
                  key={`${v.key}-${day}-${hour}-${solved}`}
                  src={v.src}
                  fallback={v.fallback}
                  label={v.label}
                  {...v.fx}
                  eventAt={village ? eventAt : undefined}
                />
              </div>
              {village && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {(
                    [
                      ["brevfugler", "Brevfugler"],
                      ["tarnklokke", "Tårnklokka"],
                      ["blafugl", "Blå fugl"],
                      ["luciatog", "Luciatog"],
                    ] as const
                  ).map(([kind, name]) => (
                    <button
                      key={kind}
                      onClick={() => setShown({ kind, at: performance.now() })}
                      disabled={!landsbyEventAllowed(kind, day, solved)}
                      className="min-h-11 px-2 border-2 border-(--neon-green) disabled:border-(--gray) disabled:text-(--gray) cursor-pointer disabled:cursor-not-allowed"
                    >
                      Vis hendelse: {name}
                    </button>
                  ))}
                </div>
              )}
              <figcaption className="text-sm mt-1 break-all">
                {file ?? "ingen bærebølge"}
                {missing && (
                  <span className="text-(--christmas-red)"> · MANGLER</span>
                )}
                {v.intercept && (
                  <span className="block text-(--cold-blue)">
                    «{v.intercept}»
                  </span>
                )}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

function MediaContent() {
  const d = useData();
  const media = d.media;
  const { files, unavailable, message, upload } = media;
  const missing = files?.filter((f) => f.size === null).length ?? 0;
  const present = files
    ? new Set(files.filter((f) => f.size !== null).map((f) => f.path))
    : null;

  const [filter, settFilterRå] = useFilter();
  // Every card carries a player: render a page at a time per group.
  const [antallVist, settAntallVist] = useState<Record<string, number>>({});
  const settFilter = (f: Parameters<typeof settFilterRå>[0]) => {
    settAntallVist({});
    settFilterRå(f);
  };
  const k = kilde(media);
  const grupper = REVIEW_GROUPS.map((g) => ({
    g,
    versions: groupVersions(
      sortReviewItems(
        (files ?? []).filter((f) => reviewKind(f.path) === g.id),
        g.id,
      ),
    ).map((v) => ({ ...v, rad: radAv(familie(v.key, k)) })),
  }));
  const alleRader = grupper.flatMap((x) => x.versions.map((v) => v.rad));

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-retro p-3 sm:p-4 md:p-8">
      <GuideNavigation />
      <div className="max-w-6xl mx-auto">
        <div className="border-4 sm:border-8 border-(--neon-green) bg-black p-4 sm:p-6 mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wider text-center">
            FILER
          </h1>
          {files && (
            <p className="mt-2 text-base sm:text-lg text-center">
              {files.length - missing} av {files.length} filer på plass
            </p>
          )}
          {d.sesong && <Fremdrift d={d} sesong={d.sesong} />}
          <Link
            href="/nissemor-guide/gjennomgang?vis=oversikt"
            className="underline text-(--gold) min-h-11 inline-flex items-center"
          >
            Se Oversikt i Gjennomgang →
          </Link>
        </div>

        {unavailable && (
          <p className="text-lg text-(--christmas-red) mb-4">
            Opplasting er bare tilgjengelig på hjemmenettet (LAN-modus).
          </p>
        )}
        {message && <p className="text-lg text-(--gold) mb-4">{message}</p>}

        <Gjennomsyn present={present} />

        {files && (
          <FilterLinje f={filter} sett={settFilter} rader={alleRader} />
        )}

        {files &&
          grupper.map(({ g, versions }) => {
            const shown = versions.filter((v) =>
              synlig(v.rad, filter, v.key, new Set()),
            );
            if (!shown.length && g.id !== "music") return null;
            return (
              <section key={g.id} className={box}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4 border-b-2 border-(--neon-green) pb-2">
                  <h2 className="text-2xl font-bold">{g.title}</h2>
                  <span className="text-(--neon-green)/70">
                    viser {shown.length} av {versions.length}
                  </span>
                </div>
                {shown.length === 0 ? (
                  <p className="text-(--neon-green)/80 text-sm py-4 text-center">
                    Ingen filer matcher gjeldende filtre i denne gruppen.
                  </p>
                ) : (
                  <>
                    {d.sesong ? (
                      <MedStatus
                        d={d}
                        sesong={d.sesong}
                        paths={shown
                          .slice(0, antallVist[g.id] ?? SIDE)
                          .map((v) => v.key)}
                      />
                    ) : null}
                    {shown.length > (antallVist[g.id] ?? SIDE) && (
                      <button
                        type="button"
                        onClick={() =>
                          settAntallVist({
                            ...antallVist,
                            [g.id]: (antallVist[g.id] ?? SIDE) + SIDE,
                          })
                        }
                        className="min-h-11 px-3 border-2 border-(--neon-green) cursor-pointer text-lg hover:bg-(--neon-green)/20"
                      >
                        Vis {SIDE} til (
                        {shown.length - (antallVist[g.id] ?? SIDE)} skjult)
                      </button>
                    )}
                  </>
                )}

                {g.id === "music" && (
                  <label className="mt-4 min-h-11 flex items-center cursor-pointer underline text-base">
                    Last opp nytt spor (MP3, maks 20 MB)
                    <input
                      type="file"
                      accept="audio/mpeg,.mp3"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) upload(`music/${f.name}`, f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </section>
            );
          })}
      </div>
    </div>
  );
}

/** Gjennomgang's progress bar: Filer has no status count of its own. */
function Fremdrift({ d, sesong }: { d: Data; sesong: Sesong }) {
  const { fd } = useKo(d, sesong);
  if (!fd) return <p>Laster status …</p>;
  return (
    <Fremdriftslinjer
      total={fd.total}
      typer={fd.typer}
      side="/nissemor-guide/gjennomgang"
    />
  );
}

/** Cards with the same status cell as Gjennomgang's matrix. */
function MedStatus({
  d,
  sesong,
  paths,
}: {
  d: Data;
  sesong: Sesong;
  paths: string[];
}) {
  const data = useCelle(d, sesong);
  const liste = alleElementer("dag", sesong, d.media.files, d.krypto);
  const status = (key: string) => {
    const e = liste.find((x) =>
      [x.id, ...x.media].some((m) => versionKey(m) === key),
    );
    return e ? (
      <StatusBrikke
        c={data(e)}
        href={`/nissemor-guide/gjennomgang?id=${encodeURIComponent(e.id)}`}
      />
    ) : null;
  };
  return (
    <MediaListe paths={paths} data={d.media} melding={false} status={status} />
  );
}

export default function MediaPage() {
  return (
    <GuideAuth>
      <MediaContent />
    </GuideAuth>
  );
}
