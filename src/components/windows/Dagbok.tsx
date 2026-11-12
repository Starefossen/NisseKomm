"use client";

import { RetroWindow } from "../ui/RetroWindow";
import { JuliusVideo } from "../modules/JuliusVideo";
import { Oppdrag } from "@/types/innhold";
import { getAdventDay } from "@/lib/date-utils";

interface DagbokProps {
  missions: Oppdrag[];
  onClose: () => void;
  onWatched?: () => void;
  onOpenMail?: () => void;
}

/** Julius' video diary: today's video on top, earlier days below */
export function Dagbok({
  missions,
  onClose,
  onWatched,
  onOpenMail,
}: DagbokProps) {
  const today = getAdventDay();
  const days = missions
    .filter((m) => m.dag <= today)
    .sort((a, b) => b.dag - a.dag);

  return (
    <RetroWindow title="JULIUS' VIDEODAGBOK" onClose={onClose}>
      <div className="h-full overflow-y-auto p-4 md:p-6 space-y-4 bg-(--dark-crt)">
        {days.length === 0 && (
          <div className="text-(--gold) text-center text-lg">
            Første melding fra Julius kommer 1. desember.
          </div>
        )}
        {days.map((m) =>
          m.dag === today ? (
            <section key={m.dag} className="space-y-2">
              <h2 className="text-(--gold) font-bold text-lg">
                DAG {m.dag}. DESEMBER – {m.tittel}
              </h2>
              <JuliusVideo
                day={m.dag}
                onWatched={onWatched}
                onOpenMail={onOpenMail}
                autoPlay
              />
            </section>
          ) : (
            <details
              key={m.dag}
              className="border-2 border-(--neon-green)/35 p-3"
            >
              <summary className="cursor-pointer text-(--gold) min-h-11 flex items-center">
                DAG {m.dag}. DESEMBER – {m.tittel}
              </summary>
              <div className="pt-3">
                <JuliusVideo day={m.dag} preload="none" />
              </div>
            </details>
          ),
        )}
      </div>
    </RetroWindow>
  );
}
