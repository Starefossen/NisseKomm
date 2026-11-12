"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { mediaUrl, type MediaStatus } from "@/lib/media";
import { variantLabel } from "./oversikt";
import {
  MERKE,
  familie,
  forrigeTekst,
  groupVersions,
  versionKey,
  type StatusKilde,
} from "@/lib/media-status";
import type {
  MediaVurderingItem,
  MediaVurderinger,
  Verdikt,
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
  status:
    | "current"
    | "stale"
    | "unknown"
    | "missing"
    | "valgfri"
    | "kandidat"
    | "arkiv";
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
  valgfri: ["[○ Valgfri – ikke laget]", "text-(--gray)"],
  kandidat: ["[◇ Kandidat]", "text-(--cold-blue)"],
  arkiv: ["[- Arkiv]", "text-(--gray)"],
};

function InlinePlayer({ path, missing }: { path: string; missing: boolean }) {
  const src = mediaUrl(path);
  const fileExt = ext(path);
  // WebKit builds a full media pipeline per <video>/<audio>, even with
  // preload="none": hundreds of them made filtering slow, so mount on click.
  const [spill, setSpill] = useState(false);

  if (missing) {
    return (
      <div className="p-3 my-2 border border-(--christmas-red)/60 bg-(--christmas-red)/10 text-(--christmas-red) text-sm">
        Filen mangler på disk
      </div>
    );
  }

  if (fileExt === "mp4") {
    const poster = mediaUrl(path.replace(/\.mp4$/, ".jpg"));
    if (!spill)
      return (
        <button
          type="button"
          onClick={() => setSpill(true)}
          aria-label={`Spill av ${path}`}
          className="my-2 w-full aspect-video max-h-72 flex items-center justify-center bg-black bg-contain bg-center bg-no-repeat border border-(--neon-green)/40 cursor-pointer text-4xl"
          style={{ backgroundImage: `url("${poster}")` }}
        >
          <span className="bg-black/70 px-4 py-1">▶</span>
        </button>
      );
    return (
      <div className="my-2 bg-black">
        <video
          autoPlay
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
    if (!spill)
      return (
        <button
          type="button"
          onClick={() => setSpill(true)}
          className="my-2 w-full min-h-11 border border-(--neon-green)/40 cursor-pointer hover:bg-(--neon-green)/20"
        >
          ▶ Spill av lyd
        </button>
      );
    return (
      <div className="my-2">
        <audio
          src={src}
          controls
          autoPlay
          preload="none"
          className="w-full min-h-11"
        />
      </div>
    );
  }

  return (
    <div className="my-2 flex justify-center bg-black/60 p-2 border border-(--neon-green)/40">
      {/* eslint-disable-next-line @next/next/no-img-element -- served from MEDIA_DIR */}
      <img
        src={src}
        alt={path}
        loading="lazy"
        decoding="async"
        className="max-h-72 min-h-24 w-auto object-contain"
      />
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
    v: Verdikt | null,
    note?: string,
  ) => Promise<void>;
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
          {iBruk && (
            <span className="text-(--gold) ml-2">· gjeldende versjon</span>
          )}
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

const KNAPPER: [Verdikt, string, string, string][] = [
  [
    "godkjent",
    "Godkjent",
    "[✓] Godkjent",
    "bg-(--gold) text-black border-(--gold)",
  ],
  ["ok", "OK", "[◐] OK", "bg-amber-300 text-black border-amber-300"],
  [
    "lag_paa_nytt",
    "Lag på nytt",
    "[!] Lag på nytt",
    "bg-(--christmas-red) text-white border-(--christmas-red)",
  ],
];

/** Throws the reason for a failed save, worded for «Ikke lagret: …». */
export async function sjekkSvar(res: Response): Promise<void> {
  if (res.ok) return;
  if (res.status === 401) throw new Error("du er logget ut");
  const tekst = (await res.text().catch(() => "")).trim();
  throw new Error(tekst || `feil ${res.status}`);
}

/** Godkjent / OK / Lag på nytt + note, saved together; shared by media cards and guide sections. */
export function Vurderingsknapper({
  vurdering,
  isSaving,
  onSave,
  ekstra,
}: {
  vurdering?: MediaVurderingItem;
  isSaving?: boolean;
  /** Rejects with the reason shown in «Ikke lagret: …». */
  onSave: (v: Verdikt | null, note?: string) => Promise<void>;
  ekstra?: ReactNode;
}) {
  // The clicked verdict shows at once; it falls back to the saved one on error.
  const [valgt, setValgt] = useState<Verdikt | null | undefined>(undefined);
  const currentVerdict = (
    valgt === undefined ? (vurdering?.vurdering ?? null) : valgt
  ) as Verdikt | null;
  const [status, setStatus] = useState<
    { s: "lagrer" } | { s: "lagret" } | { s: "feil"; grunn: string } | null
  >(null);
  const tidtaker = useRef<ReturnType<typeof setTimeout>>(undefined);
  const send = (v: Verdikt | null, n: string) => {
    clearTimeout(tidtaker.current);
    setValgt(v);
    setStatus({ s: "lagrer" });
    onSave(v, n).then(
      () => {
        setValgt(undefined);
        setStatus({ s: "lagret" });
        tidtaker.current = setTimeout(() => setStatus(null), 2000);
      },
      (e: unknown) => {
        setValgt(undefined);
        setStatus({
          s: "feil",
          grunn: e instanceof Error ? e.message : "ukjent feil",
        });
      },
    );
  };
  useEffect(() => () => clearTimeout(tidtaker.current), []);
  const lagrer = isSaving || status?.s === "lagrer";
  const [note, setNote] = useState(vurdering?.notat ?? "");
  // Set by the Lag på nytt button or key L: Enter in the note saves that verdict.
  const [mal, setMal] = useState<Verdikt | null>(null);
  const felt = useRef<HTMLInputElement>(null);

  const lagre = (v: Verdikt | null) => {
    if (v === "lag_paa_nytt" && !note.trim()) {
      setMal(v);
      felt.current?.focus();
      return;
    }
    setMal(null);
    if (felt.current) delete felt.current.dataset.mal;
    send(v, note);
  };

  const plassholder =
    mal === "lag_paa_nytt" || currentVerdict === "lag_paa_nytt"
      ? "Hva må endres?"
      : currentVerdict === "ok"
        ? "Hva kunne vært bedre?"
        : "Kort notat...";

  return (
    <div className="mt-3 pt-2 border-t border-(--neon-green)/30 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {KNAPPER.map(([v, tekst, valgt, farge]) => (
          <button
            key={v}
            type="button"
            data-verdikt={v}
            onClick={() => lagre(currentVerdict === v ? null : v)}
            disabled={lagrer}
            className={`min-h-11 min-w-28 px-4 py-2 font-bold cursor-pointer transition-colors border-2 ${
              currentVerdict === v
                ? farge
                : "border-(--neon-green) text-(--neon-green) hover:bg-(--neon-green)/20"
            }`}
          >
            {currentVerdict === v ? valgt : tekst}
          </button>
        ))}

        {currentVerdict && (
          <button
            type="button"
            onClick={() => lagre(null)}
            disabled={lagrer}
            className="min-h-11 px-3 py-2 text-sm text-(--neon-green)/70 underline cursor-pointer hover:text-(--neon-green)"
          >
            Fjern valg
          </button>
        )}

        <span aria-live="polite" className="text-sm ml-auto">
          {lagrer ? (
            <span className="text-(--gold) animate-pulse">Lagrer…</span>
          ) : status?.s === "lagret" ? (
            <span className="text-(--gold)">✓ Lagret</span>
          ) : status?.s === "feil" ? (
            <span className="text-(--christmas-red)">
              Ikke lagret: {status.grunn}
            </span>
          ) : null}
        </span>

        {ekstra}
      </div>

      {vurdering?.forrige && (
        <p className="text-sm text-(--cold-blue)">
          ○ Ny versjon, ikke vurdert. {forrigeTekst(vurdering)}
        </p>
      )}

      {mal === "lag_paa_nytt" && !note.trim() && (
        <p role="alert" className="text-sm text-(--christmas-red)">
          Skriv hva som må endres
        </p>
      )}

      <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center mt-1">
        <input
          ref={felt}
          type="text"
          value={note}
          placeholder={plassholder}
          onChange={(e) => setNote(e.target.value)}
          onFocus={(e) => {
            if (e.currentTarget.dataset.mal === "lag_paa_nytt")
              setMal("lag_paa_nytt");
          }}
          onBlur={() => {
            if (!mal && note !== (vurdering?.notat ?? ""))
              send(currentVerdict, note);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") lagre(mal ?? currentVerdict);
          }}
          className="w-full min-h-11 bg-black border-2 border-(--neon-green) px-3 text-sm text-(--neon-green) focus:outline-none focus:border-(--gold)"
        />
        <button
          type="button"
          onClick={() => lagre(mal ?? currentVerdict)}
          disabled={lagrer}
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
            .filter(
              (r) =>
                (r.status === "missing" || r.status === "valgfri") &&
                !have.has(r.path),
            )
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
    v: Verdikt | null,
    note?: string,
  ) => {
    setSavingMap((prev) => ({ ...prev, [path]: true }));
    try {
      const res = await fetch("/api/media/vurdering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, vurdering: v, notat: note }),
      }).catch(() => {
        throw new Error("får ikke svar fra serveren");
      });
      await sjekkSvar(res);
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
    } finally {
      setSavingMap((prev) => ({ ...prev, [path]: false }));
    }
  };

  /** Promote the approved candidate of a version family (POST /api/media/ta-i-bruk). */
  const taIBruk = async (key: string, kandidat: string) => {
    setMessage(`Tar i bruk ${kandidat} ...`);
    const res = await fetch("/api/media/ta-i-bruk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kandidat }),
    });
    setMessage(
      res.ok ? `${kandidat} er nå ${key}` : `Feil: ${await res.text()}`,
    );
    load();
  };

  return {
    files,
    taIBruk,
    unavailable,
    message,
    setMessage,
    inventar,
    vurderinger,
    savingMap,
    upload,
    handleSaveVerdict,
  };
}

/** Status kilde for media-status from the loaded data. */
export const kilde = (data: ReturnType<typeof useMediaData>): StatusKilde => ({
  filer: data.files ?? [],
  vurderinger: data.vurderinger,
  inventar: data.inventar,
});

/** «Ta i bruk vN» for a family whose newest candidate is approved. */
export function TaIBruk({
  path,
  data,
}: {
  path: string;
  data: ReturnType<typeof useMediaData>;
}) {
  const f = familie(path, kilde(data));
  if (data.unavailable || !f.kanTaIBruk || !f.kandidat) return null;
  const k = f.kandidat;
  return (
    <button
      type="button"
      onClick={() => {
        if (
          confirm(
            `Erstatte ${f.key} med ${k.path}? Den gamle beholdes som .old-N.`,
          )
        )
          data.taIBruk(f.key, k.path);
      }}
      className="min-h-11 px-4 my-2 border-2 border-(--gold) text-(--gold) hover:bg-(--gold)/20 font-bold cursor-pointer"
    >
      Ta i bruk {k.navn}
    </button>
  );
}

/**
 * Review cards for the given paths. Each path stands for its version family
 * (plain name, -vN, .old-N): the newest is a full card, the rest sit folded
 * under «Eldre versjoner» with label and review state in the summary.
 */
export function MediaListe({
  paths,
  data,
  melding = true,
}: {
  paths: string[];
  data: ReturnType<typeof useMediaData>;
  /** Show the save/upload message under the list. */
  melding?: boolean;
}) {
  if (data.unavailable) return null;
  const byPath = new Map(data.files?.map((f) => [f.path, f]));
  const k = kilde(data);
  const keys = new Map(
    [...new Set(paths.map(versionKey))].map((k, i) => [k, i]),
  );
  const members = [
    ...new Set([...paths, ...(data.files ?? []).map((f) => f.path)]),
  ]
    .filter((p) => keys.has(versionKey(p)))
    .map((p) => byPath.get(p) ?? { path: p, size: null });
  const card = (f: MediaStatus, iBruk: boolean, merknad?: string) => (
    <ReviewItemCard
      key={f.path}
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
  return (
    <>
      {groupVersions(members)
        .sort((a, b) => keys.get(a.key)! - keys.get(b.key)!)
        .map((v) => ({ v, fam: familie(v.key, k) }))
        .map(({ v, fam }) => (
          <div key={v.key}>
            <p className="text-base">
              {fam.tekst} · gjeldende versjon: {MERKE[fam.celle][2]}
            </p>
            <TaIBruk path={v.key} data={data} />
            {card(v.newest, v.newest.path === v.key)}
            {v.older.length > 0 && (
              <details className="mb-3 ml-4">
                <summary className="min-h-11 flex items-center cursor-pointer underline">
                  Eldre versjoner ({v.older.length}):{" "}
                  {fam.versjoner
                    .filter((x) => x.path !== v.newest.path)
                    .map((x) => `${x.navn} ${MERKE[x.celle][2]}`)
                    .join(" · ")}
                </summary>
                {v.older.map((f) => card(f, f.path === v.key))}
              </details>
            )}
          </div>
        ))}
      {melding && data.message && (
        <p className="text-sm text-(--gold)">{data.message}</p>
      )}
    </>
  );
}
