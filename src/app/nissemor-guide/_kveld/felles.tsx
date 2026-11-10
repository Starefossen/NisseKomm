"use client";

import { Suspense, useState, type ReactNode } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { getCurrentDate } from "@/lib/date-utils";
import { GameEngine } from "@/lib/game-engine";
import { DAGER } from "./data";

/** data.ts stores codes as {dag} so they never sit in component source; fill them from the quest data. */
export const fyll = (tekst: string) =>
  tekst.replace(
    /\{(\d+)\}/g,
    (_, dag) =>
      GameEngine.getAllQuests().find((q) => q.dag === Number(dag))?.kode ?? "?",
  );

export type Dag = (typeof DAGER)[number];

export const hentDag = (dag: number): Dag | undefined =>
  DAGER.find((d) => d.dag === dag);

/** The day the parents prepare tonight: tomorrow, if it is Dec 1–24. */
export function morgendagen(): number | null {
  const d = getCurrentDate();
  d.setDate(d.getDate() + 1);
  return d.getMonth() === 11 && d.getDate() <= 24 ? d.getDate() : null;
}

// ponytail: parent checklists live in this browser only; move to StorageManager if parents need cross-device sync
export function useAvkrysning(nokkel: string) {
  const key = `nissekomm-foreldre-${nokkel}`;
  // GuideAuth renders children only client-side after login, so localStorage is available
  const [krysset, setKrysset] = useState<string[]>(() =>
    typeof window === "undefined"
      ? []
      : JSON.parse(localStorage.getItem(key) ?? "[]"),
  );
  const veksle = (id: string) => {
    const neste = krysset.includes(id)
      ? krysset.filter((x) => x !== id)
      : [...krysset, id];
    setKrysset(neste);
    localStorage.setItem(key, JSON.stringify(neste));
  };
  return { krysset, veksle };
}

export function Avkrysning({
  punkter,
  krysset,
  veksle,
}: {
  punkter: readonly string[];
  krysset: string[];
  veksle: (id: string) => void;
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
              {p}
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
        <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] text-xl p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <GuideNavigation />
            {children}
          </div>
        </div>
      </GuideAuth>
    </Suspense>
  );
}
