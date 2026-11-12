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
import type {
  MediaVurderingItem,
  MediaVurderinger,
} from "@/app/api/media/vurdering/route";
import { Vurderingsknapper } from "./media/kort";

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
  });
  if (!r.ok) return;
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
  const [lagrer, setLagrer] = useState(false);
  if (useContext(SkjulVurder) || !alle) return null;
  const v: MediaVurderingItem | undefined = alle[id];
  return (
    <div id={`vurdering-${id.split("/").at(-1)}`} className="mt-3 scroll-mt-4">
      <Vurderingsknapper
        key={v?.oppdatert ?? ""}
        vurdering={v}
        isSaving={lagrer}
        onSave={(verdict, notat) => {
          setLagrer(true);
          lagre(id, verdict, notat ?? "").finally(() => setLagrer(false));
        }}
      />
    </div>
  );
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
