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
  const r = await fetch("/api/media/vurdering", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: id, vurdering, notat }),
  }).catch(() => {
    throw new Error("får ikke svar fra serveren");
  });
  await sjekkSvar(r);
  data = (await r.json()).vurderinger;
  varsle();
}

/** `dag/04/gaatekart` → page link with the anchor Vurder renders. */
export function vurderingHref(id: string): string {
  const [side, ...rest] = id.split("/");
  const anker = `#vurdering-${rest.at(-1)}`;
  if (side === "dag") return `/nissemor-guide/dag/${Number(rest[0])}${anker}`;
  if (side === "historien") return `/nissemor-guide/historien${anker}`;
  if (side === "forsesong") return `/nissemor-guide/forberedelser${anker}`;
  return "/nissemor-guide/media";
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
    <div id={`vurdering-${id.split("/").at(-1)}`} className="mt-3 scroll-mt-4">
      <Vurderingsknapper
        vurdering={v}
        onSave={(verdict, notat) => lagre(id, verdict, notat ?? "")}
      />
    </div>
  );
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
