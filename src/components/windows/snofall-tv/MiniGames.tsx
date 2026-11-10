"use client";

import { useState } from "react";
import { SoundManager } from "@/lib/sounds";

/**
 * Antenna-HUD toys. Pure play, shown only after today's code is in:
 * nothing here gives letters, numbers or hints.
 */

type GameId = "kretslop" | "sorterer" | "slede" | "sentrifuge" | "porten";

// Storyboard day each toy first appears (8 kretskort, 16 sorterer, 18 slede, 19 sentrifuge, 21 zapper).
const GAMES: [GameId, string, number][] = [
  ["kretslop", "KRETSLØP", 8],
  ["sorterer", "SORTERER", 16],
  ["slede", "SLEDE-RADAR", 18],
  ["sentrifuge", "SENTRIFUGE", 19],
  ["porten", "PORTEN", 21],
];

export const gamesFor = (day: number) => GAMES.filter(([, , d]) => day >= d);

const btn = "min-h-11 px-2 border text-base font-bold cursor-pointer";
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

export function MiniGames({
  day,
  initialGame,
  onClose,
}: {
  day: number;
  initialGame?: GameId;
  onClose: () => void;
}) {
  const games = gamesFor(day);
  const [game, setGame] = useState<GameId>(() => {
    if (initialGame && games.some(([id]) => id === initialGame)) {
      return initialGame;
    }
    return games[games.length - 1][0];
  });
  const [sorted, setSorted] = useState(0);
  const [sleigh, setSleigh] = useState(40);
  const [rpm, setRpm] = useState(0);

  return (
    <div className="absolute inset-2 z-30 bg-black/85 border-2 border-(--neon-green) p-3 flex flex-col gap-3 text-(--neon-green)">
      <div className="flex flex-wrap gap-2 items-center">
        {games.map(([id, label]) => (
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
      {game === "sentrifuge" && (
        <>
          <div>Sentrifuger prøvene ({rpm} RPM):</div>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => {
                click();
                setRpm((r) => Math.min(5000, r + 1000));
              }}
              className={`${btn} min-w-11 border-(--neon-green) text-(--neon-green)`}
            >
              ▲ ØK FART
            </button>
            <button
              onClick={() => {
                click();
                setRpm((r) => Math.max(0, r - 1000));
              }}
              className={`${btn} min-w-11 border-(--neon-green) text-(--neon-green)`}
            >
              ▼ BREMS
            </button>
            <button
              onClick={() => {
                click();
                setRpm(5000);
              }}
              className={`${btn} min-w-11 border-(--cold-blue) text-(--cold-blue)`}
            >
              MAKS SPINN
            </button>
            <button
              onClick={() => {
                click();
                setRpm(0);
              }}
              className={`${btn} min-w-11 border-(--christmas-red) text-(--christmas-red)`}
            >
              STOPP
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 64 64"
                className={`w-16 h-16 transition-transform ${
                  rpm > 0 ? "animate-spin motion-reduce:animate-none" : ""
                }`}
                style={
                  rpm > 0
                    ? {
                        animationDuration: `${Math.max(
                          0.2,
                          2.5 - (rpm / 5000) * 2.2,
                        )}s`,
                      }
                    : undefined
                }
                aria-hidden="true"
              >
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  className="text-(--neon-green)/40"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="6"
                  fill="currentColor"
                  className="text-(--gold)"
                />
                <rect
                  x="30"
                  y="6"
                  width="4"
                  height="12"
                  rx="2"
                  fill="currentColor"
                  className="text-(--neon-green)"
                />
                <rect
                  x="30"
                  y="46"
                  width="4"
                  height="12"
                  rx="2"
                  fill="currentColor"
                  className="text-(--neon-green)"
                />
                <rect
                  x="6"
                  y="30"
                  width="12"
                  height="4"
                  rx="2"
                  fill="currentColor"
                  className="text-(--neon-green)"
                />
                <rect
                  x="46"
                  y="30"
                  width="12"
                  height="4"
                  rx="2"
                  fill="currentColor"
                  className="text-(--neon-green)"
                />
              </svg>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-base">
                <span>ROTOR-TURTALL:</span>
                <span className="tabular-nums font-bold text-(--gold)">
                  {rpm} RPM
                </span>
              </div>
              <div className="h-4 border border-(--neon-green)/50">
                <div
                  className="h-full bg-(--gold) transition-all motion-reduce:transition-none"
                  style={{ width: `${(rpm / 5000) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {rpm >= 5000 && (
            <div className="text-(--gold)">
              SENTRIFUGE I BALANSE – SEPARERING FULLFØRT!
            </div>
          )}
        </>
      )}
    </div>
  );
}
