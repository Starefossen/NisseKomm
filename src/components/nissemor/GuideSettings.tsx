"use client";

import { useState } from "react";
import { GameEngine } from "@/lib/game-engine";

export function GuideSettings() {
  const [frostOff, setFrostOff] = useState(() =>
    typeof window !== "undefined" ? GameEngine.isFrostDisabledToday() : false,
  );
  const toggleFrost = () => {
    GameEngine.setFrostDisabledToday(!frostOff);
    setFrostOff(!frostOff);
  };

  return (
    <div className="space-y-6">
      {/* Frost kill switch (historie-2026 §6): emergency exit on day 10 and 21 */}
      <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/5 p-6 space-y-3">
        <h2 className="text-2xl font-bold text-(--cold-blue)">FROST AV</h2>
        <p className="text-(--neon-green)/80 text-sm">
          Dag 10 og 21 fryser NisseKomm til dagens kode er inne (senest kl.
          20:00). Slå av frosten for i dag hvis noe står fast.
          {GameEngine.isFrostDay()
            ? " I dag er en frostdag."
            : " I dag er ikke en frostdag."}
        </p>
        <button
          onClick={toggleFrost}
          className={`px-6 py-3 min-h-11 border-4 font-bold text-xl ${
            frostOff
              ? "bg-(--cold-blue) text-black border-(--cold-blue)"
              : "border-(--cold-blue) text-(--cold-blue) hover:bg-(--cold-blue)/10"
          }`}
        >
          {frostOff ? "FROST AV I DAG" : "SLÅ AV FROST I DAG"}
        </button>
      </div>
    </div>
  );
}
