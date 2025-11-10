"use client";

import { useState, useEffect } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { StorageManager } from "@/lib/storage";

interface NordpolTVProps {
  onClose: () => void;
  currentDay: number;
}

export function NordpolTV({ onClose, currentDay }: NordpolTVProps) {
  const [isDaytime, setIsDaytime] = useState(true);
  const [weather, setWeather] = useState<"clear" | "snow" | "storm">("clear");
  const [elfPositions, setElfPositions] = useState([20, 45, 70]);

  const crisisStatus = StorageManager.getCrisisStatus();
  const isAntennaBroken = currentDay >= 11 && !crisisStatus.antenna;

  // Animate elves moving across workshop
  useEffect(() => {
    if (isAntennaBroken) return;

    const interval = setInterval(() => {
      setElfPositions((prev) => prev.map((pos) => (pos + 2) % 100));
    }, 100);

    return () => clearInterval(interval);
  }, [isAntennaBroken]);

  // Day/night cycle
  useEffect(() => {
    if (isAntennaBroken) return;

    const interval = setInterval(() => {
      setIsDaytime((prev) => !prev);
    }, 8000);

    return () => clearInterval(interval);
  }, [isAntennaBroken]);

  // Weather changes
  useEffect(() => {
    if (isAntennaBroken) return;

    const weathers: Array<"clear" | "snow" | "storm"> = [
      "clear",
      "snow",
      "clear",
      "snow",
      "storm",
    ];
    let index = 0;

    const interval = setInterval(() => {
      setWeather(weathers[index]);
      index = (index + 1) % weathers.length;
    }, 5000);

    return () => clearInterval(interval);
  }, [isAntennaBroken]);

  return (
    <RetroWindow title="NORDPOL TV - LIVE VERKSTED" onClose={onClose}>
      <div className="p-6 h-full overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b-4 border-(--neon-green)/30">
          <Icons.Tv size={32} color="green" />
          <div className="flex-1">
            <div className="text-2xl font-bold tracking-wider">
              LIVE FRA VERKSTEDET
            </div>
            <div className="text-sm opacity-70">
              SANNTIDS OVERVÅKING AV PRODUKSJON
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 border-2 border-(--gold) bg-(--gold)/20">
            <div className="w-2 h-2 bg-(--gold) rounded-full animate-pulse-led"></div>
            <span className="text-(--gold) text-xs tracking-wider">
              LÅST OPP DAG 10
            </span>
          </div>
        </div>

        {/* TV Screen */}
        <div className="relative border-4 border-(--neon-green) bg-black aspect-video overflow-hidden">
          {isAntennaBroken ? (
            // Antenna Crisis Screen
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <div className="animate-[crt-shake_0.1s_infinite]">
                <Icons.Signal size={64} color="red" />
              </div>
              <div className="mt-6 space-y-4">
                <div className="text-2xl text-(--christmas-red) font-bold tracking-wider animate-pulse">
                  ⚠️ SIGNAL LOST ⚠️
                </div>
                <div className="text-lg text-(--christmas-red)">
                  ANTENNA MALFUNCTION
                </div>
                <div className="text-sm text-(--neon-green)/70 max-w-md">
                  Signalet fra Nordpolen er brutt! Sjekk NISSEMAIL for
                  instruksjoner om hvordan du kan reparere antennen.
                </div>
                <div className="mt-4 p-3 border-2 border-(--christmas-red)/50 bg-(--christmas-red)/10">
                  <div className="text-xs text-(--christmas-red)">
                    STATUS: Venter på antenne-reparasjon...
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Normal Workshop View
            <>
              {/* Background - Workshop */}
              <div
                className={`absolute inset-0 transition-all duration-1000 ${isDaytime
                    ? "bg-linear-to-b from-blue-400 to-blue-200"
                    : "bg-linear-to-b from-slate-900 to-slate-700"
                  }`}
              >
                {/* Snowfall particles */}
                {weather !== "clear" && (
                  <div className="absolute inset-0">
                    {Array.from({ length: weather === "storm" ? 50 : 20 }).map(
                      (_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-1 bg-white rounded-full animate-[fall_linear_infinite]"
                          style={{
                            left: `${(i * 17) % 100}%`,
                            top: "-5%",
                            animationDuration: `${3 + (i % 3)}s`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        ></div>
                      ),
                    )}
                  </div>
                )}

                {/* Workshop building */}
                <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-red-800 border-t-4 border-red-900">
                  {/* Windows */}
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="absolute w-12 h-16 bg-yellow-300 border-2 border-yellow-500"
                      style={{
                        left: `${20 + i * 20}%`,
                        top: "20%",
                      }}
                    >
                      <div className="absolute inset-0 grid grid-cols-2 gap-0">
                        <div className="border-r border-yellow-600"></div>
                        <div></div>
                      </div>
                    </div>
                  ))}

                  {/* Roof */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-0 h-0 border-l-200 border-l-transparent border-r-200 border-r-transparent border-b-50 border-b-red-900"></div>

                  {/* Chimney with smoke */}
                  <div className="absolute -top-16 left-1/4 w-8 h-20 bg-gray-700 border-2 border-gray-800">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-400 rounded-full opacity-50 animate-[rise_2s_ease-out_infinite]"
                        style={{
                          animationDelay: `${i * 0.7}s`,
                        }}
                      ></div>
                    ))}
                  </div>

                  {/* Animated Elves */}
                  {elfPositions.map((pos, i) => (
                    <div
                      key={i}
                      className="absolute bottom-4 w-6 h-8 transition-all duration-100"
                      style={{
                        left: `${pos}%`,
                      }}
                    >
                      {/* Simple elf sprite */}
                      <div className="w-full h-full relative">
                        {/* Head */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-pink-300 rounded-full"></div>
                        {/* Hat */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-2 bg-red-600"></div>
                        {/* Body */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-green-600"></div>
                        {/* Legs */}
                        <div className="absolute top-6 left-1 w-1 h-2 bg-green-700"></div>
                        <div className="absolute top-6 right-1 w-1 h-2 bg-green-700"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weather indicator */}
              <div className="absolute top-2 right-2 px-3 py-1 bg-black/70 border border-(--neon-green)">
                <span className="text-xs text-(--neon-green)">
                  {weather === "clear"
                    ? "☀️ KLART"
                    : weather === "snow"
                      ? "❄️ SNØ"
                      : "🌨️ STORM"}
                </span>
              </div>

              {/* Time indicator */}
              <div className="absolute top-2 left-2 px-3 py-1 bg-black/70 border border-(--neon-green)">
                <span className="text-xs text-(--neon-green)">
                  {isDaytime ? "☀️ DAG" : "🌙 NATT"}
                </span>
              </div>

              {/* Signal strength */}
              <div className="absolute bottom-2 right-2 px-3 py-1 bg-black/70 border border-(--neon-green) flex items-center gap-2">
                <Icons.Signal size={12} color="green" />
                <span className="text-xs text-(--neon-green)">STABIL</span>
              </div>
            </>
          )}
        </div>

        {/* Status Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border-2 border-(--neon-green)/30 space-y-1">
            <div className="text-xs text-(--neon-green)/70">NISSER AKTIVE</div>
            <div className="text-2xl text-(--neon-green) font-bold">
              {isAntennaBroken ? "---" : "247"}
            </div>
          </div>
          <div className="p-3 border-2 border-(--neon-green)/30 space-y-1">
            <div className="text-xs text-(--neon-green)/70">TEMPERATUR</div>
            <div className="text-2xl text-(--neon-green) font-bold">
              {isAntennaBroken ? "---" : "-12°C"}
            </div>
          </div>
        </div>

        {/* Info Message */}
        <div className="p-4 border-2 border-(--cold-blue)/30 bg-(--cold-blue)/5 text-(--cold-blue) text-xs">
          <div className="font-bold mb-1">📺 LIVE FEED</div>
          <div className="opacity-80">
            Direktesendt fra Nordpolen! Se nissene jobbe i sanntid. Værforhold
            og dag/natt-syklus oppdateres automatisk.
          </div>
        </div>
      </div>
    </RetroWindow>
  );
}
