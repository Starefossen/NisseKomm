"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type {
  MediaVurderingItem,
  MediaVurderinger,
} from "@/app/api/media/vurdering/route";
import { sjekkSvar, Vurderingsknapper } from "./media/kort";
import { Lagremelding, useLagring } from "./lagring";
import { taggerFor, taggType, tidTekst } from "@/lib/vurdering-tagger";
import type { Kutt } from "@/lib/segmenter";

// Guide sections share the media verdict file: ids like `dag/04/gaatekart`
// sit next to media paths in the same key space (parent-only API, lan mode).
let data: MediaVurderinger | null = null;
let lastet = false;
const lyttere = new Set<() => void>();
const varsle = () => lyttere.forEach((l) => l());

function last() {
  if (lastet) return;
  lastet = true;
  fetch("/api/media/vurdering")
    .then((r) => (r.ok ? r.json() : null))
    .then((v: MediaVurderinger | null) => {
      data = v;
      varsle();
    })
    .catch(() => {});
}

export function useVurderinger(): MediaVurderinger | null {
  return useSyncExternalStore(
    (l) => {
      lyttere.add(l);
      last();
      return () => lyttere.delete(l);
    },
    () => data,
    () => null,
  );
}

export async function lagre(
  id: string,
  vurdering: string | null,
  notat: string,
) {
  return post({ path: id, vurdering, notat });
}

/** Tags and timecode only; verdict and note stay as saved. */
export const lagreTagger = (
  id: string,
  o: { tagger?: string[]; tid?: number | null },
) => post({ path: id, ...o });

/** «Trenger mer»: what is missing (null withdraws); the verdict stays. */
export const lagreTrenger = (id: string, hva: string | null, notat: string) =>
  post({ path: id, trenger: hva ? { hva, notat } : null });

/** ✂ on a Julius segment; the note stays as saved. */
export const lagreKutt = (id: string, kutt: Kutt) =>
  post({ path: id, vurdering: "kutt", kutt });

/** Id → the version on screen when its box appeared; sent with the verdict (409 if it moved since). */
const settVersjon = new Map<string, string>();
export function useSettVersjon(id: string) {
  useEffect(() => {
    let aktiv = true;
    fetch(`/api/media/vurdering?versjon=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((v: { versjon: string | null } | null) => {
        if (aktiv && v?.versjon) settVersjon.set(id, v.versjon);
      })
      .catch(() => {});
    return () => {
      aktiv = false;
    };
  }, [id]);
}

/** Segment id → the raw take hash in the video on screen (SegmentStripe fills it). */
export const settTagning = new Map<string, string>();

export async function post(body: { path: string; [k: string]: unknown }) {
  const raw = settTagning.get(body.path);
  if (raw) body = { ...body, raw } as typeof body;
  const versjon = settVersjon.get(body.path);
  if (!raw && versjon && "vurdering" in body) body = { ...body, versjon };
  const r = await fetch("/api/media/vurdering", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {
    throw new Error("får ikke svar fra serveren");
  });
  await sjekkSvar(r);
  data = (await r.json()).vurderinger;
  varsle();
}

/** Fetch the verdicts again (after Ta i bruk moved them). */
export function lastVurderinger() {
  lastet = false;
  last();
}

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9æøå§.]+/g, "-")
    .replace(/^-|-$/g, "");

/** Gjennomgang renders its own buttons; sections embedded there hide theirs. */
export const SkjulVurder = createContext(false);

/**
 * The day view shows a status cell per section instead of buttons (the guide is
 * for the evening; judging happens in Gjennomgang). Its provider maps an id to the cell.
 */
export const StatusI = createContext<((id: string) => ReactNode) | null>(null);

/** The status cells for some ids (the day view's media), one per element. */
export function StatusFor({ ids }: { ids: string[] }) {
  const fn = useContext(StatusI);
  if (!fn) return null;
  return (
    <div className="flex flex-wrap gap-1 mb-2">
      {ids.map((id) => (
        <span key={id}>{fn(id)}</span>
      ))}
    </div>
  );
}

/**
 * «Vis vurdering» (Innstillinger, per device, off by default): status cells and
 * review links on the parent pages. The review itself lives in Gjennomgang and Filer.
 */
const VIS_KEY = "nissekomm-guide-vis-vurdering";
const visLyttere = new Set<() => void>();
export function settVisVurdering(på: boolean) {
  localStorage.setItem(VIS_KEY, på ? "1" : "0");
  visLyttere.forEach((l) => l());
}
export function useVisVurdering(): boolean {
  const valgt = useSyncExternalStore(
    (l) => {
      visLyttere.add(l);
      return () => visLyttere.delete(l);
    },
    () => localStorage.getItem(VIS_KEY) === "1",
    () => false,
  );
  const sti = usePathname() ?? "";
  return (
    valgt ||
    sti.startsWith("/nissemor-guide/gjennomgang") ||
    sti.startsWith("/nissemor-guide/media")
  );
}

/** Godkjent / Lag på nytt + note for one guide section. */
export function Vurder({ id }: { id: string }) {
  const alle = useVurderinger();
  useSettVersjon(id);
  const status = useContext(StatusI);
  const vis = useVisVurdering();
  if (useContext(SkjulVurder) || !vis) return null;
  if (status) return <div className="mt-2 flex">{status(id)}</div>;
  if (!alle) return null;
  const v: MediaVurderingItem | undefined = alle[id];
  return <VurderBoks key={id} id={id} v={v} />;
}

/** Row 2: verdict buttons, note and «Merker ▸»; the tags drop to a row of their own only when open. */
function VurderBoks({ id, v }: { id: string; v?: MediaVurderingItem }) {
  const [åpen, setÅpen] = useState(false);
  const merker = taggerFor(id).length > 0;
  // Open while the note has focus or a tag/timecode is set.
  const vis = åpen || (v?.tagger?.length ?? 0) > 0 || v?.tid !== undefined;
  return (
    // Keyed by id: Neste must never carry a note, tags or feedback to the next item.
    <div
      key={id}
      id={`vurdering-${id.split("/").at(-1)}`}
      className="group scroll-mt-4"
    >
      <Vurderingsknapper
        vurdering={v}
        onSave={(verdict, notat) => lagre(id, verdict, notat ?? "")}
        onBehold={() => post({ path: id, behold: true })}
        onTrenger={(hva, notat) => lagreTrenger(id, hva, notat)}
        ekstra={
          merker && (
            <button
              type="button"
              aria-expanded={vis}
              onClick={() => setÅpen(!åpen)}
              className="min-h-11 px-1 text-sm text-(--neon-green)/80 underline whitespace-nowrap"
            >
              Merker {vis ? "▾" : "▸"}
            </button>
          )
        }
      />
      <Tagger id={id} v={v} vis={vis} />
    </div>
  );
}

/** The page's first player: the segment strip's video in a segment view. */
const spillerTid = () =>
  document.querySelector<HTMLMediaElement>("video, audio")?.currentTime;

/** Quick tags (⇧1–9) and a timecode (T) for one verdict, saved at once. */
function Tagger({
  id,
  v,
  vis,
}: {
  id: string;
  v?: MediaVurderingItem;
  vis: boolean;
}) {
  const liste = taggerFor(id);
  const { status, kjør } = useLagring();
  if (!liste.length) return null;
  const valgt = v?.tagger ?? [];
  const send = (o: Parameters<typeof lagreTagger>[1]) =>
    void kjør(() => lagreTagger(id, o));
  return (
    <div
      className={`${vis ? "flex" : "hidden group-focus-within:flex"} flex-wrap items-center gap-1 mt-1 text-base`}
    >
      <span className="flex flex-wrap items-center gap-1">
        {liste.map((t, i) => {
          const på = valgt.includes(t);
          return (
            <button
              key={t}
              type="button"
              data-tagg={i + 1}
              aria-pressed={på}
              onClick={() =>
                send({
                  tagger: på ? valgt.filter((x) => x !== t) : [...valgt, t],
                })
              }
              className={`min-h-11 px-2 border ${på ? "bg-(--cold-blue) text-black border-(--cold-blue)" : "border-(--neon-green)/50"}`}
            >
              <span className="text-sm opacity-70">⇧{i + 1}</span> {t}
            </button>
          );
        })}
        {taggType(id) !== "bilde" && (
          <button
            type="button"
            data-tid
            onClick={() => {
              const t = spillerTid();
              if (t !== undefined) send({ tid: t });
            }}
            className="min-h-11 px-2 border border-(--neon-green)/50"
          >
            <span className="text-sm opacity-70">T</span>{" "}
            {v?.tid !== undefined ? `@${tidTekst(v.tid)}` : "tidskode"}
          </button>
        )}
        {v?.tid !== undefined && (
          <button
            type="button"
            onClick={() => send({ tid: null })}
            className="min-h-11 px-2 underline text-sm"
            aria-label="Fjern tidskode"
          >
            ✕
          </button>
        )}
      </span>
      <Lagremelding status={status} />
    </div>
  );
}

/** ⇧1–9 toggles a tag, T sets the timecode, in the Vurder box of `id`. */
export function taggTast(ev: KeyboardEvent, id: string): boolean {
  const boks = document.querySelector(
    `#vurdering-${CSS.escape(id.split("/").at(-1)!)}`,
  );
  const nr = ev.code.match(/^Digit([1-9])$/)?.[1];
  const knapp =
    ev.shiftKey && nr
      ? boks?.querySelector<HTMLButtonElement>(`[data-tagg="${nr}"]`)
      : !ev.shiftKey && ev.key.toLowerCase() === "t"
        ? boks?.querySelector<HTMLButtonElement>("[data-tid]")
        : null;
  if (!knapp) return false;
  knapp.click();
  return true;
}

/**
 * Gjennomgang's keys G/O/L for the Vurder box of `id`. The buttons own the
 * rules (note saved with the verdict, redo needs one); L focuses the note so
 * Enter saves «lag på nytt». True when the key was handled.
 */
export function vurderTast(tast: string, id: string): boolean {
  const boks = document.querySelector(
    `#vurdering-${CSS.escape(id.split("/").at(-1)!)}`,
  );
  const knapp = (v: string) =>
    boks?.querySelector<HTMLButtonElement>(`[data-verdikt="${v}"]`)?.click();
  if (tast === "g") knapp("godkjent");
  else if (tast === "o") knapp("ok");
  else if (tast === "?")
    boks?.querySelector<HTMLButtonElement>("[data-trenger]")?.click();
  else if (tast === "l") {
    const felt = boks?.querySelector<HTMLInputElement>("input");
    if (felt) {
      felt.dataset.mal = "lag_paa_nytt";
      felt.focus();
    }
  } else return false;
  return true;
}

/** `<details>` closed by default, open state kept per id in localStorage. */
export function Lukkbar({
  id,
  tittel,
  className,
  children,
}: {
  id: string;
  tittel: string;
  className: string;
  children: ReactNode;
}) {
  const nokkel = `nissekomm-guide-apen-${id}`;
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.open = localStorage.getItem(nokkel) === "1";
  }, [nokkel]);
  return (
    <details
      ref={ref}
      className={className}
      onToggle={(e) =>
        localStorage.setItem(nokkel, e.currentTarget.open ? "1" : "0")
      }
    >
      <summary className="text-2xl text-(--gold) cursor-pointer min-h-11">
        {tittel}
      </summary>
      {children}
    </details>
  );
}
