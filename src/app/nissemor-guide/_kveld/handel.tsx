"use client";

import { useState, type ReactNode } from "react";
import { StorageManager } from "@/lib/storage";
import type { VareTreff, handleliste } from "@/lib/guide-sesong";
import { useSynk } from "./felles";

type Status = "kjopt" | "hjemme";
type Vare = ReturnType<typeof handleliste>[number];

/** The shared shopping status (`nissekomm-handlet`), synced between both parents. */
export function useHandlet() {
  useSynk();
  const [, setTikk] = useState(0);
  const h = StorageManager.getHandlet();
  // Ticks from before item ids lived in the «handleliste» checklist, by name.
  const gammel = StorageManager.getForeldreAvkrysning().handleliste ?? [];
  const status = (id: string, vare: string): Status | undefined =>
    h[id] ?? (gammel.includes(vare) ? "kjopt" : undefined);
  const sett = (id: string, s: Status | null) => {
    StorageManager.setHandlet(id, s);
    setTikk((t) => t + 1);
  };
  return { status, sett };
}

type Handlet = ReturnType<typeof useHandlet>;

function VareKnapp({ v, h }: { v: VareTreff; h: Handlet }) {
  const s = h.status(v.id, v.vare);
  return (
    <button
      type="button"
      title={`${v.vare}: ${s === "hjemme" ? "har hjemme" : s ? "kjøpt" : "mangler"}`}
      aria-label={`${v.vare} ${s ? "kjøpt" : "mangler"}`}
      className={`inline-flex items-center justify-center min-w-11 min-h-11 -my-3 align-middle ${s ? "text-(--gold)" : "text-(--cold-blue)"}`}
      onClick={(e) => {
        e.preventDefault();
        h.sett(v.id, s ? null : "kjopt");
      }}
    >
      {s ? "✓" : "○"}
    </button>
  );
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Draws `s` with ✓/○ after every word the server matched to a shopping item. */
export function medVarer(treff: VareTreff[], h: Handlet) {
  const ord = new Map(treff.flatMap((v) => v.ord.map((o) => [o, v] as const)));
  if (!ord.size) return (s: ReactNode) => s;
  const re = new RegExp(
    `(${[...ord.keys()]
      .sort((a, b) => b.length - a.length)
      .map(esc)
      .join("|")})`,
  );
  return (s: ReactNode): ReactNode =>
    typeof s !== "string"
      ? s
      : s.split(re).map((x, i) =>
          i % 2 ? (
            <span key={i}>
              {x}
              <VareKnapp v={ord.get(x)!} h={h} />
            </span>
          ) : (
            x
          ),
        );
}

const KILDE = {
  hjemme: "text-(--neon-green)",
  lokalt: "text-(--gold)",
  nett: "text-(--christmas-red)",
} as const;

/** The shopping list grouped by shop, with progress and a «missing only» filter. */
export function Handleliste({ varer }: { varer: Vare[] }) {
  const h = useHandlet();
  const [mangler, setMangler] = useState(false);
  const ferdig = varer.filter((v) => h.status(v.id, v.vare)).length;
  const grupper = [
    ...new Set(varer.map((v) => (v.kilde === "hjemme" ? "Hjemme" : v.gruppe))),
  ];
  return (
    <>
      <p className="text-2xl text-(--gold)">
        {ferdig} av {varer.length} kjøpt eller hjemme
      </p>
      <label className="flex gap-3 items-center min-h-11 cursor-pointer">
        <input
          type="checkbox"
          className="w-6 h-6 accent-(--gold)"
          checked={mangler}
          onChange={() => setMangler(!mangler)}
        />
        Vis bare det som mangler
      </label>
      {grupper.map((g) => {
        const liste = varer.filter(
          (v) =>
            (v.kilde === "hjemme" ? "Hjemme" : v.gruppe) === g &&
            !(mangler && h.status(v.id, v.vare)),
        );
        if (!liste.length) return null;
        return (
          <div key={g}>
            <h3 className="text-(--gold)">{g}</h3>
            <ul className="space-y-1">
              {liste.map((v) => {
                const s = h.status(v.id, v.vare);
                return (
                  <li key={v.id} className="flex gap-3 items-start">
                    <label className="flex gap-3 items-start min-h-11 cursor-pointer grow">
                      <input
                        type="checkbox"
                        className="mt-1 w-6 h-6 shrink-0 accent-(--gold)"
                        checked={s === "kjopt"}
                        onChange={() =>
                          h.sett(v.id, s === "kjopt" ? null : "kjopt")
                        }
                      />
                      <span className={s ? "line-through opacity-60" : ""}>
                        <span className={KILDE[v.kilde as keyof typeof KILDE]}>
                          [{v.kilde}]
                        </span>{" "}
                        {v.tidlig && (
                          <span className="text-(--christmas-red)">
                            [før 28. nov]{" "}
                          </span>
                        )}
                        {v.lenke ? (
                          <a
                            href={v.lenke}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {v.vare}
                          </a>
                        ) : (
                          v.vare
                        )}
                        {v.sok && " (søk)"}
                        {v.mengde && ` · ${v.mengde}`}
                        {v.pris && ` · ${v.pris}`}
                        {v.dager && ` · dag ${v.dager}`}
                        <span className="block text-base opacity-80">
                          {v.hvor}
                        </span>
                      </span>
                    </label>
                    <button
                      type="button"
                      className={`shrink-0 min-h-11 px-2 border-2 text-base ${s === "hjemme" ? "border-(--gold) text-(--gold)" : "border-(--neon-green)/50"}`}
                      onClick={() =>
                        h.sett(v.id, s === "hjemme" ? null : "hjemme")
                      }
                    >
                      {s === "hjemme" ? "✓ hjemme" : "har hjemme"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </>
  );
}
