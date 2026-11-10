"use client";

import { mediaUrl } from "@/lib/media";
import { useState, useEffect } from "react";
import Image from "next/image";
import { RetroWindow } from "../ui/RetroWindow";
import { GameEngine } from "@/lib/game-engine";
import { getCurrentDate, getCurrentDay } from "@/lib/date-utils";

const TINT_BREV =
  "Takk for lyset.\nJeg hadde glemt farger.\nKrystallet smelter ikke.\nDet er fra meg.";

// M6 Tøvær: Kulde's letter thaws as the reward for solving day 24's code.
export function erBrevetFrossent(day: number, dag24Lost: boolean): boolean {
  return day < 24 || !dag24Lost;
}

/**
 * Stores a letter where the parent guide reads it. Three children write on the same
 * day, so a second letter is appended instead of replacing the first.
 * Returns false (and the caller keeps the draft) outside days 1-24.
 */
export function sendBrev(dag: number, utkast: string): boolean {
  const tekst = utkast.trim();
  if (!tekst || dag < 1 || dag > 24) return false;
  const forrige = GameEngine.getSantaLetters().find((l) => l.day === dag);
  GameEngine.addSantaLetter(
    dag,
    forrige ? `${forrige.content}\n\n${tekst}` : tekst,
  );
  return true;
}

interface Letter {
  day: number;
  content: string;
}

interface BrevfuglerProps {
  onClose: () => void;
}

export function Brevfugler({ onClose }: BrevfuglerProps) {
  const [letters, setLetters] = useState<Letter[]>(() =>
    typeof window !== "undefined" ? GameEngine.getSantaLetters() : [],
  );
  const [utkast, setUtkast] = useState("");
  const [radarTick, setRadarTick] = useState(0);
  const [currentTime, setCurrentTime] = useState<Date>(() => getCurrentDate());
  // Once per open, not on every radar tick; a code can only be sent with this window closed.
  const [frossent] = useState(() =>
    erBrevetFrossent(getCurrentDay(), GameEngine.isQuestCompleted(24)),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setRadarTick((prev) => (prev + 1) % 100);
      setCurrentTime(getCurrentDate());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const send = () => {
    if (!sendBrev(getCurrentDay(), utkast)) return;
    setLetters(GameEngine.getSantaLetters());
    setUtkast("");
  };

  // Frozen: the blue bird circles Nordtoppen. Thawed: it flies home along the corridor.
  const angle = radarTick * 0.6;
  const fugl = frossent
    ? { left: 72 + Math.cos(angle) * 8, top: 45 + Math.sin(angle) * 14 }
    : { left: 72 - ((radarTick * 3) % 55), top: 40 };

  return (
    <RetroWindow title="BREVFUGLER — RADAR" onClose={onClose}>
      <div className="p-4 md:p-6 h-full overflow-y-auto space-y-6 bg-(--dark-crt)">
        {/* =====================================================================
            LIVE CRT ISFUGL-RADAR VIEWPORT (BERGEN / ULRIKEN <-> SNØFALL 90°N)
           ===================================================================== */}
        <div className="relative w-full h-52 md:h-60 border-4 border-(--neon-green)/70 bg-black overflow-hidden shadow-[0_0_24px_color-mix(in_oklab,var(--brass)_18%,transparent)]">
          {/* Split Painterly Surveillance Feeds: Left = Nordtoppen Relay, Right = Julius' Study */}
          <div className="absolute inset-0 grid grid-cols-2">
            <div className="relative overflow-hidden border-r border-(--neon-green)/40">
              <Image
                src={mediaUrl("feed/antenne-tarn.png")}
                alt="Ulriken / Nordtoppen Relé"
                fill
                className="object-cover animate-[tv-camera-pan_28s_ease-in-out_infinite]"
                style={{ filter: "contrast(1.1) brightness(0.85)" }}
                priority
              />
              {/* Pulsing Red Aviation Beacon */}
              <div
                className="absolute inset-0 pointer-events-none mix-blend-screen animate-pulse"
                style={{
                  background:
                    "radial-gradient(circle at 62.5% 10.8%, rgba(255, 40, 40, 0.85) 0%, transparent 16%)",
                }}
              />
            </div>

            <div className="relative overflow-hidden">
              <Image
                src={mediaUrl("feed/julius-kontor.png")}
                alt="Julius' Kontor og Brevhyller"
                fill
                className="object-cover animate-[tv-camera-pan_32s_ease-in-out_infinite]"
                style={{ filter: "contrast(1.08) brightness(0.9)" }}
                priority
              />
              {/* Warm Candlelight Glow */}
              <div
                className="absolute inset-0 pointer-events-none mix-blend-screen animate-[flicker_2.5s_infinite]"
                style={{
                  background:
                    "radial-gradient(circle at 48% 76%, rgba(255, 210, 80, 0.55) 0%, transparent 25%)",
                }}
              />
            </div>
          </div>

          {/* Radar Grid & Flight Trajectory SVG Overlay */}
          <svg
            viewBox="0 0 800 240"
            className="absolute inset-0 w-full h-full pointer-events-none z-15"
            preserveAspectRatio="none"
          >
            {/* Subtle Radar Polar Circles */}
            <circle
              cx="160"
              cy="155"
              r="45"
              fill="none"
              stroke="rgba(0, 255, 100, 0.35)"
              strokeDasharray="4 4"
            />
            <circle
              cx="640"
              cy="125"
              r="45"
              fill="none"
              stroke="rgba(255, 215, 0, 0.4)"
              strokeDasharray="4 4"
            />

            {/* Dashed Flight Corridor Arc: Landås/Ulriken -> Snøfall */}
            <path
              d="M 160 155 Q 400 25, 640 125"
              fill="none"
              stroke="#00ff66"
              strokeWidth="2.5"
              strokeDasharray="8 6"
            />
            <path
              d="M 640 125 Q 400 210, 160 155"
              fill="none"
              stroke="#ffd700"
              strokeWidth="2"
              strokeDasharray="5 7"
              opacity="0.75"
            />

            {/* Waypoint Nodes */}
            <circle cx="160" cy="155" r="6" fill="#00ff66" />
            <circle cx="640" cy="125" r="6" fill="#ffd700" />
          </svg>

          {/* The blue bird from the Crystal Cave */}
          <div
            className="absolute z-20 pointer-events-none transition-all duration-1000"
            style={{ left: `${fugl.left}%`, top: `${fugl.top}%` }}
          >
            <div className="flex items-center gap-1.5 bg-black/85 border border-(--cold-blue) px-2 py-0.5 text-base font-retro text-(--cold-blue) shadow-[0_0_10px_rgba(0,200,255,0.5)]">
              <span className="w-2 h-2 rounded-full bg-(--cold-blue) animate-ping" />
              <span>
                {frossent
                  ? "BLÅ FUGL: UKJENT AVSENDER"
                  : "BLÅ FUGL: PÅ VEI HJEM"}
              </span>
            </div>
          </div>

          {/* CRT Scanlines & Vignette */}
          <div
            className="absolute inset-0 pointer-events-none z-15"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.36) 0px, rgba(0,0,0,0.36) 1px, transparent 1px, transparent 3px)",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none z-15"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.75) 100%)",
            }}
          />

          {/* Top & Bottom Radar Telemetry OSD */}
          <div className="absolute inset-0 z-25 p-3 flex flex-col justify-between pointer-events-none font-retro">
            <div className="flex items-center justify-between gap-2">
              <div className="bg-black/80 border border-(--neon-green)/60 px-2.5 py-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-(--neon-green) animate-pulse" />
                <span className="text-base font-bold text-(--neon-green)">
                  LUFTKORRIDOR: DIREKTELINJEN (60.37°N) ⇄ SNØFALL (90.00°N)
                </span>
              </div>
              <div className="bg-black/80 border border-(--gold) px-2.5 py-1 text-base font-bold text-(--gold)">
                {currentTime.toLocaleTimeString("no-NO", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}{" "}
                | AKTIVE FUGLER: 1
              </div>
            </div>

            <div className="flex items-end justify-between gap-2">
              <div className="bg-black/85 border border-(--neon-green)/50 px-2.5 py-1 text-base text-(--neon-green)">
                📡 MOTTAK: ULRIKEN MAST (643 MOH)
              </div>
              <div className="bg-black/85 border border-(--gold)/60 px-2.5 py-1 text-base text-(--gold)">
                ❄ AVSENDER: KRYSTALLGROTTEN (NORDTOPPEN)
              </div>
            </div>
          </div>
        </div>

        {/* Frozen letter from the Crystal Cave */}
        {frossent ? (
          <div className="p-4 border-2 border-(--cold-blue) bg-(--cold-blue)/10 space-y-2">
            <div className="text-base font-bold text-(--cold-blue)">
              ❄ FRYST BREV
            </div>
            <div
              aria-hidden
              className="font-retro text-(--cold-blue)/40 blur-[3px] select-none"
            >
              ▒▒▒▒ ▒▒▒ ▒▒▒▒▒▒ ▒▒▒ ▒▒▒▒ ▒▒▒▒▒▒▒
            </div>
            <div className="text-base text-(--cold-blue)/80">
              Brevet sitter fast på vingen til den blå fuglen. Det tiner når
              linjen er varm.
            </div>
          </div>
        ) : (
          <div className="p-4 border-2 border-(--gold) bg-(--gold)/10 space-y-2">
            <div className="text-base font-bold text-(--gold)">
              💧 BREVET HAR TINT
            </div>
            <div className="text-base text-(--neon-green) leading-relaxed whitespace-pre-line">
              {TINT_BREV}
            </div>
            <div className="text-base text-(--cold-blue)">
              Fra: Vintervokteren, Krystallgrotten
            </div>
          </div>
        )}

        {/* Letters to Julius: stored locally for the parent guide; Julius does not reply here */}
        <div className="p-4 border-2 border-(--neon-green)/50 space-y-3">
          <label
            htmlFor="brev-til-julius"
            className="block text-base font-bold"
          >
            ✉ SKRIV BREV TIL JULIUS
          </label>
          <div className="text-base opacity-70">
            Skriv brevet på papir, og skriv det av her. Brevfuglen tar det med
            til Snøfall.
          </div>
          <textarea
            id="brev-til-julius"
            value={utkast}
            onChange={(e) => setUtkast(e.target.value)}
            placeholder="Kjære Julius ..."
            rows={5}
            className="w-full p-3 bg-(--dark-crt) border-2 border-(--neon-green) text-(--neon-green) text-base font-retro resize-none"
          />
          <button
            onClick={send}
            disabled={!utkast.trim()}
            className="w-full min-h-11 px-4 py-2 border-2 border-(--gold) bg-(--gold)/20 hover:bg-(--gold)/30 disabled:opacity-30 disabled:cursor-not-allowed text-(--gold) font-bold transition-colors cursor-pointer"
          >
            SEND BREVFUGL TIL SNØFALL
          </button>
          {letters.length > 0 && (
            <ul className="space-y-1 text-base">
              {letters.map((l) => (
                <li key={l.day} className="text-(--neon-green)/80">
                  ✓ Dag {l.day}: brevfugl sendt
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </RetroWindow>
  );
}
