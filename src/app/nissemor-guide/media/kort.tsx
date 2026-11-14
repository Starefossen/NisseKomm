"use client";

import { Lagremelding, useLagring } from "../lagring";
import { LysbordBilde } from "../lysbord";
import { lastVurderinger, useVurderinger } from "../vurdering";
import type { Forrige } from "@/lib/vurdering-versjon";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TekstDiff } from "@/components/ui/TekstDiff";
import { feltDiff } from "@/lib/tekstdiff";
import { mediaUrl, type MediaStatus } from "@/lib/media";
import { TRENGER, type TrengerHva } from "@/lib/trenger";
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
  missing: ["[⊘ Mangler]", "text-(--christmas-red)"],
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
          className="my-2 w-full aspect-video max-h-72 flex items-center justify-center bg-black bg-contain bg-center bg-no-repeat border border-(--neon-green)/40 cursor-pointer"
          style={{ backgroundImage: `url("${poster}")` }}
        >
          <span className="bg-black/70 px-4 py-1 text-2xl">SPILL AV</span>
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
          Spill av lyd
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
      <LysbordBilde
        gruppe="filer"
        src={src}
        alt={path}
        loading="lazy"
        className="max-h-72 min-h-24 w-auto object-contain"
      />
    </div>
  );
}

export function ReviewItemCard({
  file,
  inventar,
  onUpload,
  iBruk,
  merknad,
}: {
  file: MediaStatus;
  /** The file the app plays (the plain name of a version group). */
  iBruk?: boolean;
  merknad?: string;
  inventar?: Inventar;
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

      <div className="flex justify-end">
        <label className="min-h-11 flex items-center cursor-pointer underline text-sm">
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
    </div>
  );
}

const KNAPPER: [Verdikt, string, string, string][] = [
  ["godkjent", "G ✓", "G ✓", "bg-(--gold) text-black border-(--gold)"],
  ["ok", "O ◐", "O ◐", "bg-amber-300 text-black border-amber-300"],
  [
    "lag_paa_nytt",
    "L ✗",
    "L ✗",
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

const kb = (n: number) => `${Math.round(n / 1024)} kB`;

/** «Ny versjon» always says what changed: a text diff, a swapped file, or that it is unknown. */
function HvaEndret({ f, behold }: { f: Forrige; behold?: () => void }) {
  if (f.endringer)
    return f.endringer.length ? (
      <div className="mt-1 border-2 border-(--cold-blue) p-2">
        <TekstDiff
          felter={feltDiff(
            f.endringer
              .filter((d) => d.t === "-")
              .map((d) => d.l)
              .join("\n"),
            f.endringer
              .filter((d) => d.t === "+")
              .map((d) => d.l)
              .join("\n"),
          )}
        />
      </div>
    ) : null;
  if (f.fil)
    return (
      <p>
        Filen er byttet {f.fil.byttet.slice(0, 10)},{" "}
        {f.fil.før != null ? `${kb(f.fil.før)} → ` : ""}
        {kb(f.fil.etter)}
        {f.fil.gammel && (
          <>
            {" · "}
            <a
              className="underline"
              href={mediaUrl(f.fil.gammel)}
              target="_blank"
              rel="noreferrer"
            >
              forrige versjon
            </a>
          </>
        )}
      </p>
    );
  return (
    <p className="flex flex-wrap items-center gap-2">
      Endring ukjent (mangler grunnlag).
      {behold && (
        <button
          type="button"
          onClick={behold}
          className="min-h-11 px-3 border-2 border-(--cold-blue) cursor-pointer hover:bg-(--cold-blue)/20"
        >
          Behold forrige vurdering
        </button>
      )}
    </p>
  );
}

/** Godkjent / OK / Lag på nytt + note, saved together; shared by media cards and guide sections. */
export function Vurderingsknapper({
  vurdering,
  onSave,
  onBehold,
  onTrenger,
  ekstra,
}: {
  vurdering?: MediaVurderingItem;
  /** «Behold forrige vurdering» when the change can't be shown. */
  onBehold?: () => Promise<void>;
  /** «Trenger mer» (?): what is missing before Hans can judge; null withdraws. */
  onTrenger?: (hva: TrengerHva | null, notat: string) => Promise<void>;
  /** Rejects with the reason shown in «Ikke lagret: …». */
  onSave: (v: Verdikt | null, note?: string) => Promise<void>;
  ekstra?: ReactNode;
}) {
  // The clicked verdict shows at once; it falls back to the saved one on error.
  const [valgt, setValgt] = useState<Verdikt | null | undefined>(undefined);
  const currentVerdict = (
    valgt === undefined ? (vurdering?.vurdering ?? null) : valgt
  ) as Verdikt | null;
  const { status, kjør } = useLagring();
  const send = (v: Verdikt | null, n: string) => {
    setValgt(v);
    void kjør(() => onSave(v, n)).then(() => setValgt(undefined));
  };
  const [note, setNote] = useState(vurdering?.notat ?? "");
  // Leaving the item (Neste, N/P) with an unsaved note: save it on this item, not the next.
  const ulagret = useRef<(() => void) | null>(null);
  useEffect(() => {
    ulagret.current =
      note !== (vurdering?.notat ?? "") && note.trim()
        ? () => void onSave(currentVerdict, note).catch(() => {})
        : null;
  });
  useEffect(() => () => ulagret.current?.(), []);
  // Set by the Lag på nytt button or key L: Enter in the note saves that verdict.
  const [mal, setMal] = useState<Verdikt | null>(null);
  const felt = useRef<HTMLInputElement>(null);
  // Safari never focuses a clicked button, so blur can't see where focus went:
  // a press on a verdict button marks the blur as part of that click.
  const knappTrykk = useRef(false);

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

  const navn: Record<string, string> = {
    godkjent: "Godkjent",
    ok: "OK",
    lag_paa_nytt: "Lag på nytt",
  };
  return (
    <div
      className="flex flex-col gap-1"
      onPointerDownCapture={(e) => {
        knappTrykk.current = !!(e.target as HTMLElement).closest(
          "[data-verdikt], [data-fjern], [data-trenger]",
        );
      }}
    >
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-1">
        {KNAPPER.map(([v, tekst, , farge]) => (
          <button
            key={v}
            type="button"
            data-verdikt={v}
            title={navn[v]}
            aria-label={navn[v]}
            aria-pressed={currentVerdict === v}
            // Never disabled: a click while a save runs is its own save, not lost.
            onClick={() => lagre(currentVerdict === v ? null : v)}
            className={`min-h-11 min-w-11 px-2 text-base font-bold cursor-pointer border ${
              currentVerdict === v
                ? farge
                : "border-(--neon-green)/60 text-(--neon-green) hover:bg-(--neon-green)/20"
            }`}
          >
            {tekst}
          </button>
        ))}
        {onTrenger && (
          <TrengerValg vurdering={vurdering} onTrenger={onTrenger} />
        )}
        <input
          ref={felt}
          type="text"
          value={note}
          aria-label="Notat (Enter lagrer)"
          placeholder={plassholder}
          onChange={(e) => setNote(e.target.value)}
          onFocus={(e) => {
            if (e.currentTarget.dataset.mal === "lag_paa_nytt")
              setMal("lag_paa_nytt");
          }}
          onBlur={(e) => {
            // Focus moving to a verdict button: that click saves verdict and note together.
            const til = e.relatedTarget as HTMLElement | null;
            const trykk = knappTrykk.current;
            knappTrykk.current = false;
            if (
              trykk ||
              til?.closest("[data-verdikt]") ||
              til?.closest("[data-fjern]")
            )
              return;
            if (!mal && note !== (vurdering?.notat ?? ""))
              send(currentVerdict, note);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") lagre(mal ?? currentVerdict);
          }}
          className="order-last sm:order-none basis-full sm:basis-auto sm:flex-1 min-w-0 min-h-11 bg-black border border-(--neon-green)/60 px-2 text-base text-(--neon-green) focus:outline-none focus:border-(--gold)"
        />
        {currentVerdict && (
          <button
            type="button"
            data-fjern
            onClick={() => lagre(null)}
            title="Fjern valg"
            aria-label="Fjern valg"
            className="min-h-11 min-w-11 text-(--neon-green)/70 cursor-pointer hover:text-(--neon-green)"
          >
            ✕
          </button>
        )}
        {ekstra}
        <Lagremelding status={status} className="text-sm" />
      </div>

      {vurdering?.forrige && (
        <div className="text-sm text-(--cold-blue)">
          <p>○ Ny versjon, ikke vurdert. {forrigeTekst(vurdering)}</p>
          <HvaEndret
            f={vurdering.forrige}
            behold={onBehold && (() => void kjør(onBehold))}
          />
        </div>
      )}

      {mal === "lag_paa_nytt" && !note.trim() && (
        <p role="alert" className="text-sm text-(--christmas-red)">
          Skriv hva som må endres
        </p>
      )}
    </div>
  );
}

/** «?»: a small menu of what is missing, plus an optional note; saved at once. */
function TrengerValg({
  vurdering,
  onTrenger,
}: {
  vurdering?: MediaVurderingItem;
  onTrenger: (hva: TrengerHva | null, notat: string) => Promise<void>;
}) {
  const [åpen, setÅpen] = useState(false);
  const [notat, setNotat] = useState("");
  const { status, kjør } = useLagring();
  const t = vurdering?.trenger;
  const velg = (hva: TrengerHva | null) => {
    setÅpen(false);
    void kjør(() => onTrenger(hva, notat));
  };
  return (
    <span className="relative">
      <button
        type="button"
        data-trenger
        title="Trenger mer (?)"
        aria-label="Trenger mer"
        aria-expanded={åpen}
        onClick={() => setÅpen(!åpen)}
        className={`min-h-11 min-w-11 px-2 text-base font-bold cursor-pointer border ${
          t && !t.lest
            ? "bg-(--cold-blue) text-black border-(--cold-blue)"
            : "border-(--neon-green)/60 hover:bg-(--neon-green)/20"
        }`}
      >
        ?<span className="hidden sm:inline font-normal"> trenger mer</span>
      </button>
      <Lagremelding status={status} className="text-sm" />
      {åpen && (
        <span
          role="menu"
          className="absolute z-30 left-0 top-full mt-1 flex flex-col gap-1 w-72 p-2 bg-black border border-(--cold-blue)"
        >
          <span className="text-sm text-(--cold-blue)">
            Trenger mer før jeg kan vurdere:
          </span>
          <input
            type="text"
            value={notat}
            autoFocus
            placeholder="Valgfritt notat"
            aria-label="Notat til agenten"
            onChange={(e) => setNotat(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setÅpen(false)}
            className="min-h-11 bg-black border border-(--neon-green)/60 px-2 text-base"
          />
          {(Object.keys(TRENGER) as TrengerHva[]).map((h) => (
            <button
              key={h}
              type="button"
              role="menuitem"
              data-trenger-hva={h}
              onClick={() => velg(h)}
              className="min-h-11 px-2 text-left border border-(--neon-green)/40 hover:bg-(--neon-green)/20"
            >
              {TRENGER[h]}
              {h === "skisse" ? " (~1,4 kr)" : ""}
            </button>
          ))}
          {t && (
            <button
              type="button"
              onClick={() => velg(null)}
              className="min-h-11 px-2 text-left underline text-sm"
            >
              Trekk tilbake
            </button>
          )}
        </span>
      )}
    </span>
  );
}

/** Files, inventory and verdicts, plus upload and Ta i bruk. */
export function useMediaData() {
  const [files, setFiles] = useState<MediaStatus[] | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [message, setMessage] = useState("");
  const [inventar, setInventar] = useState<Map<string, Inventar>>(new Map());
  // One verdict store for the whole guide: a save anywhere updates every view.
  const vurderinger: MediaVurderinger = useVurderinger() ?? {};

  const load = useCallback(async () => {
    try {
      const [resMedia, resInv] = await Promise.all([
        fetch("/api/media"),
        fetch("/api/media/inventar"),
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

  /** Promote the approved candidate of a version family (POST /api/media/ta-i-bruk). */
  const taIBruk = async (key: string, kandidat: string) => {
    const res = await fetch("/api/media/ta-i-bruk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kandidat }),
    }).catch(() => {
      throw new Error("får ikke svar fra serveren");
    });
    try {
      await sjekkSvar(res);
    } finally {
      await load();
      lastVurderinger();
    }
    setMessage(`${kandidat} er nå ${key}`);
  };

  return {
    files,
    taIBruk,
    unavailable,
    message,
    setMessage,
    inventar,
    vurderinger,
    upload,
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
  const { status, lagrer, kjør } = useLagring();
  // After a promotion the button goes away; the result stays until the next action.
  if (data.unavailable || ((!f.kanTaIBruk || !f.kandidat) && !status))
    return null;
  const k = f.kandidat;
  if (!k || !f.kanTaIBruk) return <Lagremelding status={status} />;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={lagrer}
        onClick={() => {
          if (
            confirm(
              `Erstatte ${f.key} med ${k.path}? Den gamle beholdes som .old-N.`,
            )
          )
            void kjør(
              () => data.taIBruk(f.key, k.path),
              `✓ ${k.navn} er tatt i bruk`,
            );
        }}
        className="min-h-11 px-4 my-2 border-2 border-(--gold) text-(--gold) hover:bg-(--gold)/20 font-bold cursor-pointer"
      >
        Ta i bruk {k.navn}
      </button>
      <Lagremelding status={status} />
    </span>
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
  status,
}: {
  paths: string[];
  /** The status chip for a family (Filer passes Gjennomgang's matrix cell). */
  status?: (key: string) => ReactNode;
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
            <div className="flex flex-wrap items-center gap-3 text-base">
              {status ? (
                status(v.key)
              ) : (
                <span>
                  {fam.tekst} · gjeldende versjon: {MERKE[fam.celle][2]}
                </span>
              )}
              <a
                href={`/nissemor-guide/gjennomgang?id=${encodeURIComponent(v.key)}`}
                className="underline text-(--gold) min-h-11 inline-flex items-center"
              >
                Vurder i Gjennomgang →
              </a>
            </div>
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
