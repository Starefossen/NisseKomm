"use client";

import { useState } from "react";
import { SoundManager } from "@/lib/sounds";

/**
 * Antenna-HUD toys. Pure play, shown only after today's code is in:
 * nothing here gives letters, numbers or hints.
 */

type GameId = "kretslop" | "sorterer" | "slede" | "porten";

const GAMES: [GameId, string][] = [
  ["kretslop", "KRETSLØP"],
  ["sorterer", "SORTERER"],
  ["slede", "SLEDE-RADAR"],
  ["porten", "PORTEN"],
];

const btn = "min-h-11 px-2 border text-sm font-bold cursor-pointer";
const click = () => SoundManager.playSound("click");

function Toggles({ labels, done }: { labels: string[]; done: string }) {
  const [on, setOn] = useState(() => labels.map((_, i) => i % 3 === 0));
  return (
    <>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${labels.length}, 1fr)` }}
      >
        {labels.map((l, i) => (
          <button
            key={l}
            onClick={() => {
              click();
              setOn((p) => p.map((v, j) => (j === i ? !v : v)));
            }}
            className={`${btn} ${on[i] ? "border-(--neon-green) bg-(--neon-green)/25 text-(--neon-green)" : "border-(--christmas-red) text-(--christmas-red)"}`}
          >
            {l} {on[i] ? "PÅ" : "AV"}
          </button>
        ))}
      </div>
      {on.every(Boolean) && <div className="text-(--gold)">{done}</div>}
    </>
  );
}

export function MiniGames({ onClose }: { onClose: () => void }) {
  const [game, setGame] = useState<GameId>("kretslop");
  const [sorted, setSorted] = useState(0);
  const [sleigh, setSleigh] = useState(40);

  return (
    <div className="absolute inset-2 z-30 bg-black/85 border-2 border-(--neon-green) p-3 flex flex-col gap-3 text-(--neon-green)">
      <div className="flex flex-wrap gap-2 items-center">
        {GAMES.map(([id, label]) => (
          <button
            key={id}
            onClick={() => {
              click();
              setGame(id);
            }}
            className={`${btn} ${game === id ? "border-(--gold) bg-(--gold) text-black" : "border-(--neon-green)/40"}`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={onClose}
          className={`${btn} ml-auto border-(--christmas-red) text-(--christmas-red)`}
        >
          LUKK
        </button>
      </div>

      {game === "kretslop" && (
        <Toggles
          labels={["R1", "R2", "R3", "R4", "R5", "R6"]}
          done="KRETSLØP AKTIVT!"
        />
      )}
      {game === "porten" && (
        <Toggles
          labels={["80 MHz", "85 MHz", "90 MHz"]}
          done="PORTEN HOLDER!"
        />
      )}
      {game === "sorterer" && (
        <>
          <div>Sorter pakkene ({sorted}/4):</div>
          <div className="grid grid-cols-4 gap-2">
            {["TOG", "BAMSE", "BYGGESETT", "MALING"].map((n) => (
              <button
                key={n}
                onClick={() => {
                  click();
                  setSorted((s) => Math.min(4, s + 1));
                }}
                className={`${btn} border-(--cold-blue) text-(--cold-blue)`}
              >
                {n}
              </button>
            ))}
          </div>
          {sorted >= 4 && (
            <div className="text-(--gold)">SAMLEBÅND SYNKRONISERT!</div>
          )}
        </>
      )}
      {game === "slede" && (
        <>
          <div className="flex gap-2">
            {["▲ NORD", "▼ SØR"].map((l) => (
              <button
                key={l}
                onClick={() => {
                  click();
                  setSleigh((p) => Math.min(100, p + 15));
                }}
                className={`${btn} border-(--neon-green)`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="h-4 border border-(--neon-green)/50">
            <div
              className="h-full bg-(--gold) transition-all"
              style={{ width: `${sleigh}%` }}
            />
          </div>
          {sleigh >= 100 && (
            <div className="text-(--gold)">KORRIDOR SIKRET!</div>
          )}
        </>
      )}
    </div>
  );
}
