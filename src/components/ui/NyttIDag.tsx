"use client";

import { GameEngine } from "@/lib/game-engine";
import { getCurrentDay, getCurrentMonth } from "@/lib/date-utils";

/** «NYTT I DAG» strip for a game's start screen, from lib/opplasinger.ts. */
export function NyttIDag({ vindu }: { vindu: string }) {
  if (getCurrentMonth() !== 12) return null;
  const nytt = GameEngine.getOpplasinger(getCurrentDay(), vindu);
  if (nytt.length === 0) return null;
  return (
    <div
      role="status"
      className="px-3 py-1 border-2 border-(--gold) bg-(--gold)/15 text-(--gold) text-lg"
    >
      <span className="font-bold tracking-wider">NYTT I DAG: </span>
      {nytt.map((o) => o.tekst).join(" · ")}
    </div>
  );
}
