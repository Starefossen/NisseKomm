"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { RetroWindow } from "../ui/RetroWindow";
import { JuliusVideo } from "../modules/JuliusVideo";
import { LEDIndicator } from "../ui/LEDIndicator";
import { Icons } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";
import { GameEngine } from "@/lib/game-engine";
import { getCurrentDay, getCurrentDate } from "@/lib/date-utils";
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

interface SnøfallTVProps {
  onClose: () => void;
  currentDay?: number;
}

type ChannelId = 1 | 2 | 3 | 4;
type MiniGameId = "kretskort" | "sorterer" | "slede" | "zapper";

const KULDE_INTERCEPTS: Record<
  number,
  { title: string; transcript: string; telemetry: string }
> = {
  3: {
    title: "85,0 MHz // UKJENT SENDER",
    transcript:
      "Er det noen der? Linjen deres er varm. Jeg kjente den helt her nede. Jeg la litt rim på den, bare så jeg kunne holde i den.",
    telemetry: "85,0 MHz // KRYSTALLGROTTEN // SEKTOR 01",
  },
  7: {
    title: "85,0 MHz // SIGNATUR",
    transcript:
      "Orakelet deres leter etter navnet mitt. Ingen har sagt det på et år. Si det, når dere finner det.",
    telemetry: "85,0 MHz // −42,8 °C // SIGNATUR FANGET",
  },
  10: {
    title: "FARGENE",
    transcript:
      "Fargene er hos meg nå. Rødt. Grønt. Jeg hadde glemt hvordan de så ut. Jeg skal passe godt på dem.",
    telemetry: "85,0 MHz // KROMATISK DRENERING 71 %",
  },
  11: {
    title: "ANTENNEN",
    transcript:
      "Antennen deres roper så høyt mot Bergen. Jeg la is på den, så den kunne høre på meg i stedet. Ingen hører på meg.",
    telemetry: "85,0 MHz // ANTENNEN VED TJERNET // IS",
  },
  13: {
    title: "LYSENE",
    transcript:
      "Lysene deres. Jeg så dem gjennom linjen i natt. Jeg husker ikke når jeg så lys sist.",
    telemetry: "85,0 MHz // KRYSTALLGROTTEN // STILLE",
  },
  16: {
    title: "BÅNDET",
    transcript:
      "Jeg snudde båndet til Winter. Nå ser hun opp. Nå ser hun hit. Det var alt jeg ville.",
    telemetry: "85,0 MHz // PAKKESENTRALEN // BÅNDET SNUDD",
  },
  21: {
    title: "DET ER KALDT HER NEDE",
    transcript: "Det er kaldt her nede. Jeg ville bare se lyset deres.",
    telemetry: "85,0 MHz // 94 % // …",
  },
};

interface TVScenarioExample {
  id: string;
  label: string;
  channel: ChannelId;
  day: number;
  sightingNote: string;
  lensMode?: "standard" | "prisme" | "radar" | "nordlys";
  fuses?: [boolean, boolean, boolean];
  boilerHot?: boolean;
  centrifugeSpinning?: boolean;
  pressureTurbo?: boolean;
  pirateIntercept?: boolean;
  frequencyMhz?: number;
  showCam4Hud?: boolean;
}

const TV_SCENARIO_EXAMPLES: TVScenarioExample[] = [
  {
    id: "torget-vinter",
    label: "🏮 Torget: Vinter-patrulje",
    channel: 1,
    day: 1,
    lensMode: "standard",
    sightingNote:
      "OBSERVASJON: Varmt lykteskjær glir over snøtorget mens skygger beveger seg bak de opplyste tømmervinduene.",
  },
  {
    id: "ulriken-brevfugl",
    label: "🦅 Byfjellene: Brevfugl-flukt",
    channel: 1,
    day: 5,
    lensMode: "radar",
    sightingNote:
      "OBSERVASJON: Luftrumsradaren fanger et varmt optisk ekko i lav høyde over fjellkammen på kurs mot byfjellene.",
  },
  {
    id: "lab-iq-nattskift",
    label: "⚡ Lab: IQ på nattskift",
    channel: 2,
    day: 2,
    fuses: [true, true, true],
    boilerHot: false,
    centrifugeSpinning: false,
    pressureTurbo: false,
    sightingNote:
      "OBSERVASJON: Blåhvite loddeglimt reflekteres i kobberrørene mens IQs skygge faller over arbeidsbenken.",
  },
  {
    id: "lab-karamell-damp",
    label: "🧪 Lab: Karamell & Sentrifuge",
    channel: 2,
    day: 15,
    fuses: [true, true, true],
    boilerHot: true,
    centrifugeSpinning: true,
    pressureTurbo: true,
    sightingNote:
      "OBSERVASJON: Organisk damp slører linsen over kobberkolben mens sentrifugen gløder på høyt turtall.",
  },
  {
    id: "kontor-julius-katt",
    label: "📖 Kontor: Julius & Krøniken",
    channel: 3,
    day: 1,
    pirateIntercept: false,
    sightingNote:
      "OBSERVASJON: Varm peisglød, støvkorn i lyskjeglen og damp fra gløggkoppen ved den åpne Snøfall-krøniken.",
  },
  {
    id: "grotte-kulde-skygge",
    label: "❄️ 85.0 MHz: Kuldes Spøkelsesbilde",
    channel: 3,
    day: 13,
    pirateIntercept: true,
    sightingNote:
      "OBSERVASJON: Analogt dobbelteksponert spøkelsesbilde (RF multipath) fra Krystallgrotten blør gjennom billedrøret på 85.0 MHz.",
  },
  {
    id: "himmel-slede-nordlys",
    label: "🌌 Himmel: Slede i Nordlys",
    channel: 1,
    day: 17,
    lensMode: "nordlys",
    sightingNote:
      "OBSERVASJON: Polarstrålen danser over Snøfall mens Rudolfs røde ledeglimt og stjernesporet krysser nattehimmelen.",
  },
  {
    id: "tarn-storm-tekniker",
    label: "📡 Tårn: Storm & Spøkelsesbølge",
    channel: 4,
    day: 11,
    frequencyMhz: 90,
    showCam4Hud: false,
    sightingNote:
      "OBSERVASJON: Roterende varsellys i snøstormen på Nordtoppen mens Krystallgrottens spøkelsesekko forvrenger bærebølgen.",
  },
];

/**
 * Real-time HTML5 Canvas overlay that generates authentic analog CRT/VHS noise:
 * - Per-pixel RF snow static
 * - Rolling VHS tracking distortion bar
 * - Occasional horizontal sync tear lines & chromatic glitch flashes
 */
function AnalogTVOverlayCanvas({
  staticLevel,
  isSwitching,
  isKuldeActive,
  isVHSMode,
  onGlitchSpike,
}: {
  staticLevel: number; // 0.05 to 1.0
  isSwitching: boolean;
  isKuldeActive: boolean;
  isVHSMode: boolean;
  onGlitchSpike?: (scale: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 320;
    const height = 180;
    canvas.width = width;
    canvas.height = height;

    const imageData = ctx.createImageData(width, height);
    const buf32 = new Uint32Array(imageData.data.buffer);

    let trackingY = Math.random() * height;
    let trackingY2 = (trackingY + height * 0.45) % height;
    let frameCount = 0;
    let animId = 0;
    let lastTime = 0;

    const render = (timestamp: number) => {
      animId = requestAnimationFrame(render);
      // Target ~24fps for authentic analog broadcast cadence
      if (timestamp - lastTime < 40) return;
      lastTime = timestamp;
      frameCount++;

      const effectiveStatic = isSwitching
        ? 0.88
        : Math.min(
            0.75,
            staticLevel + (isKuldeActive ? 0.16 : 0) + (isVHSMode ? 0.04 : 0),
          );

      // Periodic random horizontal tear / glitch spike
      const randomSpike =
        isSwitching ||
        (isKuldeActive && frameCount % 19 === 0) ||
        frameCount % 67 === 0 ||
        (frameCount % 31 === 0 && Math.random() < 0.35);

      if (onGlitchSpike) {
        if (isSwitching) {
          onGlitchSpike(28);
        } else if (randomSpike) {
          onGlitchSpike(isKuldeActive ? 18 : 9);
        } else {
          onGlitchSpike(0);
        }
      }

      trackingY = (trackingY + (isVHSMode ? 1.4 : 0.9)) % height;
      trackingY2 = (trackingY2 + 0.55) % height;

      const tearY = randomSpike ? Math.floor(Math.random() * height) : -100;
      const tearHeight = randomSpike ? 6 + Math.floor(Math.random() * 16) : 0;

      // Fill pixel buffer with sparse analog RF snow + tracking bands
      for (let y = 0; y < height; y++) {
        const distTrack1 = Math.abs(y - trackingY);
        const distTrack2 = Math.abs(y - trackingY2);
        const inTrackBar =
          distTrack1 < (isVHSMode ? 7 : 4) || (isKuldeActive && distTrack2 < 5);
        const inTearBar = y >= tearY && y <= tearY + tearHeight;
        const inBottomVHSHead = isVHSMode && y > height - 6;

        let rowDensity = effectiveStatic * 0.22;
        if (inTrackBar) rowDensity = Math.min(0.85, effectiveStatic * 0.95);
        if (inTearBar) rowDensity = 0.75;
        if (inBottomVHSHead) rowDensity = 0.8;

        const rowOffset = y * width;
        for (let x = 0; x < width; x++) {
          if (Math.random() < rowDensity) {
            const luma = 150 + ((Math.random() * 105) | 0);
            const alpha = isSwitching
              ? 180 + ((Math.random() * 75) | 0)
              : inTearBar || inBottomVHSHead
                ? 140
                : inTrackBar
                  ? 95
                  : (effectiveStatic * 75) | 0;

            // Subtle cyan/ice tint when Kulde interference is active
            const r = isKuldeActive && inTearBar ? luma >> 1 : luma;
            const g = luma;
            const b = luma;

            buf32[rowOffset + x] = (alpha << 24) | (b << 16) | (g << 8) | r;
          } else {
            buf32[rowOffset + x] = 0;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Draw crisp horizontal sync tear line when spiking
      if (randomSpike) {
        ctx.fillStyle = isKuldeActive
          ? "rgba(0, 221, 255, 0.28)"
          : "rgba(255, 255, 255, 0.22)";
        ctx.fillRect(0, tearY, width, 2);
      }

      // VHS bottom head-switching line
      if (isVHSMode) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.fillRect(
          Math.floor(Math.random() * 14),
          height - 4,
          width - Math.floor(Math.random() * 20),
          2,
        );
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [staticLevel, isSwitching, isKuldeActive, isVHSMode, onGlitchSpike]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-25 mix-blend-screen"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export function SnøfallTV({ onClose, currentDay: propDay }: SnøfallTVProps) {
  const initialDay = Math.max(1, Math.min(24, propDay ?? getCurrentDay()));
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);

  const maxDay = Math.max(1, Math.min(24, getCurrentDay()));

  const [activeChannel, setActiveChannel] = useState<ChannelId>(1);
  const [activeScenarioId, setActiveScenarioId] =
    useState<string>("torget-vinter");
  const [isSwitchingChannel, setIsSwitchingChannel] = useState(false);
  const [glitchScale, setGlitchScale] = useState(0);
  const [currentTime, setCurrentTime] = useState(getCurrentDate());

  // CAM 1 optical overlay modes (Prism / Radar / Aurora)
  const [cam1LensMode, setCam1LensMode] = useState<
    "standard" | "prisme" | "radar" | "nordlys"
  >("standard");

  // CAM 2 lab equipment states (aligned to /feed/iq-verksted.png)
  const [fuses, setFuses] = useState<[boolean, boolean, boolean]>([
    true,
    false,
    true,
  ]);
  const [boilerHot, setBoilerHot] = useState(false);
  const [centrifugeSpinning, setCentrifugeSpinning] = useState(false);
  const [pressureTurbo, setPressureTurbo] = useState(false);

  // CAM 3 VHS & Teletext states
  const [pirateIntercept, setPirateIntercept] = useState(false);
  const [vhsFrameCounter, setVhsFrameCounter] = useState(0);

  const activeKuldeIntercept = KULDE_INTERCEPTS[selectedDay] || {
    title: "85,0 MHz // UKJENT SENDER",
    transcript: "…",
    telemetry: "85,0 MHz // KRYSTALLGROTTEN // INGEN STEMME",
  };

  // CAM 4 Antenna & HUD states
  const [frequencyMhz, setFrequencyMhz] = useState<number>(
    initialDay === 11 ? 75 : initialDay === 12 ? 100 : 90,
  );
  const [showCam4Hud, setShowCam4Hud] = useState(false);
  const [activeMiniGame, setActiveMiniGame] = useState<MiniGameId>("kretskort");

  // Technical calibration states inside CAM 4 HUD
  const [circuitNodes, setCircuitNodes] = useState<boolean[]>([
    true,
    false,
    false,
    true,
    false,
    false,
  ]);
  const [sorterStep, setSorterStep] = useState(0);
  const [sleighLane, setSleighLane] = useState<0 | 1 | 2>(1);
  const [sleighProgress, setSleighProgress] = useState(40);
  const [zapperLocks, setZapperLocks] = useState<[boolean, boolean, boolean]>([
    false,
    false,
    false,
  ]);

  // Weather & time calculations from weather-config
  const todayWeather = getWeatherForDay(selectedDay);
  const morketIntensity = getMorketIntensity(selectedDay);
  const crisisStatus = GameEngine.getCrisisStatus();
  const isAntennaCrisis =
    selectedDay === 11 && !crisisStatus.antenna && frequencyMhz !== 75;

  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();
  const totalMinutes = hour * 60 + minute;
  const isDaytime = totalMinutes >= 8 * 60 && totalMinutes < 17 * 60;

  const sunProgress = getSunProgress(currentTime);
  const moonProgress = getMoonProgress(currentTime);
  const twilightPhase = getTwilightPhase(currentTime);

  const baseImage = getBaseImage(todayWeather.condition, isDaytime);
  const brightness = getTwilightBrightness(currentTime, isDaytime);
  const hueRotate = getTwilightHueRotate(currentTime);
  const particleCount = getParticleCount(todayWeather.condition);
  const staticIntensity = getStaticIntensity(
    todayWeather.condition,
    isAntennaCrisis,
  );

  // Live clock + VHS frame counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentDate());
      setVhsFrameCounter((prev) => (prev + 1) % 3600);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerChannelSwitchEffect = useCallback(() => {
    setIsSwitchingChannel(true);
    setTimeout(() => {
      setIsSwitchingChannel(false);
    }, 320);
  }, []);

  const handleChannelSelect = (channel: ChannelId) => {
    if (channel === activeChannel) return;
    SoundManager.playSound("click");
    triggerChannelSwitchEffect();
    setActiveChannel(channel);
  };

  const handleDaySelect = (day: number) => {
    const clamped = Math.max(1, Math.min(maxDay, day));
    SoundManager.playSound("click");
    triggerChannelSwitchEffect();
    setPirateIntercept(false);
    setSelectedDay(clamped);

    // Automatically set lens mode on CAM 1 for special visual days
    if (clamped === 3 || clamped === 10) {
      setCam1LensMode("prisme");
    } else if (clamped === 5 || clamped === 14) {
      setCam1LensMode("radar");
    } else if (clamped === 17) {
      setCam1LensMode("nordlys");
    } else {
      setCam1LensMode("standard");
    }

    if (clamped === 11) setFrequencyMhz(75);
    else if (clamped === 12) setFrequencyMhz(100);
    else if (clamped === 7) setFrequencyMhz(90);
  };

  const handleScenarioSelect = (scenario: TVScenarioExample) => {
    SoundManager.playSound("click");
    triggerChannelSwitchEffect();
    setActiveScenarioId(scenario.id);
    setActiveChannel(scenario.channel);
    setSelectedDay(Math.min(maxDay, scenario.day));

    if (scenario.lensMode) setCam1LensMode(scenario.lensMode);
    if (scenario.fuses) setFuses(scenario.fuses);
    if (typeof scenario.boilerHot === "boolean")
      setBoilerHot(scenario.boilerHot);
    if (typeof scenario.centrifugeSpinning === "boolean")
      setCentrifugeSpinning(scenario.centrifugeSpinning);
    if (typeof scenario.pressureTurbo === "boolean")
      setPressureTurbo(scenario.pressureTurbo);
    if (typeof scenario.pirateIntercept === "boolean")
      setPirateIntercept(scenario.pirateIntercept);
    if (typeof scenario.frequencyMhz === "number")
      setFrequencyMhz(scenario.frequencyMhz);
    if (typeof scenario.showCam4Hud === "boolean")
      setShowCam4Hud(scenario.showCam4Hud);
  };

  const activeScenario =
    TV_SCENARIO_EXAMPLES.find((s) => s.id === activeScenarioId) ??
    TV_SCENARIO_EXAMPLES[0];

  const handleGlitchSpike = useCallback((scale: number) => {
    setGlitchScale(scale);
  }, []);

  const getWeatherIcon = (condition: WeatherCondition) => {
    switch (condition) {
      case "clear":
        return <Icons.Sun size={14} color="green" />;
      case "light-snow":
      case "snow":
      case "heavy-snow":
        return <Icons.Snow size={14} color="green" />;
      case "storm":
        return <Icons.Cloud size={14} color="green" />;
      case "darkness":
        return <Icons.Moon size={14} color="blue" />;
    }
  };

  const getWeatherLabel = (condition: WeatherCondition) => {
    const labels: Record<WeatherCondition, string> = {
      clear: "KLART",
      "light-snow": "LETT SNØ",
      snow: "SNØ",
      "heavy-snow": "TUNG SNØ",
      storm: "STORM",
      darkness: "FROST-SKYGGE",
    };
    return labels[condition];
  };

  const totalVoltage =
    (fuses[0] ? 12 : 0) + (fuses[1] ? 16 : 0) + (fuses[2] ? 20 : 0);
  const allCircuitConnected = circuitNodes.every(Boolean);
  const allZapperLocked = zapperLocks.every(Boolean);
  const isKuldeInterference =
    (selectedDay >= 7 && selectedDay <= 20 && !allZapperLocked) ||
    (activeChannel === 4 && frequencyMhz === 90);

  return (
    <RetroWindow
      title="SNØFALL TV - OVERVÅKNING & KRINGKASTING"
      onClose={onClose}
    >
      <div className="p-3 lg:p-5 h-full overflow-y-auto space-y-3 select-none">
        {/* Hidden SVG Filters for Real-Time Analog Horizontal Tearing, RF Multipath Ghosting & Vapor */}
        <svg className="hidden" aria-hidden="true">
          <defs>
            <filter
              id="tv-analog-displacement"
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.008 0.35"
                numOctaves="2"
                seed={vhsFrameCounter % 50}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={glitchScale}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
            <filter
              id="crt-ghost-anomaly"
              x="-15%"
              y="-15%"
              width="130%"
              height="130%"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.016 0.085"
                numOctaves="3"
                seed={(vhsFrameCounter >> 1) % 40}
                result="ghostNoise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="ghostNoise"
                scale={glitchScale > 0 ? 22 : 12}
                xChannelSelector="R"
                yChannelSelector="B"
              />
            </filter>
            <filter
              id="crt-vapor-wisp"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.028 0.055"
                numOctaves="2"
                seed={(vhsFrameCounter >> 2) % 30}
                result="vaporNoise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="vaporNoise"
                scale="10"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        {/* =====================================================================
            MAIN 16:9 CRT TELEVISION VIEWPORT (PURE VIDEO FEED + CAMERA OSD)
           ===================================================================== */}
        <div className="relative aspect-video bg-black border-4 border-(--neon-green) overflow-hidden shadow-[inset_0_0_90px_rgba(0,0,0,0.9)]">
          {/* Real-time HTML5 Canvas Analog RF Snow & VHS Tracking Engine */}
          <AnalogTVOverlayCanvas
            staticLevel={(staticIntensity - 0.8) * 0.7}
            isSwitching={isSwitchingChannel}
            isKuldeActive={isKuldeInterference}
            isVHSMode={activeChannel === 3}
            onGlitchSpike={handleGlitchSpike}
          />

          {/* Film grain & CRT scanline glass layers */}
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none z-20 animate-[grain-shift_0.18s_steps(4)_infinite]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grainFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.2' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grainFilter)'/%3E%3C/svg%3E")`,
              backgroundSize: "160px 160px",
            }}
          />

          {/* Fine CRT Horizontal Scanlines + Curved Tube Vignette + Glass Reflection */}
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.38) 0px,
                rgba(0, 0, 0, 0.38) 1px,
                transparent 1px,
                transparent 3px
              )`,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.45) 82%, rgba(0, 0, 0, 0.88) 100%)",
            }}
          />
          {/* Subtle curved CRT glass reflection streak */}
          <div
            className="absolute inset-0 pointer-events-none z-20 opacity-15"
            style={{
              background:
                "linear-gradient(125deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 18%, transparent 42%)",
            }}
          />

          {/* Kulde Crystalline Frost Vignette (Days 7-20 or Pirate Frequency) */}
          {(morketIntensity > 0 ||
            pirateIntercept ||
            (activeChannel === 4 && frequencyMhz === 85)) && (
            <div
              className="absolute inset-0 pointer-events-none z-22 transition-opacity duration-500"
              style={{
                opacity:
                  pirateIntercept ||
                  (activeChannel === 4 && frequencyMhz === 85)
                    ? 0.85
                    : Math.min(0.75, morketIntensity * 0.7),
                background:
                  "radial-gradient(ellipse at center, transparent 52%, rgba(0, 195, 255, 0.22) 80%, rgba(0, 225, 255, 0.55) 100%)",
                boxShadow: "inset 0 0 36px rgba(0, 221, 255, 0.45)",
              }}
            />
          )}

          {/* Analog RF Multipath Ghosting ("Spøkelsesbilde i Billedrøret") */}
          {(pirateIntercept ||
            (activeChannel === 4 &&
              (frequencyMhz === 85 || frequencyMhz === 90)) ||
            (glitchScale > 0 &&
              (morketIntensity > 0 ||
                selectedDay === 3 ||
                selectedDay === 13 ||
                selectedDay === 21)) ||
            selectedDay === 7 ||
            selectedDay === 13 ||
            selectedDay === 21) && (
            <div className="absolute inset-0 pointer-events-none z-21 overflow-hidden">
              {/* Layer 1: Horizontally Phase-Shifted Double-Exposure Echo of Kulde's Cavern */}
              <div
                className="absolute inset-0 mix-blend-screen transition-opacity duration-300"
                style={{
                  opacity:
                    glitchScale > 0
                      ? 0.46
                      : pirateIntercept ||
                          (activeChannel === 4 && frequencyMhz === 85)
                        ? 0.32
                        : 0.16,
                  transform: `translate(${glitchScale > 0 ? 14 : 7}px, -3px) scale(1.04)`,
                  filter:
                    "url(#crt-ghost-anomaly) hue-rotate(14deg) contrast(1.45) brightness(0.95)",
                }}
              >
                <Image
                  src="/feed/kulde-grotte.png"
                  alt="Analogt spøkelsesekko fra Krystallgrotten"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Layer 2: Turbulent Scanline-Interlaced Cryo-Pareidolia Anomaly in the Phosphor */}
              <div
                className="absolute inset-0 mix-blend-color-dodge"
                style={{
                  animation: "tv-kulde-lurk 11s ease-in-out infinite",
                  filter: "url(#crt-ghost-anomaly)",
                  background: `
                    radial-gradient(ellipse 16% 28% at 49% 43%, rgba(0, 235, 255, 0.24) 0%, rgba(0, 120, 210, 0.11) 48%, transparent 78%),
                    radial-gradient(circle at 46.5% 36.5%, rgba(185, 252, 255, 0.55) 0%, transparent 1.6%),
                    radial-gradient(circle at 51.5% 36.5%, rgba(185, 252, 255, 0.55) 0%, transparent 1.6%),
                    repeating-linear-gradient(0deg, rgba(0, 240, 255, 0.08) 0px, rgba(0, 240, 255, 0.08) 2px, transparent 2px, transparent 6px)
                  `,
                }}
              />
            </div>
          )}

          {/* Displaced Video Signal Container */}
          <div
            className={`absolute inset-0 transition-transform duration-75 ${
              isSwitchingChannel
                ? "scale-y-95 translate-y-2 brightness-150 contrast-200"
                : "animate-[tv-hsync-jitter_7s_infinite]"
            }`}
            style={{
              filter:
                glitchScale > 0
                  ? `url(#tv-analog-displacement) drop-shadow(${glitchScale > 12 ? "-4px" : "-2px"} 0 0 rgba(255,0,80,0.65)) drop-shadow(${glitchScale > 12 ? "4px" : "2px"} 0 0 rgba(0,225,255,0.65))`
                  : undefined,
            }}
          >
            {/* ===============================================================
                CHANNEL 1: SNØFALL LANDSBY (REAL PAINTERLY WEATHER FEED)
               =============================================================== */}
            {activeChannel === 1 && (
              <div className="absolute inset-0">
                {/* Top Weather Telemetry Overlay Bar */}
                <div className="absolute top-0 left-0 right-0 z-30 grid grid-cols-3 gap-2 p-2 bg-black/75 border-b border-(--neon-green)/30 backdrop-blur-[1px]">
                  <div className="px-2.5 py-1 border border-dashed border-(--neon-green)/40 bg-black/60 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-(--neon-green)/70">
                        TEMPERATUR
                      </div>
                      <div className="text-base font-bold text-(--neon-green) leading-tight">
                        {todayWeather.temperature}°C
                      </div>
                    </div>
                    <LEDIndicator
                      color={getTemperatureLEDColor(todayWeather.temperature)}
                    />
                  </div>

                  <div className="px-2.5 py-1 border border-dashed border-(--neon-green)/40 bg-black/60 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-(--neon-green)/70">
                        FORHOLD
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-(--neon-green)">
                        {getWeatherIcon(todayWeather.condition)}
                        <span>{getWeatherLabel(todayWeather.condition)}</span>
                      </div>
                    </div>
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

                  <div className="px-2.5 py-1 border border-dashed border-(--neon-green)/40 bg-black/60 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-(--neon-green)/70">
                        LINSESENSOR
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-(--gold)">
                        <span>{cam1LensMode.toUpperCase()}</span>
                      </div>
                    </div>
                    <LEDIndicator color="green" />
                  </div>
                </div>

                {/* Base Village Camera Image with slow motorized CCTV pan */}
                <div
                  className="absolute inset-0 animate-[tv-camera-pan_28s_ease-in-out_infinite]"
                  style={{
                    filter: `brightness(${brightness}) hue-rotate(${hueRotate}deg) contrast(1.06)`,
                  }}
                >
                  <Image
                    src={`/feed/snøfall-${baseImage}.png`}
                    alt="Snøfall landsby"
                    fill
                    className="object-cover"
                    priority
                  />

                  {/* Warm flickering glow inside village cabin windows */}
                  <div
                    className="absolute inset-0 mix-blend-screen pointer-events-none animate-[flicker_2.5s_infinite]"
                    style={{
                      background:
                        "radial-gradient(circle at 48.5% 78%, rgba(255, 190, 70, 0.35) 0%, transparent 12%), radial-gradient(circle at 25% 76%, rgba(255, 180, 60, 0.25) 0%, transparent 10%), radial-gradient(circle at 68% 76%, rgba(255, 180, 60, 0.25) 0%, transparent 10%)",
                    }}
                  />

                  {/* Subtle Interior Window Shadow Modulation (Elves moving behind lit cabin panes) */}
                  <div
                    className="absolute inset-0 mix-blend-multiply pointer-events-none"
                    style={{
                      animation: "tv-iq-tinker 18s ease-in-out infinite",
                      background:
                        "radial-gradient(ellipse 3.5% 5% at 48.5% 78%, rgba(10, 6, 4, 0.42) 0%, transparent 75%), radial-gradient(ellipse 3% 4.5% at 25.2% 76%, rgba(10, 6, 4, 0.35) 0%, transparent 75%)",
                    }}
                  />

                  {/* Organic Turbulence-Warped Chimney Vapor Wisps from the 3 Village Cabins */}
                  {[
                    { left: "25.5%", top: "58%", delay: "0s", dur: "7.5s" },
                    {
                      left: "48.8%",
                      top: "59.5%",
                      delay: "-2.8s",
                      dur: "8.2s",
                    },
                    {
                      left: "68.5%",
                      top: "58.5%",
                      delay: "-5.1s",
                      dur: "7.8s",
                    },
                  ].map((chimney, cIdx) => (
                    <div
                      key={`chimney-${cIdx}`}
                      className="absolute pointer-events-none mix-blend-screen"
                      style={{
                        left: chimney.left,
                        top: chimney.top,
                        width: "36px",
                        height: "52px",
                        marginLeft: "-18px",
                        filter: "url(#crt-vapor-wisp)",
                        animation: `tv-chimney-smoke ${chimney.dur} ${chimney.delay} ease-in-out infinite`,
                      }}
                    >
                      <div
                        className="w-full h-full blur-[5px]"
                        style={{
                          background:
                            "radial-gradient(ellipse 40% 70% at 50% 65%, rgba(215, 230, 250, 0.28) 0%, rgba(185, 205, 235, 0.12) 55%, transparent 85%)",
                        }}
                      />
                    </div>
                  ))}

                  {/* High-Altitude Optical Radar Glint & Trail (Radar Mode / Days 4, 5, 14) */}
                  {(cam1LensMode === "radar" ||
                    selectedDay === 4 ||
                    selectedDay === 5 ||
                    selectedDay === 14) && (
                    <div
                      className="absolute inset-x-12 top-[27%] h-8 pointer-events-none overflow-visible mix-blend-screen"
                      style={{
                        animation: "tv-sky-glide 24s linear infinite",
                      }}
                    >
                      <div
                        className="w-24 h-4 blur-[1.5px]"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent 0%, rgba(0, 255, 136, 0.18) 55%, rgba(255, 215, 90, 0.85) 92%, rgba(255, 255, 255, 0.95) 100%)",
                        }}
                      />
                    </div>
                  )}

                  {/* Distant Aurora Starlight & Rudolf Red-Beacon Trail (Nordlys Mode / Days 17+) */}
                  {(cam1LensMode === "nordlys" || selectedDay >= 17) && (
                    <div
                      className="absolute inset-x-8 top-[18%] h-8 pointer-events-none overflow-visible mix-blend-screen"
                      style={{
                        animation: "tv-sky-glide 32s linear infinite",
                      }}
                    >
                      <div
                        className="w-36 h-3 blur-[1.2px]"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent 0%, rgba(255, 215, 110, 0.22) 45%, rgba(255, 230, 150, 0.65) 85%, rgba(255, 50, 50, 0.95) 100%)",
                        }}
                      />
                    </div>
                  )}

                  {/* Warm Golden Lantern Light Pool Gliding Across the Snow Square */}
                  <div
                    className="absolute pointer-events-none mix-blend-screen"
                    style={{
                      left: "28%",
                      top: "76%",
                      width: "34%",
                      height: "12%",
                    }}
                  >
                    <div
                      className="w-20 h-10 relative"
                      style={{
                        animation: "tv-lantern-patrol 44s ease-in-out infinite",
                      }}
                    >
                      <div
                        className="absolute inset-0 rounded-full blur-[5px] animate-[flicker_1.8s_infinite]"
                        style={{
                          background:
                            "radial-gradient(ellipse at center, rgba(255, 215, 110, 0.62) 0%, rgba(255, 165, 55, 0.28) 50%, transparent 82%)",
                        }}
                      />
                      <div
                        className="absolute left-8 top-3 w-2.5 h-2.5 rounded-full blur-[1px]"
                        style={{
                          background:
                            "radial-gradient(circle, rgba(255, 245, 200, 0.9) 0%, rgba(255, 190, 70, 0.4) 70%, transparent 100%)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Celestial Bodies Layer (Sun & Moon) */}
                <div className="absolute inset-0 pointer-events-none">
                  {sunProgress >= 0 &&
                    todayWeather.condition !== "storm" &&
                    baseImage !== "storm" && (
                      <div
                        className="absolute"
                        style={{
                          left: `calc(50% + ${Math.cos((sunProgress - 0.5) * Math.PI) * 42}%)`,
                          top: `calc(26% - ${Math.sin(sunProgress * Math.PI) * 14}%)`,
                          opacity:
                            twilightPhase === "dawn"
                              ? sunProgress
                              : twilightPhase === "dusk"
                                ? 1 - sunProgress / 2
                                : 1,
                        }}
                      >
                        <div
                          className="absolute -ml-10 -mt-10 w-20 h-20 rounded-full blur-md"
                          style={{
                            background:
                              "radial-gradient(circle, rgba(255, 220, 100, 0.8) 0%, rgba(255, 180, 60, 0.35) 45%, transparent 70%)",
                          }}
                        />
                      </div>
                    )}

                  {moonProgress >= 0 &&
                    todayWeather.condition !== "storm" &&
                    baseImage !== "storm" && (
                      <div
                        className="absolute"
                        style={{
                          left: `calc(50% + ${Math.cos((moonProgress - 0.5) * Math.PI) * 38}%)`,
                          top: `calc(22% - ${Math.sin(moonProgress * Math.PI) * 11}%)`,
                          opacity: twilightPhase ? 0.35 : 0.85,
                        }}
                      >
                        <div
                          className="absolute -ml-7 -mt-7 w-14 h-14 rounded-full blur-sm"
                          style={{
                            background:
                              "radial-gradient(circle, rgba(200, 225, 255, 0.55) 0%, rgba(150, 185, 255, 0.2) 50%, transparent 70%)",
                          }}
                        />
                      </div>
                    )}
                </div>

                {/* Organic Aurora Borealis Curtains (Days 17, 21-24, or Nordlys lens mode) */}
                {(cam1LensMode === "nordlys" ||
                  selectedDay === 17 ||
                  selectedDay >= 21) && (
                  <div className="absolute inset-x-0 top-0 h-2/3 pointer-events-none mix-blend-screen overflow-hidden">
                    <div
                      className="w-full h-full blur-xl animate-[aurora-sway_9s_ease-in-out_infinite]"
                      style={{
                        background:
                          "radial-gradient(ellipse 90% 40% at 35% 28%, rgba(0, 255, 140, 0.48) 0%, rgba(0, 200, 255, 0.22) 45%, transparent 75%), radial-gradient(ellipse 80% 35% at 70% 22%, rgba(0, 255, 100, 0.42) 0%, rgba(140, 80, 255, 0.18) 50%, transparent 75%)",
                      }}
                    />
                  </div>
                )}

                {/* Optical Prism Lens Flare Dispersion (Days 3, 10 or Prisme lens mode) */}
                {(cam1LensMode === "prisme" ||
                  selectedDay === 3 ||
                  selectedDay === 10) && (
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-screen animate-pulse"
                    style={{
                      background:
                        "linear-gradient(115deg, transparent 20%, rgba(255, 50, 50, 0.28) 34%, rgba(255, 215, 0, 0.30) 44%, rgba(0, 255, 120, 0.28) 54%, rgba(0, 210, 255, 0.32) 64%, transparent 78%)",
                    }}
                  />
                )}

                {/* Bird/Airspace Tracking Radar HUD (Days 4, 5, 14 or Radar lens mode) */}
                {(cam1LensMode === "radar" ||
                  selectedDay === 4 ||
                  selectedDay === 5 ||
                  selectedDay === 14) && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    {/* Animated target reticle tracking across the mountain sky */}
                    <div
                      className="absolute w-24 h-24 border border-(--neon-green)/70 flex items-center justify-center transition-all duration-1000"
                      style={{
                        left: `${32 + ((vhsFrameCounter * 3) % 38)}%`,
                        top: `${24 + Math.sin(vhsFrameCounter * 0.4) * 6}%`,
                      }}
                    >
                      <div className="w-2 h-2 bg-(--gold) rounded-full animate-ping" />
                      <div className="absolute -bottom-5 left-0 bg-black/80 px-1.5 py-0.5 text-[10px] text-(--neon-green) whitespace-nowrap border border-(--neon-green)/50">
                        {selectedDay === 5 || selectedDay === 14
                          ? "BREVFUGL"
                          : "RUDOLF"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Kulde / Darkness Vignette Overlay (Days 7-20) */}
                {morketIntensity > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at center, rgba(10, 25, 65, ${morketIntensity * 0.55}) 0%, rgba(5, 10, 35, ${morketIntensity * 0.9}) 75%)`,
                      mixBlendMode: "multiply",
                    }}
                  />
                )}

                {/* 3-Layer Depth-of-Field Snowfall System */}
                {particleCount > 0 && (
                  <div className="absolute inset-0 pointer-events-none z-15">
                    {/* Background slow blurred snow */}
                    <div className="absolute inset-0 blur-[1px]">
                      {Array.from({
                        length: Math.floor(particleCount * 0.35),
                      }).map((_, i) => {
                        const xStart = (i * 17 + Math.sin(i) * 20) % 100;
                        const xEnd = xStart + Math.cos(i) * 4;
                        const size = 1.5 + (i % 3) * 0.6;
                        const duration = 9 + (i % 6) * 1.8;
                        const delay = -(i * 0.4) % duration;
                        return (
                          <div
                            key={`snow-bg-${i}`}
                            className="absolute bg-white rounded-full"
                            style={
                              {
                                width: `${size}px`,
                                height: `${size}px`,
                                left: `${xStart}%`,
                                opacity: 0.35 + (i % 5) * 0.06,
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

                    {/* Foreground sharp snow */}
                    <div className="absolute inset-0">
                      {Array.from({
                        length: Math.floor(particleCount * 0.45),
                      }).map((_, i) => {
                        const xStart = (i * 11 + Math.sin(i * 2.5) * 12) % 100;
                        const xEnd = xStart + Math.cos(i * 2) * 6;
                        const size = 2.5 + (i % 4) * 0.9;
                        const duration = 4 + (i % 4) * 1.3;
                        const delay = -(i * 0.25) % duration;
                        return (
                          <div
                            key={`snow-fg-${i}`}
                            className="absolute bg-white rounded-full"
                            style={
                              {
                                width: `${size}px`,
                                height: `${size}px`,
                                left: `${xStart}%`,
                                opacity: 0.65 + (i % 4) * 0.08,
                                boxShadow: "0 0 4px rgba(255,255,255,0.85)",
                                animation: `snowfall ${duration}s ${delay}s linear infinite`,
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

                {/* Blizzard Whiteout */}
                {todayWeather.condition === "storm" && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse 120% 100% at 50% 30%, rgba(255, 255, 255, 0.45) 0%, rgba(210, 230, 255, 0.22) 50%, transparent 80%)",
                    }}
                  />
                )}

                {/* Camera OSD Readout (Bottom Bar) */}
                <div className="absolute bottom-2 left-2 right-2 z-30 flex items-end justify-between pointer-events-none">
                  <div className="bg-black/80 border border-(--neon-green)/60 px-2.5 py-1.5 max-w-md">
                    <div className="flex items-center gap-2 text-[11px] text-(--christmas-red) font-mono">
                      <span className="w-2 h-2 rounded-full bg-(--christmas-red) animate-pulse" />
                      <span className="text-(--neon-green) font-bold">
                        CAM 01 - SNØFALL LANDSBY
                      </span>
                      <span className="text-(--gold)">
                        | DAG {selectedDay}/24
                      </span>
                    </div>
                    <div className="text-xs text-(--neon-green)/90 mt-0.5">
                      {cam1LensMode === "prisme"
                        ? "OPTISK LINSE AKTIV: LYSET BRYTES I FARGER"
                        : cam1LensMode === "radar"
                          ? "LUFTROMSRADAR AKTIV: SØKER ETTER BREVFUGLER"
                          : cam1LensMode === "nordlys"
                            ? "POLARHIMMEL: SVAKT GRØNT SKJÆR"
                            : todayWeather.description}
                    </div>
                  </div>

                  <div className="bg-black/80 border border-(--neon-green)/60 px-2.5 py-1 text-right font-mono">
                    <div className="text-[11px] text-(--neon-green)">
                      {currentTime.toLocaleTimeString("no-NO", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                CHANNEL 2: IQS VERKSTED-LAB (REAL PAINTERLY LAB FEED + LIVE LIGHTS)
               =============================================================== */}
            {activeChannel === 2 && (
              <div className="absolute inset-0">
                {/* Base Painterly Workshop Feed with subtle camera drift */}
                <div className="absolute inset-0 animate-[tv-camera-pan_34s_ease-in-out_infinite]">
                  <Image
                    src="/feed/iq-verksted.png"
                    alt="IQs Verksted-Lab"
                    fill
                    className="object-cover"
                    style={{
                      filter: `brightness(${0.55 + (totalVoltage / 48) * 0.55}) contrast(1.08)`,
                    }}
                    priority
                  />

                  {/* Live Falling Snow Clipped Inside the Workshop Arched Window! */}
                  <div
                    className="absolute overflow-hidden pointer-events-none opacity-80"
                    style={{
                      left: "57.2%",
                      top: "23%",
                      width: "14.2%",
                      height: "35.5%",
                      borderRadius: "45% 45% 0 0",
                    }}
                  >
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div
                        key={`win-snow-${i}`}
                        className="absolute bg-white rounded-full"
                        style={
                          {
                            width: `${2 + (i % 2)}px`,
                            height: `${2 + (i % 2)}px`,
                            left: `${(i * 19) % 100}%`,
                            opacity: 0.7,
                            animation: `snowfall ${3 + (i % 3)}s -${i * 0.4}s linear infinite`,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                  </div>

                  {/* Live Oscilloscope CRT Waveform Aligned to IQ's Workbench Monitor */}
                  <div
                    className="absolute flex items-center justify-center overflow-hidden pointer-events-none"
                    style={{
                      left: "39.1%",
                      top: "52.8%",
                      width: "6.8%",
                      height: "10.6%",
                      borderRadius: "50%",
                    }}
                  >
                    <svg viewBox="0 0 100 60" className="w-full h-full">
                      <path
                        d={
                          totalVoltage === 48
                            ? "M 0 30 Q 12 4, 25 30 T 50 30 T 75 30 T 100 30"
                            : totalVoltage > 0
                              ? "M 0 30 Q 25 16, 50 30 T 100 30"
                              : "M 0 30 L 100 30"
                        }
                        fill="none"
                        stroke={totalVoltage === 48 ? "#ffd700" : "#00ff66"}
                        strokeWidth="3.5"
                      />
                    </svg>
                  </div>

                  {/* Dynamic Light Blooms over the Vacuum Tubes based on Fuses 1, 2, 3 */}
                  {/* Fuse 1 (12V Red Tubes) */}
                  {fuses[0] && (
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-screen animate-pulse"
                      style={{
                        background:
                          "radial-gradient(circle at 26.8% 72.5%, rgba(255, 50, 50, 0.55) 0%, transparent 8%), radial-gradient(circle at 40.4% 46.5%, rgba(255, 60, 60, 0.55) 0%, transparent 7%), radial-gradient(circle at 58.3% 64.5%, rgba(255, 60, 60, 0.5) 0%, transparent 7%)",
                      }}
                    />
                  )}

                  {/* Fuse 2 (16V Green Tubes) */}
                  {fuses[1] && (
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-screen animate-pulse"
                      style={{
                        background:
                          "radial-gradient(circle at 43.5% 46.5%, rgba(0, 255, 100, 0.6) 0%, transparent 8%), radial-gradient(circle at 62.1% 64.5%, rgba(0, 255, 100, 0.6) 0%, transparent 8%)",
                      }}
                    />
                  )}

                  {/* Fuse 3 (20V Warm Amber / Cyan High-Voltage Tubes) */}
                  {fuses[2] && (
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-screen animate-[flicker_1.8s_infinite]"
                      style={{
                        background:
                          "radial-gradient(circle at 70.6% 63%, rgba(255, 195, 70, 0.65) 0%, transparent 10%), radial-gradient(circle at 76.5% 64%, rgba(0, 221, 255, 0.45) 0%, transparent 9%)",
                      }}
                    />
                  )}

                  {/* Rising Steam / Caramel Glow over Left Copper Coils when Boiler is Active */}
                  {boilerHot && (
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-screen animate-pulse"
                      style={{
                        background:
                          "radial-gradient(circle at 31% 64%, rgba(255, 200, 50, 0.55) 0%, rgba(255, 120, 0, 0.25) 12%, transparent 22%)",
                      }}
                    />
                  )}

                  {/* High-Speed Centrifuge Glow over Right Coils */}
                  {centrifugeSpinning && (
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-screen animate-ping"
                      style={{
                        animationDuration: "1.5s",
                        background:
                          "radial-gradient(circle at 52% 61%, rgba(0, 255, 120, 0.45) 0%, transparent 15%)",
                      }}
                    />
                  )}

                  {/* Organic Turbulence-Warped Steam Plumes from Copper Boiler & Centrifuge Tubes */}
                  {[
                    {
                      left: "30.5%",
                      top: "47%",
                      delay: "0s",
                      dur: "5.8s",
                      opacity: boilerHot ? 0.85 : 0.42,
                      warm: boilerHot,
                    },
                    {
                      left: "51.5%",
                      top: "46%",
                      delay: "-2.6s",
                      dur: "6.4s",
                      opacity: centrifugeSpinning ? 0.8 : 0.36,
                      warm: false,
                    },
                  ].map((steam, idx) => (
                    <div
                      key={`lab-steam-${idx}`}
                      className="absolute pointer-events-none mix-blend-screen"
                      style={{
                        left: steam.left,
                        top: steam.top,
                        width: "48px",
                        height: "76px",
                        marginLeft: "-24px",
                        opacity: steam.opacity,
                        filter: "url(#crt-vapor-wisp)",
                        animation: `tv-chimney-smoke ${steam.dur} ${steam.delay} ease-in-out infinite`,
                      }}
                    >
                      <div
                        className="w-full h-full blur-[6px]"
                        style={{
                          background: steam.warm
                            ? "radial-gradient(ellipse 42% 72% at 50% 62%, rgba(255, 220, 145, 0.55) 0%, rgba(255, 175, 80, 0.22) 55%, transparent 85%)"
                            : "radial-gradient(ellipse 42% 72% at 50% 62%, rgba(205, 238, 255, 0.45) 0%, rgba(150, 210, 245, 0.18) 55%, transparent 85%)",
                        }}
                      />
                    </div>
                  ))}

                  {/* Off-Camera Workshop Life: Soft Cast Shadow Moving Across Workbench + Blue-White Micro-Soldering Arc Reflections */}
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-multiply"
                    style={{
                      animation: "tv-iq-tinker 18s ease-in-out infinite",
                      background:
                        "radial-gradient(ellipse 18% 32% at 48% 68%, rgba(6, 8, 12, 0.48) 0%, rgba(6, 8, 12, 0.22) 52%, transparent 82%)",
                    }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-screen animate-[flicker_2.1s_infinite]"
                    style={{
                      background:
                        "radial-gradient(circle at 54.5% 58.5%, rgba(165, 245, 255, 0.65) 0%, rgba(0, 195, 255, 0.22) 4.5%, transparent 11%), radial-gradient(circle at 46% 56%, rgba(255, 220, 130, 0.28) 0%, transparent 9%)",
                    }}
                  />
                </div>

                {/* Interactive Camera Target Brackets on the Fuse Boxes & Instruments */}
                <button
                  onClick={() => {
                    SoundManager.playSound("click");
                    setFuses(([f1, f2, f3]) => [!f1, f2, f3]);
                  }}
                  className="absolute z-30 px-2 py-1 bg-black/75 border border-(--christmas-red) text-[11px] text-(--christmas-red) hover:bg-(--christmas-red)/20 cursor-pointer"
                  style={{ left: "18%", top: "38%" }}
                >
                  [SIKRING 1: {fuses[0] ? "PÅ" : "AV"}]
                </button>

                <button
                  onClick={() => {
                    SoundManager.playSound("click");
                    setFuses(([f1, f2, f3]) => [f1, !f2, f3]);
                  }}
                  className="absolute z-30 px-2 py-1 bg-black/75 border border-(--neon-green) text-[11px] text-(--neon-green) hover:bg-(--neon-green)/20 cursor-pointer"
                  style={{ left: "38%", top: "33%" }}
                >
                  [SIKRING 2: {fuses[1] ? "PÅ" : "AV"}]
                </button>

                <button
                  onClick={() => {
                    SoundManager.playSound("click");
                    setFuses(([f1, f2, f3]) => [f1, f2, !f3]);
                  }}
                  className="absolute z-30 px-2 py-1 bg-black/75 border border-(--cold-blue) text-[11px] text-(--cold-blue) hover:bg-(--cold-blue)/20 cursor-pointer"
                  style={{ left: "73%", top: "38%" }}
                >
                  [SIKRING 3: {fuses[2] ? "PÅ" : "AV"}]
                </button>

                {/* Top Camera OSD Bar */}
                <div className="absolute top-2 left-2 right-2 z-30 flex items-center justify-between pointer-events-none">
                  <div className="bg-black/80 border border-(--neon-green)/60 px-2.5 py-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-(--christmas-red) animate-pulse" />
                    <span className="text-xs font-bold text-(--neon-green) font-mono">
                      CAM 02 - IQS VERKSTED-LAB
                    </span>
                  </div>
                  <div
                    className={`bg-black/85 border px-3 py-1 font-mono text-xs font-bold ${
                      totalVoltage === 48
                        ? "border-(--gold) text-(--gold)"
                        : "border-(--neon-green)/60 text-(--neon-green)"
                    }`}
                  >
                    SPENNING: {totalVoltage === 48 ? "✓ STABIL" : "[USTABIL]"}
                  </div>
                </div>

                {/* Bottom Lab Telemetry OSD */}
                <div className="absolute bottom-2 left-2 right-2 z-30 flex items-end justify-between pointer-events-none">
                  <div className="bg-black/85 border border-(--neon-green)/60 px-3 py-1.5 max-w-lg">
                    <div className="text-xs text-(--gold) font-bold">
                      {totalVoltage === 48
                        ? "⚡ HOVEDSTRØM AKTIV!"
                        : "⚡ Klikk på sikringsboksene i kamerabildet"}
                    </div>
                    <div className="text-[11px] text-(--neon-green)/90 mt-0.5">
                      {boilerHot
                        ? "🧪 KOLBE 100°C: DET BOBLER"
                        : centrifugeSpinning
                          ? "🥕 SENTRIFUGE: FULL FART"
                          : pressureTurbo
                            ? "🚀 TRYKK 9,8 BAR"
                            : "KOMPONENT-LAGER"}
                    </div>
                  </div>
                  <div className="bg-black/80 border border-(--neon-green)/60 px-2.5 py-1 text-[11px] text-(--neon-green) font-mono">
                    TRYKK: {pressureTurbo ? "9.8 BAR [TURBO]" : "4.2 BAR"}
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                CHANNEL 3: JULIUS VIDEOLOGG (AUTHENTIC VHS CAMCORDER BROADCAST)
               =============================================================== */}
            {activeChannel === 3 && (
              <div className="absolute inset-0 overflow-y-auto bg-black p-4 z-30">
                {pirateIntercept ? (
                  <div className="space-y-2 text-(--cold-blue)">
                    <div className="font-bold">
                      {activeKuldeIntercept.title}
                    </div>
                    <p>«{activeKuldeIntercept.transcript}»</p>
                    <div className="text-xs opacity-80">
                      {activeKuldeIntercept.telemetry}
                    </div>
                  </div>
                ) : (
                  <JuliusVideo key={selectedDay} day={selectedDay} />
                )}
              </div>
            )}

            {/* ===============================================================
                CHANNEL 4: ANTENNETÅRN 90.0 MHz (REAL PAINTERLY TOWER + RF HUD)
               =============================================================== */}
            {activeChannel === 4 && (
              <div className="absolute inset-0">
                {/* Base Painterly Mountain Antenna Tower Feed */}
                <div className="absolute inset-0 animate-[tv-camera-pan_26s_ease-in-out_infinite]">
                  <Image
                    src="/feed/antenne-tarn.png"
                    alt="Snøfall Antennetårn"
                    fill
                    className="object-cover"
                    style={{
                      filter:
                        frequencyMhz === 90
                          ? "hue-rotate(-15deg) contrast(1.25) brightness(0.9)"
                          : frequencyMhz === 85
                            ? "hue-rotate(15deg) contrast(1.3) brightness(0.75)"
                            : frequencyMhz === 75
                              ? "contrast(1.1) brightness(1.05)"
                              : "contrast(1.1)",
                    }}
                    priority
                  />

                  {/* 85.0 MHz Cross-Modulated Pirate Signal from Kulde's Ice Cavern */}
                  {frequencyMhz === 85 && (
                    <div className="absolute inset-0 mix-blend-screen opacity-75 pointer-events-none">
                      <Image
                        src="/feed/kulde-grotte.png"
                        alt="Krystallgrotten 85.0 MHz"
                        fill
                        className="object-cover"
                      />
                      <div
                        className="absolute inset-0 animate-pulse"
                        style={{
                          background:
                            "radial-gradient(circle at 75.5% 83%, rgba(0, 240, 255, 0.75) 0%, transparent 9%), radial-gradient(circle at 83% 76%, rgba(0, 225, 255, 0.7) 0%, transparent 9%), radial-gradient(circle at 92% 74%, rgba(0, 240, 255, 0.65) 0%, transparent 9%)",
                        }}
                      />
                    </div>
                  )}

                  {/* Pulsing Red Aviation Beacon + Volumetric Sweeping Light Beam at Tower Peak (62.5%, 10.8%) */}
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-screen animate-pulse"
                    style={{
                      background:
                        "radial-gradient(circle at 62.5% 10.8%, rgba(255, 30, 30, 0.85) 0%, rgba(255, 0, 0, 0.28) 6%, transparent 15%)",
                    }}
                  />
                  <div
                    className="absolute pointer-events-none mix-blend-screen"
                    style={{
                      left: "62.5%",
                      top: "10.8%",
                      width: "220px",
                      height: "56px",
                      marginTop: "-28px",
                      transformOrigin: "0% 50%",
                      animation: "tv-beacon-sweep 9s ease-in-out infinite",
                      background:
                        "linear-gradient(90deg, rgba(255, 45, 45, 0.55) 0%, rgba(255, 30, 30, 0.18) 55%, transparent 100%)",
                      clipPath: "polygon(0 45%, 100% 0%, 100% 100%, 0 55%)",
                      filter: "blur(2px)",
                    }}
                  />

                  {/* Warm Relay Cabin Window Glow (72.3%, 65.5%) + Interior Shadow Modulation & Volumetric Inspection Beam */}
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-screen animate-[flicker_3s_infinite]"
                    style={{
                      background:
                        "radial-gradient(circle at 72.3% 65.5%, rgba(255, 190, 70, 0.55) 0%, transparent 11%)",
                    }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-multiply"
                    style={{
                      animation: "tv-iq-tinker 14s ease-in-out infinite",
                      background:
                        "radial-gradient(ellipse 3% 4.5% at 72.3% 65.5%, rgba(8, 5, 2, 0.45) 0%, transparent 75%)",
                    }}
                  />
                  <div
                    className="absolute pointer-events-none mix-blend-screen"
                    style={{
                      left: "56%",
                      top: "61%",
                      width: "140px",
                      height: "44px",
                      transformOrigin: "100% 50%",
                      animation: "tv-beacon-sweep 12s ease-in-out infinite",
                      background:
                        "linear-gradient(270deg, rgba(255, 225, 140, 0.45) 0%, rgba(255, 190, 80, 0.15) 60%, transparent 100%)",
                      clipPath: "polygon(0 0, 100% 42%, 100% 58%, 0 100%)",
                      filter: "blur(3px)",
                    }}
                  />

                  {/* Turbulent Analog Frost-Wave Ghost Interference at 85.0 / 90.0 MHz */}
                  {(frequencyMhz === 85 || frequencyMhz === 90) && (
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-color-dodge"
                      style={{
                        animation: "tv-kulde-lurk 7.5s ease-in-out infinite",
                        filter: "url(#crt-ghost-anomaly)",
                        background:
                          "radial-gradient(ellipse 22% 32% at 32% 42%, rgba(0, 235, 255, 0.28) 0%, rgba(0, 125, 210, 0.12) 55%, transparent 82%)",
                      }}
                    />
                  )}

                  {/* Expanding Radio Wave Rings from Parabolic Dish (58%, 36%) */}
                  <div
                    className="absolute pointer-events-none"
                    style={{ left: "58%", top: "36%" }}
                  >
                    <div
                      className={`w-28 h-28 -ml-14 -mt-14 rounded-full border-2 animate-ping ${
                        frequencyMhz === 90
                          ? "border-(--christmas-red)/70"
                          : frequencyMhz === 85
                            ? "border-(--cold-blue)/80"
                            : frequencyMhz === 75
                              ? "border-(--gold)/70"
                              : "border-(--neon-green)/60"
                      }`}
                      style={{ animationDuration: "2.4s" }}
                    />
                  </div>
                </div>

                {/* Top Camera & Frequency Telemetry OSD */}
                <div className="absolute top-2 left-2 right-2 z-30 flex items-center justify-between pointer-events-none font-mono">
                  <div className="bg-black/80 border border-(--neon-green)/60 px-2.5 py-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-(--christmas-red) animate-pulse" />
                    <span className="text-xs font-bold text-(--neon-green)">
                      {frequencyMhz === 85
                        ? "CAM 04 // PIRAT-PEILING: KRYSTALLGROTTEN"
                        : "CAM 04 - ANTENNETÅRN NORDTOPPEN"}
                    </span>
                  </div>

                  <div
                    className={`bg-black/85 border px-3 py-1 text-xs font-bold ${
                      frequencyMhz === 90
                        ? "border-(--christmas-red) text-(--christmas-red) animate-pulse"
                        : frequencyMhz === 85
                          ? "border-(--cold-blue) text-(--cold-blue) animate-pulse"
                          : frequencyMhz === 75
                            ? "border-(--gold) text-(--gold)"
                            : "border-(--cold-blue) text-(--cold-blue)"
                    }`}
                  >
                    TUNER: {frequencyMhz.toFixed(1)} MHz{" "}
                    {frequencyMhz === 75
                      ? "[NØDLINK 75 MHz LÅST]"
                      : frequencyMhz === 85
                        ? "[❄️ GROTTEN PEILET]"
                        : frequencyMhz === 90
                          ? "[⚠️ FROST-INTERFERENS!]"
                          : frequencyMhz === 100
                            ? "[JULE-FM MELODI]"
                            : "[ BÆREBØLGE ]"}
                  </div>
                </div>

                {/* Optional Translucent Technical Calibration HUD Overlay */}
                {showCam4Hud && (
                  <div className="absolute inset-x-4 top-12 bottom-16 z-35 bg-black/82 border-2 border-(--neon-green) p-3 flex flex-col justify-between backdrop-blur-[2px]">
                    <div className="flex items-center justify-between border-b border-(--neon-green)/40 pb-1.5">
                      <div className="flex gap-1.5">
                        {(
                          [
                            ["kretskort", "🔌 KRETSLØP"],
                            ["sorterer", "📦 DAG 16: SORTERER"],
                            ["slede", "🛷 DAG 18: SLEDE-RADAR"],
                            ["zapper", "🛡️ PORTEN"],
                          ] as const
                        ).map(([id, label]) => (
                          <button
                            key={id}
                            onClick={() => {
                              SoundManager.playSound("click");
                              setActiveMiniGame(id);
                            }}
                            className={`px-2 py-0.5 text-[11px] font-bold border cursor-pointer ${
                              activeMiniGame === id
                                ? "border-(--gold) bg-(--gold) text-black"
                                : "border-(--neon-green)/40 text-(--neon-green)"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowCam4Hud(false)}
                        className="px-2 py-0.5 text-[11px] border border-(--christmas-red) text-(--christmas-red) hover:bg-(--christmas-red)/20 cursor-pointer"
                      >
                        [LUKK HUD ✕]
                      </button>
                    </div>

                    {/* Active Calibration Tool inside Translucent HUD */}
                    {activeMiniGame === "kretskort" && (
                      <div className="my-auto space-y-2">
                        <div className="text-xs text-(--neon-green)">
                          Koble alle 6 relé-nodene i masten for å låse opp siste
                          del av koden på Dag 8:
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {circuitNodes.map((on, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                SoundManager.playSound("click");
                                setCircuitNodes((prev) => {
                                  const next = [...prev];
                                  next[idx] = !next[idx];
                                  return next;
                                });
                              }}
                              className={`py-2 border text-center font-mono text-xs font-bold cursor-pointer ${
                                on
                                  ? "border-(--neon-green) bg-(--neon-green)/25 text-(--neon-green)"
                                  : "border-(--christmas-red)/60 bg-black/70 text-(--christmas-red)"
                              }`}
                            >
                              R-{idx + 1} {on ? "PÅ" : "AV"}
                            </button>
                          ))}
                        </div>
                        <div className="text-xs text-(--gold) font-bold">
                          {allCircuitConnected
                            ? "✅ KRETSLØP AKTIVT!"
                            : "Tips: Klikk på alle røde R-noder til alle 6 lyser grønt."}
                        </div>
                      </div>
                    )}

                    {activeMiniGame === "sorterer" && (
                      <div className="my-auto space-y-2">
                        <div className="text-xs text-(--neon-green)">
                          Sorter pakkene i riktig sjakt ({sorterStep}/4
                          fullført):
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { name: "🚂 TOG", idx: 0 },
                            { name: "🧸 BAMSE", idx: 1 },
                            { name: "🧱 BYGGESETT", idx: 2 },
                            { name: "🎨 MALING", idx: 3 },
                          ].map((item) => (
                            <button
                              key={item.name}
                              onClick={() => {
                                SoundManager.playSound("click");
                                setSorterStep((prev) => Math.min(4, prev + 1));
                              }}
                              className="py-2 border border-(--cold-blue) bg-black/70 text-xs text-(--cold-blue) hover:bg-(--cold-blue)/20 font-bold cursor-pointer"
                            >
                              {item.name}
                            </button>
                          ))}
                        </div>
                        <div className="text-xs text-(--gold) font-bold">
                          {sorterStep >= 4
                            ? "✅ SAMLEBÅND SYNKRONISERT!"
                            : "Klikk på de 4 kategoriene for å synkronisere pakkeradaren."}
                        </div>
                      </div>
                    )}

                    {activeMiniGame === "slede" && (
                      <div className="my-auto space-y-2">
                        <div className="flex items-center justify-between text-xs text-(--neon-green)">
                          <span>
                            HØYDEVIND-RADAR OVER BYFJELLENE (FIL{" "}
                            {sleighLane + 1}/3)
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                SoundManager.playSound("click");
                                setSleighLane(
                                  (prev) => Math.max(0, prev - 1) as 0 | 1 | 2,
                                );
                                setSleighProgress((p) => Math.min(100, p + 30));
                              }}
                              className="px-2 py-0.5 border border-(--neon-green)"
                            >
                              ▲ NORD
                            </button>
                            <button
                              onClick={() => {
                                SoundManager.playSound("click");
                                setSleighLane(
                                  (prev) => Math.min(2, prev + 1) as 0 | 1 | 2,
                                );
                                setSleighProgress((p) => Math.min(100, p + 30));
                              }}
                              className="px-2 py-0.5 border border-(--neon-green)"
                            >
                              ▼ SØR
                            </button>
                          </div>
                        </div>
                        <div className="w-full bg-black border border-(--neon-green)/50 h-4 overflow-hidden">
                          <div
                            className="bg-(--gold) h-full transition-all"
                            style={{ width: `${sleighProgress}%` }}
                          />
                        </div>
                        <div className="text-xs text-(--gold) font-bold">
                          {sleighProgress >= 100
                            ? "✅ KORRIDOR SIKRET!"
                            : "Manøvrer sleden (▲/▼) til måleren når 100%."}
                        </div>
                      </div>
                    )}

                    {activeMiniGame === "zapper" && (
                      <div className="my-auto space-y-2">
                        <div className="text-xs text-(--neon-green)">
                          Isoler signaturen på alle 3 bærebølger:
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {["75.0 MHz", "90.0 MHz", "100.0 MHz"].map(
                            (band, idx) => (
                              <button
                                key={band}
                                onClick={() => {
                                  SoundManager.playSound("click");
                                  setZapperLocks((prev) => {
                                    const next: [boolean, boolean, boolean] = [
                                      ...prev,
                                    ];
                                    next[idx] = !next[idx];
                                    return next;
                                  });
                                }}
                                className={`py-2 border text-xs font-bold cursor-pointer ${
                                  zapperLocks[idx]
                                    ? "border-(--gold) bg-(--gold)/25 text-(--gold)"
                                    : "border-(--christmas-red) bg-black/70 text-(--christmas-red)"
                                }`}
                              >
                                {band}: {zapperLocks[idx] ? "RENSET ✓" : "RENS"}
                              </button>
                            ),
                          )}
                        </div>
                        <div className="text-xs text-(--gold) font-bold">
                          {allZapperLocked
                            ? "✅ PORTEN HOLDER!"
                            : "Rens alle 3 frekvensbåndene for å stenge Kulde ute."}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Live RF Spectrum Analyzer OSD */}
                <div className="absolute bottom-2 left-2 right-2 z-30 flex items-end justify-between pointer-events-none">
                  <div className="bg-black/85 border border-(--neon-green)/60 px-3 py-1.5 max-w-lg">
                    <div className="text-xs font-bold text-(--gold)">
                      {frequencyMhz === 75
                        ? "📡 NØDFREKVENS"
                        : frequencyMhz === 85
                          ? "❄️ 85,0 MHz: UKJENT SENDER UNDER NORDTOPPEN"
                          : frequencyMhz === 90
                            ? "📡 90,0 MHz: DIREKTELINJEN"
                            : frequencyMhz === 100
                              ? "🎵 100,0 MHz: JULE-FM"
                              : `📡 BÆREBØLGE ${frequencyMhz.toFixed(1)} MHz - Signal fra Nordtoppen`}
                    </div>
                    <div className="text-[11px] text-(--neon-green)/80">
                      Bruk frekvensvelgeren eller [TEKNISK HUD] under skjermen
                    </div>
                  </div>

                  {/* Animated Spectrum Bars */}
                  <div className="bg-black/80 border border-(--neon-green)/60 px-2.5 py-1.5 flex items-end gap-0.5 h-10">
                    {Array.from({ length: 16 }).map((_, idx) => {
                      const h =
                        20 +
                        ((vhsFrameCounter * 17 + idx * 23 + frequencyMhz) % 75);
                      return (
                        <div
                          key={idx}
                          className={`w-1.5 transition-all duration-100 ${
                            frequencyMhz === 90
                              ? "bg-(--christmas-red)"
                              : frequencyMhz === 85
                                ? "bg-(--cold-blue)"
                                : frequencyMhz === 75
                                  ? "bg-(--gold)"
                                  : "bg-(--neon-green)"
                          }`}
                          style={{ height: `${h}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================================
            PHYSICAL TV HARDWARE CONTROL DECK (BELOW THE CRT TUBE)
           ===================================================================== */}
        <div className="grid grid-cols-4 gap-2 lg:gap-3">
          {(
            [
              {
                id: 1 as ChannelId,
                code: "CAM 1",
                name: "SNØFALL LANDSBY",
                sub: "VÆR & HIMMEL",
              },
              {
                id: 2 as ChannelId,
                code: "CAM 2",
                name: "VERKSTED-LAB",
                sub: "SIKRINGER & KOLBE",
              },
              {
                id: 3 as ChannelId,
                code: "CAM 3",
                name: "JULIUS' VIDEODAGBOK",
                sub: pirateIntercept ? "85,0 MHz" : "JULIUS",
              },
              {
                id: 4 as ChannelId,
                code: "CAM 4",
                name: "ANTENNETÅRN",
                sub: `${frequencyMhz.toFixed(1)} MHz & HUD`,
              },
            ] as const
          ).map((ch) => {
            const isActive = activeChannel === ch.id;
            const isRecommended = ch.id === 3;
            return (
              <button
                key={ch.id}
                onClick={() => handleChannelSelect(ch.id)}
                className={`p-2 border-2 text-left transition-all cursor-pointer relative ${
                  isActive
                    ? "border-(--neon-green) bg-(--neon-green)/20 text-(--neon-green)"
                    : "border-(--neon-green)/35 bg-black/50 text-(--neon-green)/65 hover:border-(--neon-green)/70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{ch.code}</span>
                  {isRecommended && (
                    <span className="px-1 bg-(--gold) text-black text-[9px] font-bold">
                      DAG {selectedDay}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold truncate mt-0.5">
                  {ch.name}
                </div>
                <div className="text-[10px] opacity-75 truncate">{ch.sub}</div>
              </button>
            );
          })}
        </div>

        {/* Secondary Hardware Controls Bar (Tuner / Lens / Lab / Tape Controls) */}
        <div className="p-2.5 border-2 border-(--neon-green)/35 bg-black/60 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Day / Broadcast Tape Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-(--gold) font-bold">SENDING:</span>
            <button
              onClick={() => handleDaySelect(selectedDay - 1)}
              disabled={selectedDay <= 1}
              className="px-2 py-0.5 border border-(--neon-green)/60 text-xs text-(--neon-green) disabled:opacity-30 cursor-pointer"
            >
              ◄
            </button>
            <select
              aria-label="Velg sending dag"
              value={selectedDay}
              onChange={(e) => handleDaySelect(Number(e.target.value))}
              className="bg-black border border-(--gold) text-(--gold) px-2 py-0.5 text-xs font-mono"
            >
              {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Dag {d}. des
                </option>
              ))}
            </select>
            <button
              onClick={() => handleDaySelect(selectedDay + 1)}
              disabled={selectedDay >= maxDay}
              className="px-2 py-0.5 border border-(--neon-green)/60 text-xs text-(--neon-green) disabled:opacity-30 cursor-pointer"
            >
              ►
            </button>
          </div>

          {/* Right: Contextual Hardware Switches for Active Camera */}
          {activeChannel === 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-(--neon-green)/70">LINSE:</span>
              {(
                [
                  ["standard", "NORMAL"],
                  ["prisme", "🌈 LINSE"],
                  ["radar", "📡 RADAR"],
                  ["nordlys", "🌌 POLARHIMMEL"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => {
                    SoundManager.playSound("click");
                    triggerChannelSwitchEffect();
                    setCam1LensMode(mode);
                  }}
                  className={`px-2 py-0.5 text-[11px] font-bold border cursor-pointer ${
                    cam1LensMode === mode
                      ? "border-(--gold) bg-(--gold) text-black"
                      : "border-(--neon-green)/40 text-(--neon-green)"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {activeChannel === 2 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  SoundManager.playSound("click");
                  setBoilerHot((v) => !v);
                }}
                className={`px-2 py-0.5 text-[11px] font-bold border cursor-pointer ${
                  boilerHot
                    ? "border-(--gold) bg-(--gold) text-black"
                    : "border-(--neon-green)/50 text-(--neon-green)"
                }`}
              >
                🧪 KOLBE (DAG 15)
              </button>
              <button
                onClick={() => {
                  SoundManager.playSound("click");
                  setCentrifugeSpinning((v) => !v);
                }}
                className={`px-2 py-0.5 text-[11px] font-bold border cursor-pointer ${
                  centrifugeSpinning
                    ? "border-(--neon-green) bg-(--neon-green) text-black"
                    : "border-(--neon-green)/50 text-(--neon-green)"
                }`}
              >
                🥕 SENTRIFUGE (DAG 19)
              </button>
              <button
                onClick={() => {
                  SoundManager.playSound("click");
                  setPressureTurbo((v) => !v);
                }}
                className={`px-2 py-0.5 text-[11px] font-bold border cursor-pointer ${
                  pressureTurbo
                    ? "border-(--cold-blue) bg-(--cold-blue) text-black"
                    : "border-(--neon-green)/50 text-(--neon-green)"
                }`}
              >
                🚀 TRYKKMÅLER (DAG 20)
              </button>
            </div>
          )}

          {activeChannel === 3 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  SoundManager.playSound("click");
                  triggerChannelSwitchEffect();
                  setPirateIntercept((v) => !v);
                }}
                className={`px-2.5 py-0.5 border text-xs font-bold cursor-pointer ${
                  pirateIntercept
                    ? "border-(--cold-blue) bg-(--cold-blue) text-black animate-pulse"
                    : "border-(--cold-blue)/60 text-(--cold-blue) hover:bg-(--cold-blue)/20"
                }`}
              >
                ❄️ {pirateIntercept ? "TILBAKE TIL JULIUS" : "LYTT PÅ 85,0 MHz"}
              </button>
            </div>
          )}

          {activeChannel === 4 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {[75, 85, 90, 100].map((freq) => (
                <button
                  key={freq}
                  onClick={() => {
                    SoundManager.playSound("click");
                    triggerChannelSwitchEffect();
                    setFrequencyMhz(freq);
                  }}
                  className={`px-2 py-0.5 text-[11px] font-bold border cursor-pointer ${
                    frequencyMhz === freq
                      ? "border-(--gold) bg-(--gold) text-black"
                      : "border-(--cold-blue)/50 text-(--cold-blue)"
                  }`}
                >
                  {freq}.0 MHz
                </button>
              ))}
              <button
                onClick={() => {
                  SoundManager.playSound("click");
                  setShowCam4Hud((v) => !v);
                }}
                className={`px-2.5 py-0.5 text-[11px] font-bold border cursor-pointer ${
                  showCam4Hud
                    ? "border-(--neon-green) bg-(--neon-green) text-black"
                    : "border-(--gold) text-(--gold)"
                }`}
              >
                🛠️ {showCam4Hud ? "SKJUL HUD" : "TEKNISK HUD (DAG 8/16/18/21)"}
              </button>
            </div>
          )}
        </div>

        {/* TV-EKSEMPLER & OBSERVASJONER (Quick-Select Broadcast Scenarios & Background Character Sightings) */}
        <div className="p-2 border-2 border-(--gold)/40 bg-black/70 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-(--gold) tracking-wider">
                🎬 TV-EKSEMPLER & BAKGRUNNS-OBSERVASJONER:
              </span>
              <span className="text-[10px] text-(--neon-green)/75">
                Klikk for å hoppe til kamerascener med levende bakgrunnsfigurer
              </span>
            </div>
            {activeScenario && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-(--gold)/15 border border-(--gold)/50 text-(--gold)">
                AKTIV SCENE: {activeScenario.label} (CAM 0
                {activeScenario.channel} • DAG {activeScenario.day})
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
            {TV_SCENARIO_EXAMPLES.map((sc) => {
              const isSelected = activeScenarioId === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => handleScenarioSelect(sc)}
                  className={`px-2 py-1 border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-(--gold) bg-(--gold)/20 text-(--gold)"
                      : "border-(--neon-green)/30 bg-black/60 text-(--neon-green)/85 hover:border-(--gold)/60"
                  }`}
                >
                  <div className="text-[10px] font-bold truncate">
                    {sc.label}
                  </div>
                  <div className="text-[9px] opacity-75 truncate font-mono">
                    CAM 0{sc.channel} • DAG {sc.day}
                  </div>
                </button>
              );
            })}
          </div>

          {activeScenario && (
            <div className="px-2 py-1 bg-(--neon-green)/10 border-l-2 border-(--gold) text-[11px] text-(--neon-green) font-mono flex items-center justify-between gap-2">
              <span>👁️ OBSERVASJON: {activeScenario.sightingNote}</span>
              <span className="text-[10px] text-(--gold) shrink-0">
                [CAM 0{activeScenario.channel} • DAG {activeScenario.day}]
              </span>
            </div>
          )}
        </div>
      </div>
    </RetroWindow>
  );
}
