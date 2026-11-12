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
  dayRows,
  groupVersions,
  lookThrough,
  pathOf,
  REVIEW_GROUPS,
  reviewKind,
  sortReviewItems,
  type CellState,
  type ItemStatus,
} from "./oversikt";
import { MediaListe, kilde, useMediaData } from "./kort";
import {
  brukbar,
  celleAv,
  familie,
  FORKLARING,
  MERKE,
} from "@/lib/media-status";
import { passer, radAv } from "./filter";
import { FilterLinje, useFilter } from "./FilterLinje";

const SIDE = 50;
const box = "border-4 border-(--neon-green) bg-black p-4 mb-6";

const CELL: Record<CellState, [string, string, string]> = {
  ...MERKE,
  kode: ["·", "text-(--neon-green)/70", "kode"],
};

function Status({ item }: { item: ItemStatus | null }) {
  if (!item) return <span className="text-(--neon-green)/80">–</span>;
  const [mark, color, name] = CELL[item.state];
  const k = item.kandidat;
  return (
    <span
      className={color}
      title={[
        `gjeldende versjon: ${name}`,
        item.note,
        k && `${k.navn}: ${MERKE[k.celle][2]}`,
        item.files.join(", "),
      ]
        .filter(Boolean)
        .join(" · ")}
    >
      {mark} {item.label}
      {k && (
        <span className={MERKE[k.celle][1]}>
          {" "}
          → {k.navn} {MERKE[k.celle][0]}
        </span>
      )}
    </span>
  );
}

/** «Julius: 3 godkjent · 9 ikke vurdert · 12 mangler» for one column. */
function Antall({ name, items }: { name: string; items: ItemStatus[] }) {
  const parts = (Object.keys(CELL) as CellState[])
    .filter((k) => k !== "kode")
    .map((k) => [k, items.filter((i) => i.state === k).length] as const)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${CELL[k][2]}`);
  return (
    <p>
      {name}: {parts.join(" · ")}
    </p>
  );
}

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
  const media = useMediaData();
  const { files, unavailable, message, inventar, vurderinger, upload } = media;

  const missing = files?.filter((f) => f.size === null).length ?? 0;
  const present = files
    ? new Set(files.filter((f) => f.size !== null).map((f) => f.path))
    : null;

  const [filter, settFilterRå] = useFilter();
  // Every card carries players and review controls: render a page at a time per group.
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

  const rows = files ? dayRows(files, { vurderinger, inventar }) : [];
  const totalFiles = files?.length ?? 0;
  const totalGodkjent =
    files?.filter((f) => brukbar(celleAv(vurderinger[f.path]))).length ?? 0;
  const totalLagPaaNytt =
    files?.filter((f) => vurderinger[f.path]?.vurdering === "lag_paa_nytt")
      .length ?? 0;
  const totalManglerVurdering = totalFiles - totalGodkjent - totalLagPaaNytt;

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-retro p-3 sm:p-4 md:p-8">
      <GuideNavigation />
      <div className="max-w-6xl mx-auto">
        {/* Header Summary */}
        <div className="border-4 sm:border-8 border-(--neon-green) bg-black p-4 sm:p-6 mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wider">
            MEDIEGJENNOMGANG
          </h1>
          {files && (
            <div className="mt-2 text-base sm:text-lg">
              <p>
                {files.length - missing} av {files.length} filer på plass
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-1 text-sm sm:text-base">
                <span className="text-(--gold)">
                  {totalGodkjent} godkjent/OK
                </span>
                <span>·</span>
                <span className="text-(--christmas-red)">
                  {totalLagPaaNytt} lag på nytt
                </span>
                <span>·</span>
                <span className="text-(--neon-green)/80">
                  {totalManglerVurdering} mangler vurdering
                </span>
              </div>
            </div>
          )}
        </div>

        {unavailable && (
          <p className="text-lg text-(--christmas-red) mb-4">
            Opplasting og vurdering er bare tilgjengelig på hjemmenettet
            (LAN-modus).
          </p>
        )}
        {message && <p className="text-lg text-(--gold) mb-4">{message}</p>}

        {/* Per Day Table */}
        {files && (
          <section className={box}>
            <h2 className="text-2xl mb-3">Status per dag</h2>
            <p className="text-sm mb-2 flex flex-wrap gap-x-4">
              {(Object.keys(CELL) as CellState[])
                .filter((k) => k !== "kode")
                .map((k) => (
                  <span key={k} className={CELL[k][1]}>
                    {CELL[k][0]} {CELL[k][2]}
                  </span>
                ))}
            </p>
            <p className="text-sm mb-2 text-(--neon-green)/80">{FORKLARING}</p>
            <div className="text-sm mb-3 text-(--neon-green)/80">
              <Antall name="Julius" items={rows.map((r) => r.julius)} />
              <Antall
                name="Rampenissen"
                items={rows.map((r) => r.rampenissen)}
              />
              <Antall
                name="TV"
                items={rows.flatMap((r) => (r.tv ? [r.tv] : []))}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.day}
                      className="border-b border-(--neon-green)/30"
                    >
                      <th className="pr-4 py-1 whitespace-nowrap">
                        Dag {r.day}
                      </th>
                      <td className="pr-4">
                        <Status item={r.julius} />
                      </td>
                      <td className="pr-4">
                        <Status item={r.rampenissen} />
                      </td>
                      <td>
                        <Status item={r.tv} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TV Gjennomsyn */}
        <Gjennomsyn present={present} />

        {files && (
          <FilterLinje f={filter} sett={settFilter} rader={alleRader} />
        )}

        {/* Review Groups */}
        {files &&
          grupper.map(({ g, versions }) => {
            // one card per item: the newest file, older versions folded below
            const allInGroup = versions.map((v) => v.newest);

            const shown = versions.filter((v) => passer(v.rad, filter));
            if (!shown.length && g.id !== "music") return null;

            const godkjentCount = allInGroup.filter((f) =>
              brukbar(celleAv(vurderinger[f.path])),
            ).length;
            const lagPaaNyttCount = allInGroup.filter(
              (f) => vurderinger[f.path]?.vurdering === "lag_paa_nytt",
            ).length;
            const manglerCount =
              allInGroup.length - godkjentCount - lagPaaNyttCount;

            return (
              <section key={g.id} className={box}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4 border-b-2 border-(--neon-green) pb-2">
                  <h2 className="text-2xl font-bold">{g.title}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
                    <span className="text-(--gold)">
                      {godkjentCount} godkjent/OK
                    </span>
                    <span>·</span>
                    <span className="text-(--christmas-red)">
                      {lagPaaNyttCount} lag på nytt
                    </span>
                    <span>·</span>
                    <span className="text-(--neon-green)/80">
                      {manglerCount} mangler
                    </span>
                    <span className="text-(--neon-green)/70">
                      (viser {shown.length} av {allInGroup.length})
                    </span>
                  </div>
                </div>

                {shown.length === 0 ? (
                  <p className="text-(--neon-green)/80 text-sm py-4 text-center">
                    Ingen elementer matcher gjeldende filtre i denne gruppen.
                  </p>
                ) : (
                  <>
                    <MediaListe
                      paths={shown
                        .slice(0, antallVist[g.id] ?? SIDE)
                        .map((v) => v.key)}
                      data={media}
                      melding={false}
                    />
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

export default function MediaPage() {
  return (
    <GuideAuth>
      <MediaContent />
    </GuideAuth>
  );
}
