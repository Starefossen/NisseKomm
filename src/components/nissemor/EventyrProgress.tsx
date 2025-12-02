import Link from "next/link";
import {
  getAllEventyr,
  getEventyrDays,
  getEventyrProgress,
  isEventyrComplete,
} from "@/lib/eventyr";

interface EventyrProgressProps {
  completedDays: Set<number>;
}

export function EventyrProgress({ completedDays }: EventyrProgressProps) {
  const allEventyr = getAllEventyr();

  return (
    <div className="max-w-7xl mx-auto mb-8">
      <div className="border-4 border-(--gold) bg-(--gold)/10 p-6">
        <h2 className="text-2xl font-bold text-(--gold) mb-4">
          📖 EVENTYR-FREMGANG
        </h2>
        <p className="text-lg mb-4 opacity-80">
          Oversikt over hvordan barna dine ligger an med historiene:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allEventyr.map((arc) => {
            const days = getEventyrDays(arc.id);
            const progress = getEventyrProgress(arc.id, completedDays);
            const complete = isEventyrComplete(arc.id, completedDays);

            return (
              <div
                key={arc.id}
                className="border-2 p-4 bg-black/30"
                style={{ borderColor: arc.farge }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 border-2 border-white"
                    style={{ backgroundColor: arc.farge }}
                  />
                  <h3
                    className="font-bold text-lg"
                    style={{ color: arc.farge }}
                  >
                    {arc.navn}
                  </h3>
                  <span className="text-sm opacity-70">
                    ({days.length} dager)
                  </span>
                  {complete && (
                    <span className="text-(--gold) font-bold">✓ FULLFØRT</span>
                  )}
                </div>
                <div className="h-2 bg-black border border-(--neon-green)/30">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: complete ? "var(--gold)" : arc.farge,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/nissemor-guide/eventyr"
            className="inline-block px-6 py-2 border-4 border-(--gold) text-(--gold) font-bold text-xl hover:bg-(--gold)/10"
          >
            SE FULL EVENTYR-OVERSIKT →
          </Link>
        </div>
      </div>
    </div>
  );
}
