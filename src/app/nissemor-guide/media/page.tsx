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
import {
  MEDIA_GROUPS,
  mediaGroup,
  mediaUrl,
  type MediaStatus,
} from "@/lib/media";
import { dayRows, lookThrough, pathOf, type ItemStatus } from "./oversikt";

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

function Preview({ path }: { path: string }) {
  const src = mediaUrl(path);
  if (ext(path) === "mp4")
    return (
      <video
        src={src}
        controls
        preload="metadata"
        className="w-full max-h-80"
      />
    );
  if (ext(path) === "mp3")
    return <audio src={src} controls preload="metadata" className="w-full" />;
  // eslint-disable-next-line @next/next/no-img-element -- served from MEDIA_DIR, not optimisable
  return <img src={src} alt={path} className="max-h-80" />;
}

/** One row of media-inventar.json (assets/bin/inventar.py). */
interface Inventar {
  path: string;
  status: "current" | "stale" | "unknown" | "missing";
  reasons: string[];
}

const INVENTAR_LABEL: Record<Inventar["status"], [string, string]> = {
  current: ["✓ oppdatert", "text-(--gold)"],
  stale: ["! utdatert", "text-(--christmas-red)"],
  unknown: ["? ukjent", "text-gray-400"],
  missing: ["✗ mangler", "text-(--christmas-red)"],
};

function FileRow({
  file,
  inventar,
  onUpload,
}: {
  file: MediaStatus;
  inventar?: Inventar;
  onUpload: (path: string, file: File) => void;
}) {
  const missing = file.size === null;
  return (
    <li className="border-2 border-(--neon-green) p-2">
      <div className="flex flex-wrap items-center gap-4">
        <span className={missing ? "text-(--christmas-red)" : "text-(--gold)"}>
          {missing ? "MANGLER" : formatSize(file.size!)}
        </span>
        <span className="flex-1 break-all">{file.path}</span>
        {inventar && (
          <span
            className={INVENTAR_LABEL[inventar.status][1]}
            title={inventar.reasons.join("; ")}
          >
            {INVENTAR_LABEL[inventar.status][0]}
            {inventar.reasons.length > 0 && `: ${inventar.reasons.join("; ")}`}
          </span>
        )}
        <label className="min-h-11 flex items-center cursor-pointer underline">
          {missing ? "Last opp" : "Erstatt"}
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
      {!missing && (
        <details className="mt-2">
          <summary className="cursor-pointer min-h-11 flex items-center">
            Forhåndsvis
          </summary>
          <Preview path={file.path} />
        </details>
      )}
    </li>
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
        <label className="flex items-center gap-2">
          Dag
          <select
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="bg-black border-2 border-(--neon-green) min-h-11 px-2"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          Klokka
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="bg-black border-2 border-(--neon-green) min-h-11 px-2"
          >
            <option value={8}>08 (morgen)</option>
            <option value={12}>12 (dag)</option>
            <option value={21}>21 (kveld)</option>
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
                  // Remount on day change so frozen/hijack state starts fresh.
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
  const [inventar, setInventar] = useState<Map<string, Inventar>>(new Map());

  const load = useCallback(async () => {
    const res = await fetch("/api/media");
    if (!res.ok) return setUnavailable(true);
    setFiles(await res.json());
    const inv = await fetch("/api/media/inventar");
    if (inv.ok) {
      const rows: Inventar[] = await inv.json();
      setInventar(new Map(rows.map((r) => [r.path, r])));
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

  const missing = files?.filter((f) => f.size === null).length ?? 0;
  const present = files
    ? new Set(files.filter((f) => f.size !== null).map((f) => f.path))
    : null;

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-retro p-4 md:p-8">
      <GuideNavigation />
      <div className="max-w-6xl mx-auto">
        <div className="border-8 border-(--neon-green) bg-black p-6 mb-6 text-center">
          <h1 className="text-4xl font-bold tracking-wider">MEDIA</h1>
          {files && (
            <p className="text-xl mt-2">
              {files.length - missing} av {files.length} filer på plass
            </p>
          )}
        </div>

        {unavailable && (
          <p className="text-xl text-(--christmas-red) mb-4">
            Opplasting er bare tilgjengelig på hjemmenettet (LAN-modus).
          </p>
        )}
        {message && <p className="text-xl text-(--gold) mb-4">{message}</p>}

        {files && (
          <section className={box}>
            <h2 className="text-2xl mb-3">Per dag</h2>
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

        <Gjennomsyn present={present} />

        {files && (
          <>
            <label className="flex items-center gap-2 min-h-11 mb-4 text-lg">
              <input
                type="checkbox"
                checked={onlyMissing}
                onChange={(e) => setOnlyMissing(e.target.checked)}
                className="w-5 h-5 accent-(--neon-green)"
              />
              Vis bare filer som mangler
            </label>
            {MEDIA_GROUPS.map((g) => {
              const all = files.filter((f) => mediaGroup(f.path) === g.id);
              const shown = onlyMissing
                ? all.filter((f) => f.size === null)
                : all;
              const groupMissing = all.filter((f) => f.size === null).length;
              return (
                <section key={g.id} className={box}>
                  <h2 className="text-2xl mb-3">
                    {g.title}{" "}
                    <span
                      className={
                        groupMissing
                          ? "text-(--christmas-red)"
                          : "text-(--gold)"
                      }
                    >
                      ({all.length - groupMissing}/{all.length})
                    </span>
                  </h2>
                  <ul className="space-y-2">
                    {shown.map((f) => (
                      <FileRow
                        key={f.path}
                        file={f}
                        inventar={inventar.get(f.path)}
                        onUpload={upload}
                      />
                    ))}
                  </ul>
                  {g.id === "music" && (
                    <label className="mt-3 min-h-11 flex items-center cursor-pointer underline">
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
          </>
        )}
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
