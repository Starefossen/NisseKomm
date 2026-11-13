"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
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

/** ✂ on a Julius segment; the note stays as saved. */
export const lagreKutt = (id: string, kutt: Kutt) =>
  post({ path: id, vurdering: "kutt", kutt });

/** Segment id → the raw take hash in the video on screen (SegmentStripe fills it). */
export const settTagning = new Map<string, string>();

async function post(body: { path: string; [k: string]: unknown }) {
  const raw = settTagning.get(body.path);
  if (raw) body = { ...body, raw } as typeof body;
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

/** Godkjent / Lag på nytt + note for one guide section. */
export function Vurder({ id }: { id: string }) {
  const alle = useVurderinger();
  if (useContext(SkjulVurder) || !alle) return null;
  const v: MediaVurderingItem | undefined = alle[id];
  return (
    // Keyed by id: Neste must never carry a note, tags or feedback to the next item.
    <div
      key={id}
      id={`vurdering-${id.split("/").at(-1)}`}
      className="mt-3 scroll-mt-4"
    >
      {!!v?.forrige?.endringer?.length && (
        <div className="mb-2 border-2 border-(--cold-blue) p-2 text-sm">
          <p className="text-(--cold-blue)">
            Endret siden du{" "}
            {v.forrige.vurdering === "godkjent" ? "godkjente" : "vurderte den"}:
          </p>
          {v.forrige.endringer.map((d, i) => (
            <p
              key={i}
              className={`whitespace-pre-wrap break-words ${d.t === "+" ? "text-(--aurora) bg-(--aurora)/10" : "text-(--christmas-red) line-through"}`}
            >
              {d.t} {d.l}
            </p>
          ))}
        </div>
      )}
      <Vurderingsknapper
        vurdering={v}
        onSave={(verdict, notat) => lagre(id, verdict, notat ?? "")}
      />
      <Tagger id={id} v={v} />
    </div>
  );
}

/** The page's first player: the segment strip's video in a segment view. */
const spillerTid = () =>
  document.querySelector<HTMLMediaElement>("video, audio")?.currentTime;

/** Quick tags (⇧1–9) and a timecode (T) for one verdict, saved at once. */
function Tagger({ id, v }: { id: string; v?: MediaVurderingItem }) {
  const liste = taggerFor(id);
  const { status, kjør } = useLagring();
  if (!liste.length) return null;
  const valgt = v?.tagger ?? [];
  const send = (o: Parameters<typeof lagreTagger>[1]) =>
    void kjør(() => lagreTagger(id, o));
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2 text-base">
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
