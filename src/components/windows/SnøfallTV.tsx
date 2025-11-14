"use client";

import { useState, useEffect } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { GameEngine } from "@/lib/game-engine";
import { getCurrentDate } from "@/lib/date-utils";
import Image from "next/image";

interface SnøfallTVProps {
  onClose: () => void;
  currentDay: number;
}

type CameraView = "cam1" | "cam2" | "cam3" | "static";

export function SnøfallTV({ onClose, currentDay }: SnøfallTVProps) {
  const [weather, setWeather] = useState<"clear" | "snow" | "storm">("clear");
  const [currentCamera, setCurrentCamera] = useState<CameraView>("cam1");
  const [staticNoise, setStaticNoise] = useState(0);
  const [currentTime, setCurrentTime] = useState(getCurrentDate());

  const crisisStatus = GameEngine.getCrisisStatus();
  const isAntennaBroken = currentDay >= 11 && !crisisStatus.antenna;

  // Calculate daytime based on real time (6am-6pm = day)
  const hour = currentTime.getHours();
  const isDaytime = hour >= 6 && hour < 18;

  // Update time every second for clock display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentDate());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Static noise animation for grainy security cam effect
  useEffect(() => {
    const interval = setInterval(() => {
      setStaticNoise(Math.random());
    }, 50);

    return () => clearInterval(interval);
  }, []);

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
    }, 7000);

    return () => clearInterval(interval);
  }, [isAntennaBroken]);

  const handleCameraSwitch = (cam: CameraView) => {
    setCurrentCamera(cam);
  };

  return (
    <RetroWindow title="SNØFALL TV - LIVE VERKSTED" onClose={onClose}>
      <div className="p-6 h-full overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b-4 border-(--neon-green)/30">
          <Icons.Video size={32} color="green" />
          <div className="flex-1">
            <div className="text-2xl font-bold tracking-wider">
              SNØFALL OVERVÅKING
            </div>
            <div className="text-sm opacity-70">
              SIKKERHETSKAMERA - LIVE FEED
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 border-2 border-(--gold) bg-(--gold)/20">
            <div className="w-2 h-2 bg-(--gold) rounded-full animate-pulse-led"></div>
            <span className="text-(--gold) text-xs tracking-wider">
              LÅST OPP DAG 10
            </span>
          </div>
        </div>

        {/* TV Screen with Security Camera Effect */}
        <div className="relative border-4 border-(--neon-green) bg-black aspect-video overflow-hidden">
          {isAntennaBroken ? (
            // Antenna Crisis Screen
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <div className="animate-[crt-shake_0.1s_infinite]">
                <Icons.Alert size={64} color="red" />
              </div>
              <div className="mt-6 space-y-4">
                <div className="text-2xl text-(--christmas-red) font-bold tracking-wider animate-pulse">
                  ⚠️ SIGNAL LOST ⚠️
                </div>
                <div className="text-lg text-(--christmas-red)">
                  ANTENNA MALFUNCTION
                </div>
                <div className="text-sm text-(--neon-green)/70 max-w-md">
                  Signalet fra Snøfall er brutt! Sjekk NISSEMAIL for
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
            // Security Camera Views
            <>
              {/* CAM 1 - Village with static image */}
              {currentCamera === "cam1" && (
                <div className="absolute inset-0">
                  {/* Base village image */}
                  <div className="absolute inset-0">
                    <Image
                      src="/village-day.jpg"
                      alt="Snøfall village"
                      fill
                      className="object-cover"
                      style={{ imageRendering: "auto" }}
                    />
                  </div>
                  {/* Static noise overlay (always present) */}
                  <div
                    className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                      backgroundSize: "200px 200px",
                    }}
                  />
                  {/* Film grain effect - animated for retro camera feel */}
                  <div
                    className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none animate-[grain-shift_0.2s_steps(4)_infinite]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grainFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grainFilter)'/%3E%3C/svg%3E")`,
                      backgroundSize: "150px 150px",
                    }}
                  />
                  {/* Day/Night tint overlay */}
                  <div
                    className={`absolute inset-0 transition-all duration-2000 ${
                      isDaytime ? "bg-blue-400/10" : "bg-slate-950/70"
                    }`}
                  />
                  {/* Fog/mist layer for depth - always present, fades in/out */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-3000 ease-in-out"
                    style={{
                      opacity:
                        weather === "clear"
                          ? 0
                          : weather === "snow"
                            ? 0.3
                            : 0.7,
                    }}
                  >
                    {/* Multiple fog layers for parallax depth */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        background: `radial-gradient(ellipse 80% 60% at 30% 40%, rgba(255, 255, 255, 0.4) 0%, transparent 60%),
                                     radial-gradient(ellipse 60% 50% at 70% 60%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)`,
                        animation: "fog-drift 20s ease-in-out infinite",
                      }}
                    />
                    <div
                      className="absolute inset-0 opacity-15"
                      style={{
                        background: `radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 60%)`,
                        animation: "fog-drift 15s ease-in-out infinite reverse",
                      }}
                    />
                  </div>
                  {/* Snow storm intensity overlay - fades in during storm */}
                  <div
                    className="absolute inset-0 bg-white/40 transition-opacity duration-3000 ease-in-out"
                    style={{
                      opacity: weather === "storm" ? 1 : 0,
                    }}
                  />
                  {/* Whiteout effect during heavy storm */}
                  <div
                    className="absolute inset-0 transition-opacity duration-3000 ease-in-out"
                    style={{
                      opacity: weather === "storm" ? 0.6 : 0,
                      background:
                        "radial-gradient(ellipse 120% 100% at 50% 30%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.5) 40%, transparent 70%)",
                    }}
                  />{" "}
                  {/* Snowfall particles - always rendered, opacity controlled */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-2000 ease-in-out"
                    style={{
                      opacity:
                        weather === "clear" ? 0 : weather === "snow" ? 0.9 : 1,
                    }}
                  >
                    {/* Background snow (slower, smaller, blurred) */}
                    <div
                      className="absolute inset-0 blur-sm transition-opacity duration-2000 ease-in-out"
                      style={{
                        opacity: weather === "clear" ? 0 : 0.4,
                      }}
                    >
                      {Array.from({ length: 40 }).map((_, i) => {
                        const xStart = (i * 17 + Math.sin(i) * 20) % 100;
                        const xEnd = xStart + Math.cos(i) * 3;
                        const opacity = 0.3 + (i % 7) * 0.1;
                        const size = 1 + (i % 3) * 0.5;
                        const duration = 8 + (i % 5) * 2;
                        const delay = -(i * 0.3) % duration;
                        const isStormExtra = i >= 15;

                        return (
                          <div
                            key={`bg-${i}`}
                            className="absolute bg-white rounded-full transition-opacity duration-2000 ease-in-out"
                            style={
                              {
                                width: `${size}px`,
                                height: `${size}px`,
                                left: `${xStart}%`,
                                opacity:
                                  weather === "storm"
                                    ? opacity
                                    : isStormExtra
                                      ? 0
                                      : opacity,
                                animation: `snowfall ${duration}s ${delay}s linear infinite`,
                                "--x-start": `${xStart}vw`,
                                "--x-mid": `${xStart + Math.sin(i * 2) * 2}vw`,
                                "--x-end": `${xEnd}vw`,
                              } as React.CSSProperties
                            }
                          />
                        );
                      })}
                    </div>

                    {/* Midground snow (medium speed and size) */}
                    <div
                      className="absolute inset-0 transition-opacity duration-2000 ease-in-out"
                      style={{
                        opacity: weather === "clear" ? 0 : 0.7,
                      }}
                    >
                      {Array.from({ length: 50 }).map((_, i) => {
                        const xStart = (i * 13 + Math.sin(i * 1.5) * 15) % 100;
                        const xEnd = xStart + Math.cos(i * 1.5) * 4;
                        const opacity = 0.4 + (i % 6) * 0.1;
                        const size = 2 + (i % 3) * 0.5;
                        const duration = 5 + (i % 4) * 1.5;
                        const delay = -(i * 0.25) % duration;
                        const isStormExtra = i >= 20;

                        return (
                          <div
                            key={`mg-${i}`}
                            className="absolute bg-white rounded-full transition-opacity duration-2000 ease-in-out"
                            style={
                              {
                                width: `${size}px`,
                                height: `${size}px`,
                                left: `${xStart}%`,
                                opacity:
                                  weather === "storm"
                                    ? opacity
                                    : isStormExtra
                                      ? 0
                                      : opacity,
                                animation: `snowfall ${duration}s ${delay}s linear infinite`,
                                "--x-start": `${xStart}vw`,
                                "--x-mid": `${xStart + Math.sin(i * 3) * 3}vw`,
                                "--x-end": `${xEnd}vw`,
                              } as React.CSSProperties
                            }
                          />
                        );
                      })}
                    </div>

                    {/* Foreground snow (faster, larger, sharp) */}
                    <div className="absolute inset-0">
                      {Array.from({ length: 30 }).map((_, i) => {
                        const xStart = (i * 11 + Math.sin(i * 2.5) * 10) % 100;
                        const xEnd = xStart + Math.cos(i * 2) * 5;
                        const opacity = 0.6 + (i % 5) * 0.08;
                        const size = 3 + (i % 4) * 0.8;
                        const duration = 3 + (i % 3) * 1;
                        const delay = -(i * 0.2) % duration;
                        const isStormExtra = i >= 10;

                        return (
                          <div
                            key={`fg-${i}`}
                            className="absolute bg-white rounded-full transition-opacity duration-2000 ease-in-out"
                            style={
                              {
                                width: `${size}px`,
                                height: `${size}px`,
                                left: `${xStart}%`,
                                opacity:
                                  weather === "storm"
                                    ? opacity
                                    : isStormExtra
                                      ? 0
                                      : opacity,
                                animation: `snowfall ${duration}s ${delay}s linear infinite`,
                                boxShadow: "0 0 3px rgba(255, 255, 255, 0.9)",
                                "--x-start": `${xStart}vw`,
                                "--x-mid": `${xStart + Math.sin(i * 4) * 4}vw`,
                                "--x-end": `${xEnd}vw`,
                              } as React.CSSProperties
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* CAM 2 - Shows "NO SIGNAL" after a moment */}
              {currentCamera === "cam2" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="text-center space-y-4 animate-pulse">
                    <div className="text-4xl text-(--neon-green)/30">▓▓▓▓▓</div>
                    <div className="text-lg text-(--neon-green)/50">
                      KAMERA UTILGJENGELIG
                    </div>
                    <div className="text-xs text-(--neon-green)/30">
                      TEKNISK FEIL - PRØV ANNET KAMERA
                    </div>
                  </div>
                </div>
              )}

              {/* CAM 3 - Offline/Broken */}
              {currentCamera === "cam3" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="text-center space-y-3">
                    <Icons.Close size={48} color="red" />
                    <div className="text-2xl text-(--christmas-red) font-bold animate-pulse">
                      FRAKOBLET
                    </div>
                    <div className="text-sm text-(--christmas-red)/70">
                      Kamera CAM 3 er offline
                    </div>
                  </div>
                </div>
              )}

              {/* CAM 4 - Pure static noise */}
              {currentCamera === "static" && (
                <div className="absolute inset-0 bg-black">
                  <div
                    className="absolute inset-0 opacity-90"
                    style={{
                      backgroundImage: `repeating-linear-gradient(
                        0deg,
                        rgba(255,255,255,${staticNoise * 0.1}) 0px,
                        rgba(0,0,0,${staticNoise * 0.2}) 2px
                      )`,
                      animation: "flicker 0.1s infinite",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-xs text-(--neon-green)/20 animate-pulse">
                      INGEN SIGNAL
                    </div>
                  </div>
                </div>
              )}

              {/* Security Camera UI Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Scanlines effect */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      0deg,
                      rgba(0, 255, 0, 0.03) 0px,
                      transparent 2px,
                      transparent 4px
                    )`,
                  }}
                />

                {/* CRT vignette */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.7) 100%)`,
                  }}
                />

                {/* Grainy static overlay */}
                <div
                  className="absolute inset-0 opacity-10 mix-blend-overlay"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.6'/%3E%3C/svg%3E")`,
                  }}
                />

                {/* Camera info overlay - top left */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 border border-(--neon-green)/50 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-(--christmas-red) rounded-full animate-pulse-led"></div>
                  <span className="text-[10px] text-(--neon-green) font-mono">
                    REC
                  </span>
                </div>

                {/* Camera number - top center */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/80 border border-(--neon-green)/50">
                  <span className="text-xs text-(--neon-green) font-bold tracking-wider">
                    {currentCamera === "cam1" && "KAMERA 01 - LANDSBY"}
                    {currentCamera === "cam2" && "KAMERA 02 - OFFLINE"}
                    {currentCamera === "cam3" && "KAMERA 03 - FRAKOBLET"}
                    {currentCamera === "static" && "KAMERA 04 - INGEN SIGNAL"}
                  </span>
                </div>

                {/* Timestamp - top right */}
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 border border-(--neon-green)/50 text-[10px] text-(--neon-green) font-mono">
                  {new Date().toLocaleTimeString("no-NO", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>

                {/* Weather indicator - only on CAM 1 */}
                {currentCamera === "cam1" && (
                  <div className="absolute top-12 right-2 px-2 py-1 bg-black/80 border border-(--neon-green)/50 flex items-center gap-1">
                    {weather === "clear" && (
                      <>
                        <Icons.Sun size={12} color="green" />
                        <span className="text-[10px] text-(--neon-green)">
                          KLART
                        </span>
                      </>
                    )}
                    {weather === "snow" && (
                      <>
                        <Icons.Cloud size={12} color="green" />
                        <span className="text-[10px] text-(--neon-green)">
                          SNØ
                        </span>
                      </>
                    )}
                    {weather === "storm" && (
                      <>
                        <Icons.Cloud size={12} color="green" />
                        <span className="text-[10px] text-(--neon-green)">
                          SNØSTORM
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Time of day - only on CAM 1 */}
                {currentCamera === "cam1" && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/80 border border-(--neon-green)/50 flex items-center gap-1">
                    {isDaytime ? (
                      <>
                        <Icons.Sun size={12} color="green" />
                        <span className="text-[10px] text-(--neon-green)">
                          DAG
                        </span>
                      </>
                    ) : (
                      <>
                        <Icons.Moon size={12} color="green" />
                        <span className="text-[10px] text-(--neon-green)">
                          NATT
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Signal strength - bottom right */}
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 border border-(--neon-green)/50 flex items-center gap-1">
                  {currentCamera === "cam1" && (
                    <Icons.Signal3 size={12} color="green" />
                  )}
                  {currentCamera === "cam2" && (
                    <Icons.Signal1 size={12} color="green" />
                  )}
                  {currentCamera === "cam3" && (
                    <Icons.SignalOff size={12} color="red" />
                  )}
                  {currentCamera === "static" && (
                    <Icons.Signal0 size={12} color="red" />
                  )}
                  <span className="text-[10px] text-(--neon-green) whitespace-nowrap">
                    {currentCamera === "cam1" && "STABIL"}
                    {currentCamera === "cam2" && "SVAK"}
                    {currentCamera === "cam3" && "TAPT"}
                    {currentCamera === "static" && "INGEN"}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Camera Control Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => handleCameraSwitch("cam1")}
            className={`p-2 border-2 transition-colors ${
              currentCamera === "cam1"
                ? "border-(--neon-green) bg-(--neon-green)/20 text-(--neon-green)"
                : "border-(--neon-green)/30 text-(--neon-green)/50 hover:border-(--neon-green)/50"
            }`}
          >
            <div className="text-xs font-bold">CAM 1</div>
            <div className="text-[10px]">LANDSBY</div>
          </button>
          <button
            onClick={() => handleCameraSwitch("cam2")}
            className={`p-2 border-2 transition-colors ${
              currentCamera === "cam2"
                ? "border-(--neon-green) bg-(--neon-green)/20 text-(--neon-green)"
                : "border-(--neon-green)/30 text-(--neon-green)/50 hover:border-(--neon-green)/50"
            }`}
          >
            <div className="text-xs font-bold">CAM 2</div>
            <div className="text-[10px]">VERKSTED</div>
          </button>
          <button
            onClick={() => handleCameraSwitch("cam3")}
            className={`p-2 border-2 transition-colors ${
              currentCamera === "cam3"
                ? "border-(--christmas-red) bg-(--christmas-red)/20 text-(--christmas-red)"
                : "border-(--neon-green)/30 text-(--neon-green)/50 hover:border-(--neon-green)/50"
            }`}
          >
            <div className="text-xs font-bold">CAM 3</div>
            <div className="text-[10px]">OFFLINE</div>
          </button>
          <button
            onClick={() => handleCameraSwitch("static")}
            className={`p-2 border-2 transition-colors ${
              currentCamera === "static"
                ? "border-(--neon-green) bg-(--neon-green)/20 text-(--neon-green)"
                : "border-(--neon-green)/30 text-(--neon-green)/50 hover:border-(--neon-green)/50"
            }`}
          >
            <div className="text-xs font-bold">CAM 4</div>
            <div className="text-[10px]">GARASJE</div>
          </button>
        </div>

        {/* Status Info */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 border-2 border-(--neon-green)/30 space-y-1">
            <div className="text-xs text-(--neon-green)/70">
              KAMERAER AKTIVE
            </div>
            <div className="text-2xl text-(--neon-green) font-bold">
              {isAntennaBroken ? "0/4" : "1/4"}
            </div>
          </div>
          <div className="p-3 border-2 border-(--neon-green)/30 space-y-1">
            <div className="text-xs text-(--neon-green)/70">OPPETID</div>
            <div className="text-2xl text-(--neon-green) font-bold">
              {isAntennaBroken ? "---" : "99.8%"}
            </div>
          </div>
          <div className="p-3 border-2 border-(--neon-green)/30 space-y-1">
            <div className="text-xs text-(--neon-green)/70">KVALITET</div>
            <div className="text-2xl text-(--neon-green) font-bold">
              {isAntennaBroken
                ? "---"
                : currentCamera === "cam1"
                  ? "NORMAL"
                  : "LAV"}
            </div>
          </div>
        </div>

        {/* Info Message */}
        <div className="p-4 border-2 border-(--cold-blue)/30 bg-(--cold-blue)/5 text-(--cold-blue) text-xs">
          <div className="font-bold mb-1">📹 SIKKERHETSKAMERA SYSTEM</div>
          <div className="opacity-80">
            Overvåk Snøfall gjennom vårt retro sikkerhetskamera-system. Prøv
            ulike kameraer - noen fungerer bedre enn andre! Vær og
            dag/natt-syklus oppdateres automatisk.
          </div>
        </div>
      </div>
    </RetroWindow>
  );
}
