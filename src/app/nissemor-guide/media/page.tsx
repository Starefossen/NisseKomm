"use client";

import { useCallback, useEffect, useState } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { LiveCam } from "@/components/windows/snofall-tv/LiveCam";
import {
  LANDSBY_EVENT_SECONDS,
  landsbyEventAllowed,
  type LandsbyEventKind,
} from "@/components/windows/snofall-tv/channels";
import { mediaUrl, type MediaStatus } from "@/lib/media";
import type {
  MediaVurderingItem,
  MediaVurderinger,
} from "@/app/api/media/vurdering/route";
import {
  dayRows,
  lookThrough,
  pathOf,
  REVIEW_GROUPS,
  reviewKind,
  sortReviewItems,
  type ItemStatus,
} from "./oversikt";

const TYPES: Record<string, string> = {
  mp4: "video/mp4",
  mp3: "audio/mpeg",
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

const ext = (p: string) => (p.split(".").pop() ?? "").toLowerCase();
const formatSize = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;
const box = "border-4 border-(--neon-green) bg-black p-4 mb-6";

function formatCreated(iso: string | undefined): string {
  if (!iso) return "–";
  return iso
    .replace("T", " ")
    .replace(/\.\d+Z$/, "")
    .replace("Z", "");
}

/** One row of media-inventar.json (assets/bin/inventar.py). */
interface Inventar {
  path: string;
  status: "current" | "stale" | "unknown" | "missing";
  reasons: string[];
  meta?: {
    generator?: string;
    created?: string;
    source?: {
      path?: string;
      section?: string;
      sha256?: string;
    };
  } | null;
}

const INVENTAR_LABEL: Record<Inventar["status"], [string, string]> = {
  current: ["[✓ Oppdatert]", "text-(--gold)"],
  stale: ["[!] Utdatert", "text-(--christmas-red)"],
  unknown: ["[?] Ukjent", "text-gray-400"],
  missing: ["[✗ Mangler]", "text-(--christmas-red)"],
};

function InlinePlayer({ path, missing }: { path: string; missing: boolean }) {
  const src = mediaUrl(path);
  const fileExt = ext(path);

  if (missing) {
    return (
      <div className="p-3 my-2 border border-(--christmas-red)/60 bg-(--christmas-red)/10 text-(--christmas-red) text-sm">
        Filen mangler på disk
      </div>
    );
  }

  if (fileExt === "mp4") {
    const poster = mediaUrl(path.replace(/\.mp4$/, ".jpg"));
    return (
      <div className="my-2 bg-black">
        <video
          src={src}
          poster={poster}
          controls
          preload="none"
          className="w-full max-h-72 border border-(--neon-green)/40 bg-black"
        />
      </div>
    );
  }

  if (fileExt === "mp3") {
    return (
      <div className="my-2">
        <audio src={src} controls preload="none" className="w-full min-h-11" />
      </div>
    );
  }

  return (
    <div className="my-2 flex justify-center bg-black/60 p-2 border border-(--neon-green)/40">
      {/* eslint-disable-next-line @next/next/no-img-element -- served from MEDIA_DIR */}
      <img src={src} alt={path} className="max-h-72 w-auto object-contain" />
    </div>
  );
}

function ReviewItemCard({
  file,
  inventar,
  vurdering,
  isSaving,
  onSaveVerdict,
  onUpload,
}: {
  file: MediaStatus;
  inventar?: Inventar;
  vurdering?: MediaVurderingItem;
  isSaving?: boolean;
  onSaveVerdict: (
    path: string,
    v: "godkjent" | "lag_paa_nytt" | null,
    note?: string,
  ) => void;
  onUpload: (path: string, file: File) => void;
}) {
  const missing = file.size === null;
  const statusKey = inventar
    ? inventar.status
    : missing
      ? "missing"
      : "unknown";
  const [label, colorClass] = INVENTAR_LABEL[statusKey];

  const currentVerdict = vurdering?.vurdering ?? null;
  const [note, setNote] = useState(vurdering?.notat ?? "");

  const handleVerdictClick = (targetVerdict: "godkjent" | "lag_paa_nytt") => {
    const nextVerdict = currentVerdict === targetVerdict ? null : targetVerdict;
    onSaveVerdict(file.path, nextVerdict, note);
  };

  const handleNoteBlur = () => {
    if (note !== (vurdering?.notat ?? "")) {
      onSaveVerdict(file.path, currentVerdict, note);
    }
  };

  return (
    <div className="border-2 border-(--neon-green) bg-black/90 p-3 mb-3 text-(--neon-green)">
      {/* Top row: Path & Inventory Status */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-(--neon-green)/30 pb-2">
        <span className="font-bold break-all text-base md:text-lg">
          {file.path}
        </span>
        <div className="flex items-center gap-3">
          <span
            className={missing ? "text-(--christmas-red)" : "text-(--gold)"}
          >
            {missing ? "MANGLER" : formatSize(file.size!)}
          </span>
          <span className={colorClass} title={inventar?.reasons.join("; ")}>
            {label}
          </span>
        </div>
      </div>

      {/* Reasons / Why */}
      {inventar?.reasons && inventar.reasons.length > 0 && (
        <div className="mt-1 text-xs md:text-sm text-(--cold-blue) break-words">
          Årsak: {inventar.reasons.join("; ")}
        </div>
      )}

      {/* Sidecar Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs md:text-sm text-(--neon-green)/80 bg-black/60 border border-(--neon-green)/20 p-2 my-2">
        <div>
          <span className="text-(--neon-green)/50">Generator: </span>
          <span className="break-all">{inventar?.meta?.generator || "–"}</span>
        </div>
        <div>
          <span className="text-(--neon-green)/50">Opprettet: </span>
          <span>{formatCreated(inventar?.meta?.created)}</span>
        </div>
        <div>
          <span className="text-(--neon-green)/50">Kildeseksjon: </span>
          <span className="break-all">
            {inventar?.meta?.source?.section ||
              inventar?.meta?.source?.path ||
              "–"}
          </span>
        </div>
      </div>

      {/* Inline Player */}
      <InlinePlayer path={file.path} missing={missing} />

      {/* Actions: Verdict Buttons, Note, Upload */}
      <div className="mt-3 pt-2 border-t border-(--neon-green)/30 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Godkjent button */}
          <button
            type="button"
            onClick={() => handleVerdictClick("godkjent")}
            disabled={isSaving}
            className={`min-h-11 min-w-28 px-4 py-2 font-bold cursor-pointer transition-colors border-2 ${
              currentVerdict === "godkjent"
                ? "bg-(--gold) text-black border-(--gold)"
                : "border-(--neon-green) text-(--neon-green) hover:bg-(--neon-green)/20"
            }`}
          >
            {currentVerdict === "godkjent" ? "[✓] Godkjent" : "Godkjent"}
          </button>

          {/* Lag på nytt button */}
          <button
            type="button"
            onClick={() => handleVerdictClick("lag_paa_nytt")}
            disabled={isSaving}
            className={`min-h-11 min-w-28 px-4 py-2 font-bold cursor-pointer transition-colors border-2 ${
              currentVerdict === "lag_paa_nytt"
                ? "bg-(--christmas-red) text-white border-(--christmas-red)"
                : "border-(--neon-green) text-(--neon-green) hover:bg-(--neon-green)/20"
            }`}
          >
            {currentVerdict === "lag_paa_nytt"
              ? "[!] Lag på nytt"
              : "Lag på nytt"}
          </button>

          {currentVerdict && (
            <button
              type="button"
              onClick={() => onSaveVerdict(file.path, null, note)}
              disabled={isSaving}
              className="min-h-11 px-3 py-2 text-sm text-(--neon-green)/70 underline cursor-pointer hover:text-(--neon-green)"
            >
              Fjern valg
            </button>
          )}

          {isSaving && (
            <span className="text-sm text-(--gold) animate-pulse ml-auto">
              Lagrer...
            </span>
          )}

          <label className="min-h-11 flex items-center cursor-pointer underline ml-auto text-sm">
            {missing ? "Last opp fil" : "Erstatt fil"}
            <input
              type="file"
              accept={TYPES[ext(file.path)]}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(file.path, f);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {/* Short Note field */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center mt-1">
          <input
            type="text"
            value={note}
            placeholder="Kort notat..."
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSaveVerdict(file.path, currentVerdict, note);
              }
            }}
            className="w-full min-h-11 bg-black border-2 border-(--neon-green) px-3 text-sm text-(--neon-green) focus:outline-none focus:border-(--gold)"
          />
          <button
            type="button"
            onClick={() => onSaveVerdict(file.path, currentVerdict, note)}
            disabled={isSaving}
            className="min-h-11 min-w-28 px-4 py-2 border-2 border-(--neon-green) hover:bg-(--neon-green)/20 text-sm font-bold cursor-pointer"
          >
            Lagre notat
          </button>
        </div>
      </div>
    </div>
  );
}

function Status({ item }: { item: ItemStatus | null }) {
  if (!item) return <span className="text-gray-500">–</span>;
  return (
    <span
      className={item.ok ? "text-(--gold)" : "text-(--christmas-red)"}
      title={item.files.join(", ")}
    >
      {item.ok ? "✓" : "✗"} {item.label}
    </span>
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
  const [files, setFiles] = useState<MediaStatus[] | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [message, setMessage] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [onlyUnrated, setOnlyUnrated] = useState(false);
  const [inventar, setInventar] = useState<Map<string, Inventar>>(new Map());
  const [vurderinger, setVurderinger] = useState<MediaVurderinger>({});
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const [resMedia, resInv, resVurd] = await Promise.all([
        fetch("/api/media"),
        fetch("/api/media/inventar"),
        fetch("/api/media/vurdering"),
      ]);

      if (!resMedia.ok) {
        setUnavailable(true);
        return;
      }
      setFiles(await resMedia.json());

      if (resInv.ok) {
        const rows: Inventar[] = await resInv.json();
        setInventar(new Map(rows.map((r) => [r.path, r])));
      }

      if (resVurd.ok) {
        const v: MediaVurderinger = await resVurd.json();
        setVurderinger(v);
      }
    } catch {
      setUnavailable(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    load();
  }, [load]);

  const upload = async (path: string, file: File) => {
    setMessage(`Laster opp ${path} ...`);
    const res = await fetch(
      "/api/media/" + path.split("/").map(encodeURIComponent).join("/"),
      {
        method: "PUT",
        headers: { "Content-Type": TYPES[ext(path)] },
        body: file,
      },
    );
    setMessage(res.ok ? `Lastet opp ${path}` : `Feil: ${await res.text()}`);
    load();
  };

  const handleSaveVerdict = async (
    path: string,
    v: "godkjent" | "lag_paa_nytt" | null,
    note?: string,
  ) => {
    setSavingMap((prev) => ({ ...prev, [path]: true }));
    try {
      const res = await fetch("/api/media/vurdering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, vurdering: v, notat: note }),
      });
      if (res.ok) {
        const data = await res.json();
        setVurderinger((prev) => {
          const next = { ...prev };
          if (!data.entry) {
            delete next[path];
          } else {
            next[path] = data.entry;
          }
          return next;
        });
        setMessage(`Lagret vurdering for ${path}`);
      } else {
        setMessage(`Feil ved lagring: ${await res.text()}`);
      }
    } catch {
      setMessage("Nettverksfeil ved lagring");
    } finally {
      setSavingMap((prev) => ({ ...prev, [path]: false }));
    }
  };

  const missing = files?.filter((f) => f.size === null).length ?? 0;
  const present = files
    ? new Set(files.filter((f) => f.size !== null).map((f) => f.path))
    : null;

  const totalFiles = files?.length ?? 0;
  const totalGodkjent =
    files?.filter((f) => vurderinger[f.path]?.vurdering === "godkjent")
      .length ?? 0;
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
                <span className="text-(--gold)">{totalGodkjent} godkjent</span>
                <span>·</span>
                <span className="text-(--christmas-red)">
                  {totalLagPaaNytt} lag på nytt
                </span>
                <span>·</span>
                <span className="text-gray-400">
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
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <tbody>
                  {dayRows(files).map((r) => (
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

        {/* Filter Controls */}
        {files && (
          <div className="flex flex-wrap items-center gap-6 mb-6 p-4 border-2 border-(--neon-green) bg-black">
            <label className="flex items-center gap-3 min-h-11 text-base sm:text-lg cursor-pointer">
              <input
                type="checkbox"
                checked={onlyUnrated}
                onChange={(e) => setOnlyUnrated(e.target.checked)}
                className="w-5 h-5 accent-(--neon-green)"
              />
              Vis bare det som mangler vurdering
            </label>
            <label className="flex items-center gap-3 min-h-11 text-base sm:text-lg cursor-pointer">
              <input
                type="checkbox"
                checked={onlyMissing}
                onChange={(e) => setOnlyMissing(e.target.checked)}
                className="w-5 h-5 accent-(--neon-green)"
              />
              Vis bare filer som mangler
            </label>
          </div>
        )}

        {/* Review Groups */}
        {files &&
          REVIEW_GROUPS.map((g) => {
            const allInGroup = sortReviewItems(
              files.filter((f) => reviewKind(f.path) === g.id),
              g.id,
            );

            let shown = allInGroup;
            if (onlyMissing) {
              shown = shown.filter((f) => f.size === null);
            }
            if (onlyUnrated) {
              shown = shown.filter((f) => !vurderinger[f.path]?.vurdering);
            }

            const godkjentCount = allInGroup.filter(
              (f) => vurderinger[f.path]?.vurdering === "godkjent",
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
                      {godkjentCount} godkjent
                    </span>
                    <span>·</span>
                    <span className="text-(--christmas-red)">
                      {lagPaaNyttCount} lag på nytt
                    </span>
                    <span>·</span>
                    <span className="text-gray-400">
                      {manglerCount} mangler
                    </span>
                    <span className="text-(--neon-green)/70">
                      (viser {shown.length} av {allInGroup.length})
                    </span>
                  </div>
                </div>

                {shown.length === 0 ? (
                  <p className="text-gray-400 text-sm py-4 text-center">
                    Ingen elementer matcher gjeldende filtre i denne gruppen.
                  </p>
                ) : (
                  <div>
                    {shown.map((f) => (
                      <ReviewItemCard
                        key={`${f.path}-${vurderinger[f.path]?.oppdatert ?? ""}`}
                        file={f}
                        inventar={inventar.get(f.path)}
                        vurdering={vurderinger[f.path]}
                        isSaving={savingMap[f.path]}
                        onSaveVerdict={handleSaveVerdict}
                        onUpload={upload}
                      />
                    ))}
                  </div>
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
