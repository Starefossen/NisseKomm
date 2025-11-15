"use client";

import { useState, useEffect } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { LEDIndicator } from "../ui/LEDIndicator";
import { Icons } from "@/lib/icons";
import { GameEngine } from "@/lib/game-engine";
import { getCurrentDate } from "@/lib/date-utils";
import {
  getWeatherForDay,
  getMorketIntensity,
  getSunProgress,
  getMoonProgress,
  getTwilightPhase,
  getTwilightBrightness,
  getTwilightHueRotate,
  getTemperatureLEDColor,
  getParticleCount,
  getStaticIntensity,
  getBaseImage,
  type WeatherCondition,
} from "@/lib/weather-config";
import Image from "next/image";

interface SnøfallTVProps {
  onClose: () => void;
  currentDay: number;
}

type CameraView = "cam1" | "cam2" | "cam3" | "static";

export function SnøfallTV({ onClose, currentDay }: SnøfallTVProps) {
  // Get today's weather configuration
  const todayWeather = getWeatherForDay(currentDay);
  const morketIntensity = getMorketIntensity(currentDay);

  // State management
  const [currentCamera, setCurrentCamera] = useState<CameraView>("cam1");
  const [staticNoise, setStaticNoise] = useState(0);
  const [currentTime, setCurrentTime] = useState(getCurrentDate());

  // Crisis detection
  const crisisStatus = GameEngine.getCrisisStatus();
  const isAntennaBroken = currentDay >= 11 && !crisisStatus.antenna;

  // Time-based calculations
  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();
  const totalMinutes = hour * 60 + minute;

  // Determine day/night using SUN_TIMES from config (8:00am - 5:00pm = day)
  const sunriseFull = 8 * 60; // 8:00 = 480 minutes
  const sunsetStart = 17 * 60; // 17:00 = 1020 minutes
  const isDaytime = totalMinutes >= sunriseFull && totalMinutes < sunsetStart;

  // Celestial body positions
  const sunProgress = getSunProgress(currentTime);
  const moonProgress = getMoonProgress(currentTime);
  const twilightPhase = getTwilightPhase(currentTime);

  // Image and lighting
  const baseImage = getBaseImage(todayWeather.condition, isDaytime);
  const brightness = getTwilightBrightness(currentTime, isDaytime);
  const hueRotate = getTwilightHueRotate(currentTime);

  // Weather effects
  const particleCount = getParticleCount(todayWeather.condition);
  const staticIntensity = getStaticIntensity(
    todayWeather.condition,
    isAntennaBroken,
  );

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentDate());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Static noise animation
  useEffect(() => {
    const interval = setInterval(() => {
      setStaticNoise(Math.random());
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleCameraSwitch = (cam: CameraView) => {
    setCurrentCamera(cam);
  };

  // Get weather icon based on condition
  const getWeatherIcon = (condition: WeatherCondition) => {
    switch (condition) {
      case "clear":
        return <Icons.Sun size={16} color="green" />;
      case "light-snow":
      case "snow":
      case "heavy-snow":
        return <Icons.Snow size={16} color="green" />;
      case "storm":
        return <Icons.Cloud size={16} color="green" />;
      case "darkness":
        return <Icons.Moon size={16} color="blue" />;
      default:
        return <Icons.Cloud size={16} color="green" />;
    }
  };

  // Get weather label
  const getWeatherLabel = (condition: WeatherCondition) => {
    const labels: Record<WeatherCondition, string> = {
      clear: "KLART",
      "light-snow": "LETT SNØ",
      snow: "SNØ",
      "heavy-snow": "TUNG SNØ",
      storm: "STORM",
      darkness: "MØRKET",
    };
    return labels[condition];
  };

  return (
    <RetroWindow title="SNØFALL TV - VÆRPROGNOSERING" onClose={onClose}>
      <div className="p-4 lg:p-6 h-full overflow-y-auto space-y-4">
        {/* Camera Feed with Overlay */}
        <div className="relative aspect-video bg-black border-4 border-(--neon-green) overflow-hidden">
          {/* Weather Metrics Header Bar Overlay (only visible when not in crisis) */}
          {!isAntennaBroken && (
            <div className="absolute top-0 left-0 right-0 z-20 grid grid-cols-3 gap-2 p-2 bg-black/80 border-b-2 border-(--neon-green)/30">
              {/* Temperature Card */}
              <div className="p-2 border border-dashed border-(--neon-green)/50 bg-black/60 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] opacity-70">TEMPERATUR</div>
                  <LEDIndicator
                    color={getTemperatureLEDColor(todayWeather.temperature)}
                  />
                </div>
                <div className="text-lg font-bold text-(--neon-green)">
                  {todayWeather.temperature}°C
                </div>
              </div>

              {/* Weather Condition Card */}
              <div className="p-2 border border-dashed border-(--neon-green)/50 bg-black/60 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] opacity-70">FORHOLD</div>
                  <LEDIndicator
                    color={
                      todayWeather.condition === "storm"
                        ? "red"
                        : todayWeather.condition === "darkness"
                          ? "blue"
                          : "green"
                    }
                  />
                </div>
                <div className="flex items-center gap-1">
                  {getWeatherIcon(todayWeather.condition)}
                  <div className="text-xs font-bold text-(--neon-green)">
                    {getWeatherLabel(todayWeather.condition)}
                  </div>
                </div>
              </div>

              {/* Time of Day Card */}
              <div className="p-2 border border-dashed border-(--neon-green)/50 bg-black/60 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] opacity-70">DAGSLYS</div>
                  <LEDIndicator color="green" />
                </div>
                <div className="flex items-center gap-1">
                  {isDaytime ? (
                    <Icons.Sun size={16} color="green" />
                  ) : (
                    <Icons.Moon size={16} color="green" />
                  )}
                  <div className="text-xs font-bold text-(--neon-green)">
                    {isDaytime ? "DAG" : "NATT"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TV Screen with Security Camera Effect */}
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
              {/* CAM 1 - Village with realistic weather */}
              {currentCamera === "cam1" && (
                <div className="absolute inset-0">
                  {/* Base village image with dynamic lighting */}
                  <div
                    className="absolute inset-0 transition-all duration-[30000ms] ease-in-out"
                    style={{
                      filter: `brightness(${brightness}) hue-rotate(${hueRotate}deg)`,
                    }}
                  >
                    <Image
                      src={`/feed/snøfall-${baseImage}.png`}
                      alt="Snøfall village"
                      fill
                      className="object-cover"
                      style={{ imageRendering: "auto" }}
                      priority
                    />
                  </div>

                  {/* Celestial Bodies Layer */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Sun - visible during day, hidden during storm */}
                    {sunProgress >= 0 &&
                      todayWeather.condition !== "storm" &&
                      baseImage !== "storm" && (
                        <div
                          className="absolute transition-opacity duration-[30000ms] ease-in-out"
                          style={{
                            // Arc path across horizon above mountains
                            left: `calc(50% + ${Math.cos((sunProgress - 0.5) * Math.PI) * 45}%)`,
                            top: `calc(25% - ${Math.sin(sunProgress * Math.PI) * 15}%)`,
                            opacity:
                              twilightPhase === "dawn"
                                ? sunProgress
                                : twilightPhase === "dusk"
                                  ? 1 - sunProgress / 2
                                  : 1,
                          }}
                        >
                          {/* Sun glow */}
                          <div
                            className="absolute"
                            style={{
                              width: "80px",
                              height: "80px",
                              marginLeft: "-40px",
                              marginTop: "-40px",
                              background:
                                "radial-gradient(circle, rgba(255, 220, 100, 0.8) 0%, rgba(255, 180, 60, 0.4) 40%, transparent 70%)",
                              filter: "blur(8px)",
                            }}
                          />
                          {/* Sun core */}
                          <div
                            className="absolute"
                            style={{
                              width: "30px",
                              height: "30px",
                              marginLeft: "-15px",
                              marginTop: "-15px",
                              background:
                                "radial-gradient(circle, rgb(255, 240, 150) 0%, rgb(255, 200, 80) 100%)",
                              borderRadius: "50%",
                              boxShadow: "0 0 20px rgba(255, 220, 100, 0.8)",
                            }}
                          />
                        </div>
                      )}

                    {/* Moon - visible during night, hidden during storm */}
                    {moonProgress >= 0 &&
                      todayWeather.condition !== "storm" &&
                      baseImage !== "storm" && (
                        <div
                          className="absolute transition-opacity duration-[30000ms] ease-in-out"
                          style={{
                            // Arc path across sky (opposite of sun)
                            left: `calc(50% + ${Math.cos((moonProgress - 0.5) * Math.PI) * 40}%)`,
                            top: `calc(20% - ${Math.sin(moonProgress * Math.PI) * 12}%)`,
                            opacity: twilightPhase ? 0.3 : 1,
                          }}
                        >
                          {/* Moon glow */}
                          <div
                            className="absolute"
                            style={{
                              width: "60px",
                              height: "60px",
                              marginLeft: "-30px",
                              marginTop: "-30px",
                              background:
                                "radial-gradient(circle, rgba(200, 220, 255, 0.5) 0%, rgba(150, 180, 255, 0.2) 50%, transparent 70%)",
                              filter: "blur(6px)",
                            }}
                          />
                          {/* Moon core */}
                          <div
                            className="absolute"
                            style={{
                              width: "24px",
                              height: "24px",
                              marginLeft: "-12px",
                              marginTop: "-12px",
                              background:
                                "radial-gradient(circle, rgb(240, 245, 255) 0%, rgb(200, 215, 240) 100%)",
                              borderRadius: "50%",
                              boxShadow: "0 0 15px rgba(200, 220, 255, 0.6)",
                            }}
                          />
                        </div>
                      )}
                  </div>

                  {/* Mørket Darkness Overlay (Days 7-20) */}
                  {morketIntensity > 0 && (
                    <div
                      className="absolute inset-0 transition-opacity duration-1000"
                      style={{
                        background: `radial-gradient(ellipse at center, rgba(40, 0, 80, ${morketIntensity * 0.7}) 0%, rgba(20, 0, 50, ${morketIntensity}) 70%)`,
                        mixBlendMode: "multiply",
                      }}
                    />
                  )}

                  {/* Static noise overlay (intensity varies by weather) */}
                  <div
                    className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${staticIntensity}' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                      backgroundSize: "200px 200px",
                    }}
                  />

                  {/* Film grain effect */}
                  <div
                    className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none animate-[grain-shift_0.2s_steps(4)_infinite]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grainFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grainFilter)'/%3E%3C/svg%3E")`,
                      backgroundSize: "150px 150px",
                    }}
                  />

                  {/* Snow Particles System */}
                  {particleCount > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Background layer - slowest, smallest, most blur */}
                      <div className="absolute inset-0 blur-sm">
                        {Array.from({
                          length: Math.floor(particleCount * 0.3),
                        }).map((_, i) => {
                          const xStart = (i * 17 + Math.sin(i) * 20) % 100;
                          const xEnd = xStart + Math.cos(i) * 3;
                          const opacity = 0.3 + (i % 7) * 0.05;
                          const size = 1 + (i % 3) * 0.5;
                          const duration = 10 + (i % 6) * 2;
                          const delay = -(i * 0.4) % duration;

                          return (
                            <div
                              key={`bg-${i}`}
                              className="absolute bg-white rounded-full"
                              style={
                                {
                                  width: `${size}px`,
                                  height: `${size}px`,
                                  left: `${xStart}%`,
                                  opacity,
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

                      {/* Midground layer - medium speed and size */}
                      <div className="absolute inset-0">
                        {Array.from({
                          length: Math.floor(particleCount * 0.4),
                        }).map((_, i) => {
                          const xStart =
                            (i * 13 + Math.sin(i * 1.5) * 15) % 100;
                          const xEnd = xStart + Math.cos(i * 1.5) * 5;
                          const opacity = 0.4 + (i % 6) * 0.08;
                          const size = 2 + (i % 3) * 0.7;
                          const duration = 6 + (i % 5) * 1.5;
                          const delay = -(i * 0.3) % duration;

                          return (
                            <div
                              key={`mg-${i}`}
                              className="absolute bg-white rounded-full"
                              style={
                                {
                                  width: `${size}px`,
                                  height: `${size}px`,
                                  left: `${xStart}%`,
                                  opacity,
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

                      {/* Foreground layer - fastest, largest, sharpest */}
                      <div className="absolute inset-0">
                        {Array.from({
                          length: Math.floor(particleCount * 0.3),
                        }).map((_, i) => {
                          const xStart =
                            (i * 11 + Math.sin(i * 2.5) * 10) % 100;
                          const xEnd = xStart + Math.cos(i * 2) * 6;
                          const opacity = 0.6 + (i % 5) * 0.08;
                          const size = 3 + (i % 4) * 1;
                          const duration = 3 + (i % 3) * 1.2;
                          const delay = -(i * 0.2) % duration;

                          return (
                            <div
                              key={`fg-${i}`}
                              className="absolute bg-white rounded-full"
                              style={
                                {
                                  width: `${size}px`,
                                  height: `${size}px`,
                                  left: `${xStart}%`,
                                  opacity,
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
                  )}

                  {/* Storm whiteout overlay */}
                  {todayWeather.condition === "storm" && (
                    <>
                      <div className="absolute inset-0 bg-white/40 transition-opacity duration-1000" />
                      <div
                        className="absolute inset-0 transition-opacity duration-1000"
                        style={{
                          background:
                            "radial-gradient(ellipse 120% 100% at 50% 30%, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 40%, transparent 70%)",
                        }}
                      />
                    </>
                  )}

                  {/* Security Camera UI Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Scanlines */}
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

                    {/* Camera info - top left */}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 border border-(--neon-green)/50 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-(--christmas-red) rounded-full animate-pulse-led"></div>
                      <span className="text-[10px] text-(--neon-green) font-mono">
                        REC
                      </span>
                    </div>

                    {/* Camera label - top center */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/80 border border-(--neon-green)/50">
                      <span className="text-xs text-(--neon-green) font-bold tracking-wider">
                        KAMERA 01 - SNØFALL LANDSBY
                      </span>
                    </div>

                    {/* Timestamp - top right */}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 border border-(--neon-green)/50 text-[10px] text-(--neon-green) font-mono">
                      {currentTime.toLocaleTimeString("no-NO", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </div>

                    {/* Day indicator - bottom left */}
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/80 border border-(--neon-green)/50 flex items-center gap-1">
                      <span className="text-[10px] text-(--neon-green)">
                        DAG {currentDay}/24
                      </span>
                    </div>

                    {/* Signal strength - bottom right */}
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 border border-(--neon-green)/50 flex items-center gap-1">
                      <Icons.Signal3 size={12} color="green" />
                      <span className="text-[10px] text-(--neon-green)">
                        STABIL
                      </span>
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
            </>
          )}
        </div>

        {/* Camera Controls */}
        <div className="grid grid-cols-4 gap-4">
          <button
            onClick={() => handleCameraSwitch("cam1")}
            disabled={isAntennaBroken}
            className={`p-2 border-2 transition-colors ${isAntennaBroken
                ? "border-(--neon-green)/10 text-(--neon-green)/20 opacity-30 cursor-not-allowed"
                : currentCamera === "cam1"
                  ? "border-(--neon-green) bg-(--neon-green)/20 text-(--neon-green)"
                  : "border-(--neon-green)/30 text-(--neon-green)/50 hover:border-(--neon-green)/50"
              }`}
          >
            <div className="text-xs font-bold">CAM 1</div>
            <div className="text-[10px]">VERKSTED</div>
          </button>
          <button
            onClick={() => handleCameraSwitch("cam2")}
            disabled={isAntennaBroken}
            className={`p-2 border-2 transition-colors ${isAntennaBroken
                ? "border-(--neon-green)/10 text-(--neon-green)/20 opacity-30 cursor-not-allowed"
                : currentCamera === "cam2"
                  ? "border-(--neon-green) bg-(--neon-green)/20 text-(--neon-green)"
                  : "border-(--neon-green)/30 text-(--neon-green)/50 hover:border-(--neon-green)/50"
              }`}
          >
            <div className="text-xs font-bold">CAM 2</div>
            <div className="text-[10px]">STALL</div>
          </button>
          <button
            onClick={() => handleCameraSwitch("cam3")}
            disabled={isAntennaBroken}
            className={`p-2 border-2 transition-colors ${isAntennaBroken
                ? "border-(--neon-green)/10 text-(--neon-green)/20 opacity-30 cursor-not-allowed"
                : currentCamera === "cam3"
                  ? "border-(--neon-green) bg-(--neon-green)/20 text-(--neon-green)"
                  : "border-(--neon-green)/30 text-(--neon-green)/50 hover:border-(--neon-green)/50"
              }`}
          >
            <div className="text-xs font-bold">CAM 3</div>
            <div className="text-[10px]">OFFLINE</div>
          </button>
          <button
            onClick={() => handleCameraSwitch("static")}
            disabled={isAntennaBroken}
            className={`p-2 border-2 transition-colors ${isAntennaBroken
                ? "border-(--neon-green)/10 text-(--neon-green)/20 opacity-30 cursor-not-allowed"
                : currentCamera === "static"
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
            <div className="text-xs text-(--neon-green)/70">VÆRDATA</div>
            <div className="text-2xl text-(--neon-green) font-bold">
              {isAntennaBroken ? "---" : "LIVE"}
            </div>
          </div>
          <div className="p-3 border-2 border-(--neon-green)/30 space-y-1">
            <div className="text-xs text-(--neon-green)/70">KVALITET</div>
            <div className="text-2xl text-(--neon-green) font-bold">
              {isAntennaBroken ? "---" : currentCamera === "cam1" ? "HD" : "SD"}
            </div>
          </div>
        </div>

        {/* Weather Story Event (if any) */}
        {!isAntennaBroken && todayWeather.storyEvent && (
          <div className="p-4 border-2 border-(--gold) bg-(--gold)/10 text-(--gold) text-xs">
            <div className="font-bold mb-1">⚠️ VÆRVARSEL</div>
            <div className="opacity-90">{todayWeather.storyEvent}</div>
          </div>
        )}

        {/* Info Message */}
        <div className="p-4 border-2 border-(--cold-blue)/30 bg-(--cold-blue)/5 text-(--cold-blue) text-xs">
          <div className="font-bold mb-1">🌨️ VÆRPROGNOSERING</div>
          <div className="opacity-80">
            Sanntids værdata fra Snøfall. {todayWeather.description} Oppdateres
            automatisk hver dag ved midnatt.
          </div>
        </div>
      </div>
    </RetroWindow>
  );
}
