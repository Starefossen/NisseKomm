"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { mediaUrl, type MediaStatus } from "@/lib/media";
import { groupVersions, variantLabel, versionKey } from "./oversikt";
import type {
  MediaVurderingItem,
  MediaVurderinger,
} from "@/app/api/media/vurdering/route";

/** Shared by the media page, the day view and the library. */
const TYPES: Record<string, string> = {
  mp4: "video/mp4",
  mp3: "audio/mpeg",
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

const ext = (p: string) => (p.split(".").pop() ?? "").toLowerCase();
const formatSize = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;

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
  status: "current" | "stale" | "unknown" | "missing" | "kandidat" | "arkiv";
  reasons: string[];
  meta?: {
    generator?: string;
    created?: string;
    bakfylt?: boolean;
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
  unknown: ["[?] Ukjent", "text-(--neon-green)/80"],
  missing: ["[✗ Mangler]", "text-(--christmas-red)"],
  kandidat: ["[◇ Kandidat]", "text-(--cold-blue)"],
  arkiv: ["[- Arkiv]", "text-(--gray)"],
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

export function ReviewItemCard({
  file,
  inventar,
  vurdering,
  isSaving,
  onSaveVerdict,
  onUpload,
  iBruk,
  merknad,
}: {
  file: MediaStatus;
  /** The file the app plays (the plain name of a version group). */
  iBruk?: boolean;
  merknad?: string;
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

  return (
    <div className="border-2 border-(--neon-green) bg-black/90 p-3 mb-3 text-(--neon-green)">
      {/* Top row: Path & Inventory Status */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-(--neon-green)/30 pb-2">
        <span className="font-bold break-all text-base md:text-lg">
          {variantLabel(file.path) && (
            <span className="text-(--gold) mr-2">
              {variantLabel(file.path)} ·
            </span>
          )}
          {file.path}
          {iBruk && <span className="text-(--gold) ml-2">· i bruk</span>}
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

      {merknad && (
        <div className="mt-1 text-sm text-(--cold-blue) break-words">
          {merknad}
        </div>
      )}

      {/* Reasons / Why */}
      {inventar?.reasons && inventar.reasons.length > 0 && (
        <div className="mt-1 text-sm text-(--cold-blue) break-words">
          Årsak: {inventar.reasons.join("; ")}
        </div>
      )}

      {/* Sidecar Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-sm text-(--neon-green)/80 bg-black/60 border border-(--neon-green)/20 p-2 my-2">
        <div>
          <span className="text-(--neon-green)/50">Generator: </span>
          <span className="break-all">{inventar?.meta?.generator || "–"}</span>
        </div>
        <div>
          <span className="text-(--neon-green)/50">Opprettet: </span>
          <span>{formatCreated(inventar?.meta?.created)}</span>
          {inventar?.meta?.bakfylt && (
            <span className="text-(--neon-green)/40"> (bakfylt)</span>
          )}
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

      <Vurderingsknapper
        vurdering={vurdering}
        isSaving={isSaving}
        onSave={(v, note) => onSaveVerdict(file.path, v, note)}
        ekstra={
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
        }
      />
    </div>
  );
}

/** Godkjent / Lag på nytt + note; shared by media cards and guide sections. */
export function Vurderingsknapper({
  vurdering,
  isSaving,
  onSave,
  ekstra,
}: {
  vurdering?: MediaVurderingItem;
  isSaving?: boolean;
  onSave: (v: "godkjent" | "lag_paa_nytt" | null, note?: string) => void;
  ekstra?: ReactNode;
}) {
  const currentVerdict = vurdering?.vurdering ?? null;
  const [note, setNote] = useState(vurdering?.notat ?? "");

  const handleVerdictClick = (targetVerdict: "godkjent" | "lag_paa_nytt") => {
    onSave(currentVerdict === targetVerdict ? null : targetVerdict, note);
  };

  const handleNoteBlur = () => {
    if (note !== (vurdering?.notat ?? "")) onSave(currentVerdict, note);
  };

  return (
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
            onClick={() => onSave(null, note)}
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

        {ekstra}
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
              onSave(currentVerdict, note);
            }
          }}
          className="w-full min-h-11 bg-black border-2 border-(--neon-green) px-3 text-sm text-(--neon-green) focus:outline-none focus:border-(--gold)"
        />
        <button
          type="button"
          onClick={() => onSave(currentVerdict, note)}
          disabled={isSaving}
          className="min-h-11 min-w-28 px-4 py-2 border-2 border-(--neon-green) hover:bg-(--neon-green)/20 text-sm font-bold cursor-pointer"
        >
          Lagre notat
        </button>
      </div>
    </div>
  );
}

/** Files, inventory and verdicts, plus upload and verdict saving. */
export function useMediaData() {
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
      const list: MediaStatus[] = await resMedia.json();
      if (resInv.ok) {
        const rows: Inventar[] = await resInv.json();
        setInventar(new Map(rows.map((r) => [r.path, r])));
        // jobs in medier.json without a file yet
        const have = new Set(list.map((f) => f.path));
        list.push(
          ...rows
            .filter((r) => r.status === "missing" && !have.has(r.path))
            .map((r) => ({ path: r.path, size: null })),
        );
      }
      setFiles(list);

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

  return {
    files,
    unavailable,
    message,
    setMessage,
    onlyMissing,
    setOnlyMissing,
    onlyUnrated,
    setOnlyUnrated,
    inventar,
    vurderinger,
    savingMap,
    upload,
    handleSaveVerdict,
  };
}

const VURDERT = {
  godkjent: "godkjent",
  lag_paa_nytt: "lag på nytt",
} as const;

/** Short version name for a summary line: «i bruk», «v2», «gammel 1». */
const versjonsnavn = (path: string, key: string) =>
  path === key
    ? "i bruk"
    : (path.match(/-(v\d+)\.\w+$/)?.[1] ??
      path.replace(/.*\.old-(\d+)\.\w+$/, "gammel $1"));

/**
 * Review cards for the given paths. Each path stands for its version family
 * (plain name, -vN, .old-N): the newest is a full card, the rest sit folded
 * under «Eldre versjoner» with label and review state in the summary.
 */
export function MediaListe({
  paths,
  data,
}: {
  paths: string[];
  data: ReturnType<typeof useMediaData>;
}) {
  if (data.unavailable) return null;
  const byPath = new Map(data.files?.map((f) => [f.path, f]));
  const keys = [...new Set(paths.map(versionKey))];
  const members = [
    ...new Set([...paths, ...(data.files ?? []).map((f) => f.path)]),
  ]
    .filter((p) => keys.includes(versionKey(p)))
    .map((p) => byPath.get(p) ?? { path: p, size: null });
  const card = (f: MediaStatus, iBruk: boolean, merknad?: string) => (
    <ReviewItemCard
      key={f.path + (data.vurderinger[f.path]?.oppdatert ?? "")}
      file={f}
      inventar={data.inventar.get(f.path)}
      vurdering={data.vurderinger[f.path]}
      isSaving={data.savingMap[f.path]}
      onSaveVerdict={data.handleSaveVerdict}
      onUpload={data.upload}
      iBruk={iBruk}
      merknad={merknad}
    />
  );
  const tilstand = (p: string) =>
    VURDERT[data.vurderinger[p]?.vurdering as keyof typeof VURDERT] ??
    "ikke vurdert";
  return (
    <>
      {groupVersions(members)
        .sort((a, b) => keys.indexOf(a.key) - keys.indexOf(b.key))
        .map((v) => (
          <div key={v.key}>
            {card(v.newest, v.newest.path === v.key)}
            {v.older.length > 0 && (
              <details className="mb-3 ml-4">
                <summary className="min-h-11 flex items-center cursor-pointer underline">
                  Eldre versjoner ({v.older.length}):{" "}
                  {v.older
                    .map(
                      (f) =>
                        `${versjonsnavn(f.path, v.key)} ${tilstand(f.path)}`,
                    )
                    .join(" · ")}
                </summary>
                {v.older.map((f) => card(f, f.path === v.key))}
              </details>
            )}
          </div>
        ))}
      {data.message && <p className="text-sm text-(--gold)">{data.message}</p>}
    </>
  );
}
