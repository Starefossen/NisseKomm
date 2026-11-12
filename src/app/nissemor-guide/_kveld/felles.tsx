"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { getCurrentDate } from "@/lib/date-utils";
import { StorageManager } from "@/lib/storage";
import type {
  dagListe,
  forSesongen,
  historien,
  sesongKart,
} from "@/lib/guide-sesong";

export interface Sesong {
  dager: ReturnType<typeof dagListe>;
  for: ReturnType<typeof forSesongen>;
  historien: ReturnType<typeof historien>;
  kart: ReturnType<typeof sesongKart>;
  figurer: { id: string; navn: string; om: string }[];
  promo: { id: string; tekst: string }[];
}

/** Day list, pre-season and Historien, baked from the docs (parent-only API). */
export function useSesong(): Sesong | null {
  const [s, setS] = useState<Sesong | null>(null);
  useEffect(() => {
    fetch("/api/guide/sesong")
      .then((r) => (r.ok ? r.json() : null))
      .then(setS)
      .catch(() => setS(null));
  }, []);
  return s;
}

/** The day the parents prepare tonight: tomorrow, if it is Dec 1–24. */
export function morgendagen(): number | null {
  const d = getCurrentDate();
  d.setDate(d.getDate() + 1);
  return d.getMonth() === 11 && d.getDate() <= 24 ? d.getDate() : null;
}

/**
 * Re-renders when the shared state changes: pulls /api/state on mount and every
 * 30 s, so the guide shows the kids' progress and the other parent's ticks.
 */
export function useSynk() {
  const [, setTikk] = useState(0);
  useEffect(() => {
    let aktiv = true;
    const hent = () =>
      StorageManager.sync().then(() => aktiv && setTikk((t) => t + 1));
    void hent();
    const id = setInterval(hent, 30_000);
    return () => {
      aktiv = false;
      clearInterval(id);
    };
  }, []);
}

/** A parent checklist, synced between both parents' phones. */
export function useAvkrysning(nokkel: string) {
  useSynk();
  // Ticks made before sync lived in this browser only; keep them.
  const krysset =
    StorageManager.getForeldreAvkrysning()[nokkel] ??
    (JSON.parse(
      localStorage.getItem(`nissekomm-foreldre-${nokkel}`) ?? "[]",
    ) as string[]);
  const [, setTikk] = useState(0);
  const veksle = (id: string) => {
    StorageManager.setForeldreAvkrysning(
      nokkel,
      krysset.includes(id) ? krysset.filter((x) => x !== id) : [...krysset, id],
    );
    setTikk((t) => t + 1);
  };
  return { krysset, veksle };
}

export function Avkrysning({
  punkter,
  krysset,
  veksle,
  vis = (p) => p,
}: {
  punkter: readonly string[];
  krysset: string[];
  veksle: (id: string) => void;
  /** How a line is drawn; the tick is keyed on the string itself. */
  vis?: (p: string) => ReactNode;
}) {
  return (
    <ul className="space-y-1">
      {punkter.map((p) => (
        <li key={p}>
          <label className="flex gap-3 items-start min-h-11 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 w-6 h-6 shrink-0 accent-(--gold)"
              checked={krysset.includes(p)}
              onChange={() => veksle(p)}
            />
            <span
              className={krysset.includes(p) ? "line-through opacity-60" : ""}
            >
              {vis(p)}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

export function Kort({
  tittel,
  farge = "border-(--neon-green)",
  children,
}: {
  tittel: string;
  farge?: string;
  children: ReactNode;
}) {
  return (
    <section className={`border-4 p-4 space-y-2 ${farge}`}>
      <h2 className="text-2xl font-bold text-(--gold)">{tittel}</h2>
      {children}
    </section>
  );
}

export function GuideSide({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <GuideAuth>
        <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) text-xl p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <GuideNavigation />
            {children}
          </div>
        </div>
      </GuideAuth>
    </Suspense>
  );
}
