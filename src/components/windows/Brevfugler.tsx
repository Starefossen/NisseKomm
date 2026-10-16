"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { GameEngine } from "@/lib/game-engine";
import { getCurrentDate } from "@/lib/date-utils";

interface Letter {
  day: number;
  content: string;
}

interface BrevfuglerProps {
  onClose: () => void;
}

export function Brevfugler({ onClose }: BrevfuglerProps) {
  const [letters] = useState<Letter[]>(() => {
    if (typeof window !== "undefined") {
      return GameEngine.getSantaLetters();
    }
    return [];
  });
  const [selectedLetter, setSelectedLetter] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const list = GameEngine.getSantaLetters();
      return list.length > 0 ? list[list.length - 1].day : null;
    }
    return null;
  });
  const [status] = useState<"pending" | "processed">(() => {
    if (typeof window !== "undefined") {
      const completedCodes = GameEngine.getSubmittedCodes();
      return completedCodes.length >= 14 ? "processed" : "pending";
    }
    return "pending";
  });

  const [fremdrift] = useState(() => {
    if (typeof window !== "undefined") {
      return GameEngine.getBrevfuglerFremdrift();
    }
    return {
      fase1Fullført: false,
      fase2Fullført: false,
      fase3Fullført: false,
      fase4Fullført: false,
      antallPapirbrev: 0,
    };
  });

  const [showParentWorkflow, setShowParentWorkflow] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [transcriptionContent, setTranscriptionContent] = useState("");
  const [radarTick, setRadarTick] = useState(0);
  const [currentTime, setCurrentTime] = useState<Date>(() => getCurrentDate());

  useEffect(() => {
    const timer = setInterval(() => {
      setRadarTick((prev) => (prev + 1) % 100);
      setCurrentTime(getCurrentDate());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTranscribe = () => {
    if (selectedDay && transcriptionContent.trim()) {
      GameEngine.addBrevfugl(selectedDay, transcriptionContent);
      setTranscriptionContent("");
      setSelectedDay(null);
      window.location.reload();
    }
  };

  const selectedLetterData = selectedLetter
    ? letters.find((l) => l.day === selectedLetter)
    : null;

  const activeBirdCount = Math.max(
    2,
    fremdrift.antallPapirbrev + letters.length,
  );

  return (
    <RetroWindow
      title="BREVFUGLER — ISFUGL-RADAR & DIREKTEPOST FRA JULIUS"
      onClose={onClose}
    >
      <div className="p-4 md:p-6 h-full overflow-y-auto space-y-6 bg-(--dark-crt)">
        {/* =====================================================================
            LIVE CRT ISFUGL-RADAR VIEWPORT (BERGEN / ULRIKEN <-> SNØFALL 90°N)
           ===================================================================== */}
        <div className="relative w-full h-52 md:h-60 border-4 border-(--neon-green)/70 bg-black overflow-hidden shadow-[0_0_24px_rgba(0,255,0,0.18)]">
          {/* Split Painterly Surveillance Feeds: Left = Nordtoppen Relay, Right = Julius' Study */}
          <div className="absolute inset-0 grid grid-cols-2">
            <div className="relative overflow-hidden border-r border-(--neon-green)/40">
              <Image
                src="/feed/antenne-tarn.png"
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
                src="/feed/julius-kontor.png"
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

          {/* Animated Brevfugl Blip Travelling Along Corridor */}
          <div
            className="absolute z-20 pointer-events-none transition-all duration-1000"
            style={{
              left: `${20 + ((radarTick * 7) % 60)}%`,
              top: `${32 + Math.sin(radarTick * 0.45) * 18}%`,
            }}
          >
            <div className="flex items-center gap-1.5 bg-black/85 border border-(--gold) px-2 py-0.5 text-[10px] font-mono text-(--gold) shadow-[0_0_10px_rgba(255,215,0,0.4)]">
              <span className="w-2 h-2 rounded-full bg-(--gold) animate-ping" />
              <span>
                BREVFUGL #{104 + (radarTick % activeBirdCount)} [ORIGAMI]
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
          <div className="absolute inset-0 z-25 p-3 flex flex-col justify-between pointer-events-none font-mono">
            <div className="flex items-center justify-between gap-2">
              <div className="bg-black/80 border border-(--neon-green)/60 px-2.5 py-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-(--neon-green) animate-pulse" />
                <span className="text-xs font-bold text-(--neon-green)">
                  LUFTKORRIDOR: LANDÅS (60.37°N) ⇄ SNØFALL (90.00°N)
                </span>
              </div>
              <div className="bg-black/80 border border-(--gold) px-2.5 py-1 text-xs font-bold text-(--gold)">
                {currentTime.toLocaleTimeString("no-NO", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}{" "}
                | AKTIVE FUGLER: {activeBirdCount}
              </div>
            </div>

            <div className="flex items-end justify-between gap-2">
              <div className="bg-black/85 border border-(--neon-green)/50 px-2.5 py-1 text-[11px] text-(--neon-green)">
                📡 AVGANG: ULRIKEN MAST (643 MOH) — KRYPTERING: O-R-I-G-A-M-I
              </div>
              <div className="bg-black/85 border border-(--gold)/60 px-2.5 py-1 text-[11px] text-(--gold)">
                📬 MOTTAK: JULIUS&apos; SKRIVEBORD (SNØFALL)
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b-4 border-(--neon-green)/30">
          <Icons.Mail size={32} color="gold" />
          <div className="flex-1">
            <div className="text-2xl font-bold tracking-wider">
              PERSONLIGE MELDINGER
            </div>
            <div className="text-sm opacity-70">
              KRYPTERTE BREVFUGLER MELLOM LANDÅS OG SNØFALL
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 border-2 border-(--gold) bg-(--gold)/20">
            <div className="w-2 h-2 bg-(--gold) rounded-full animate-pulse-led"></div>
            <span className="text-(--gold) text-xs tracking-wider">
              LÅST OPP DAG 14
            </span>
          </div>
        </div>

        {/* Parent Workflow Onboarding Banner */}
        <div className="p-4 border-2 border-(--cold-blue) bg-(--cold-blue)/10">
          <div className="flex items-start gap-3">
            <Icons.Info size={24} color="blue" />
            <div className="flex-1 space-y-2">
              <div className="text-sm font-bold text-(--cold-blue)">
                🎁 FORELDREGUIDE: BREVFUGL-SYSTEMET
              </div>
              <div className="text-xs text-(--cold-blue)/80 space-y-1">
                <p>
                  <strong>Slik fungerer det:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Barnet skriver et håndskrevet brev til Julius</li>
                  <li>
                    Forelderen skriver av brevet her (mens barnet sover) 📝
                  </li>
                  <li>
                    Brevet &quot;flyr til Snøfall&quot; som en magisk brevfugl
                    🐦
                  </li>
                  <li>Julius&apos; svar kommer neste dag i NisseMail! 📬</li>
                </ol>
                <p className="mt-2 text-(--gold)/80">
                  💡 Tips: Dette skaper magisk korrespondanse mellom barnet og
                  Julius!
                </p>
              </div>
              <button
                onClick={() => setShowParentWorkflow(!showParentWorkflow)}
                className="mt-2 px-3 py-1 border-2 border-(--cold-blue) bg-(--cold-blue)/20 hover:bg-(--cold-blue)/30 transition-colors text-xs cursor-pointer"
              >
                {showParentWorkflow
                  ? "▼ SKJUL TRANSKRIPSJON"
                  : "▶ SKRIV AV BARNETS BREV"}
              </button>
            </div>
          </div>
        </div>

        {/* Parent Transcription Interface */}
        {showParentWorkflow && (
          <div className="p-4 border-2 border-(--gold) bg-(--gold)/5 space-y-4">
            <div className="text-sm font-bold text-(--gold) mb-3">
              📝 SKRIV AV BARNETS HÅNDSKREVNE BREV
            </div>

            {/* 4-Phase Progress Tracker */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { fase: 1, dag: 1, navn: "Første brev" },
                { fase: 2, dag: 5, navn: "Etablering" },
                { fase: 3, dag: 12, navn: "Dypere bånd" },
                { fase: 4, dag: 14, navn: "Fullført!" },
              ].map(({ fase, dag, navn }) => {
                const fullført =
                  fase === 1
                    ? fremdrift.fase1Fullført
                    : fase === 2
                      ? fremdrift.fase2Fullført
                      : fase === 3
                        ? fremdrift.fase3Fullført
                        : fremdrift.fase4Fullført;

                return (
                  <div
                    key={fase}
                    className={`p-2 border-2 text-center text-xs ${
                      fullført
                        ? "border-(--neon-green) bg-(--neon-green)/20 text-(--neon-green)"
                        : "border-(--neon-green)/30 bg-(--neon-green)/5 text-(--neon-green)/50"
                    }`}
                  >
                    <div className="font-bold">
                      {fullført ? "✓" : "○"} FASE {fase}
                    </div>
                    <div className="opacity-70">Dag {dag}</div>
                    <div className="text-[10px] mt-1">{navn}</div>
                  </div>
                );
              })}
            </div>

            {/* Day Selector */}
            <div className="space-y-2">
              <label className="text-xs text-(--neon-green)/70">
                VELG DAG FOR BREVET:
              </label>
              <select
                value={selectedDay || ""}
                onChange={(e) =>
                  setSelectedDay(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full p-2 bg-(--dark-crt) border-2 border-(--neon-green) text-(--neon-green) text-sm"
              >
                <option value="">-- Velg dag --</option>
                {Array.from({ length: 24 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    Dag {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Textarea */}
            <div className="space-y-2">
              <label className="text-xs text-(--neon-green)/70">
                BREVINNHOLD:
              </label>
              <textarea
                value={transcriptionContent}
                onChange={(e) => setTranscriptionContent(e.target.value)}
                placeholder="Skriv av barnets brev her..."
                rows={6}
                className="w-full p-3 bg-(--dark-crt) border-2 border-(--neon-green) text-(--neon-green) text-sm font-mono resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleTranscribe}
              disabled={!selectedDay || !transcriptionContent.trim()}
              className="w-full px-4 py-2 border-2 border-(--gold) bg-(--gold)/20 hover:bg-(--gold)/30 disabled:opacity-30 disabled:cursor-not-allowed text-(--gold) font-bold transition-colors cursor-pointer"
            >
              📤 SEND BREVFUGL TIL SNØFALL
            </button>

            {/* Counter */}
            <div className="text-xs text-(--neon-green)/70 text-center">
              📊 {fremdrift.antallPapirbrev} brevfugler sendt til Julius
            </div>
          </div>
        )}

        {/* Status Banner */}
        <div
          className={`p-4 border-2 ${
            status === "processed"
              ? "border-(--neon-green) bg-(--neon-green)/10"
              : "border-(--gold) bg-(--gold)/10"
          }`}
        >
          <div className="flex items-center gap-3">
            {status === "processed" ? (
              <>
                <Icons.CheckCircle size={24} color="green" />
                <div>
                  <div className="text-sm font-bold text-(--neon-green)">
                    ✓ BEHANDLET
                  </div>
                  <div className="text-xs text-(--neon-green)/70">
                    Alle brev er klare til visning
                  </div>
                </div>
              </>
            ) : (
              <>
                <Icons.Alert size={24} color="gold" />
                <div>
                  <div className="text-sm font-bold text-(--gold)">
                    UNDER BEHANDLING...
                  </div>
                  <div className="text-xs text-(--gold)/70">
                    Julius skriver fortsatt brev
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {letters.length === 0 ? (
          // No letters yet
          <div className="flex flex-col items-center justify-center py-12 space-y-4 border-2 border-(--neon-green)/30 bg-black/40">
            <Icons.Mail size={48} color="gray" />
            <div className="text-center space-y-2">
              <div className="text-lg text-(--neon-green)">Ingen brev ennå</div>
              <div className="text-sm text-(--neon-green)/70 max-w-md">
                Julius vil sende personlige brev til dere etter hvert som dere
                løser oppdrag. Hold utkikk!
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Letter List */}
            <div className="col-span-1 space-y-2">
              <div className="text-sm text-(--neon-green)/70 mb-2 font-mono">
                INNBOKS ({letters.length})
              </div>
              {letters.map((letter) => (
                <button
                  key={letter.day}
                  onClick={() => setSelectedLetter(letter.day)}
                  className={`
                    w-full p-3 text-left border-2 transition-all cursor-pointer
                    ${
                      selectedLetter === letter.day
                        ? "border-(--gold) bg-(--gold)/20"
                        : "border-(--neon-green)/30 hover:border-(--neon-green) hover:bg-(--neon-green)/10"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icons.Mail size={16} color="gold" />
                      <div className="text-sm font-bold text-(--gold)">
                        DAG {letter.day}. DESEMBER
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 border border-(--gold)/50 text-(--gold)">
                      LUFTPOST
                    </span>
                  </div>
                  <div className="text-xs text-(--neon-green)/70 mt-1">
                    Fra: Julius, Snøfall (90°N)
                  </div>
                </button>
              ))}
            </div>

            {/* Letter Content */}
            <div className="col-span-1 md:col-span-2">
              {selectedLetterData ? (
                <div className="border-2 border-(--gold) bg-black/75 p-6 space-y-4 shadow-[0_0_20px_rgba(255,215,0,0.15)]">
                  {/* Letter Header with Official Snøfall Postmark */}
                  <div className="pb-4 border-b-2 border-(--gold)/30 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs text-(--gold)/70 font-mono">
                        AVSENDER // SNØFALL HOVEDKVARTER:
                      </div>
                      <div className="text-lg font-bold text-(--gold)">
                        🎅 Julius, Juleverkstedet i Snøfall
                      </div>
                      <div className="text-xs text-(--neon-green) font-mono mt-1">
                        LEVERT MED BREVFUGL // DAG {selectedLetterData.day}.
                        DESEMBER
                      </div>
                    </div>

                    {/* Official Postmark Stamp */}
                    <div className="border-2 border-dashed border-(--gold) px-3 py-1.5 text-center font-mono bg-(--gold)/10 shrink-0">
                      <div className="text-[10px] text-(--gold) font-bold">
                        ★ SNØFALL LUFTPOST ★
                      </div>
                      <div className="text-xs text-white font-bold">
                        DAG {selectedLetterData.day}
                      </div>
                      <div className="text-[9px] text-(--neon-green)">
                        ORIGAMI-VERIFISERT
                      </div>
                    </div>
                  </div>

                  {/* Letter Body */}
                  <div className="text-sm md:text-base text-(--neon-green) leading-relaxed whitespace-pre-wrap">
                    {selectedLetterData.content}
                  </div>

                  {/* Letter Footer */}
                  <div className="pt-4 border-t-2 border-(--gold)/30 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-(--gold)/70">
                        Med vennlig julehilsen,
                      </div>
                      <div className="text-sm text-(--gold) font-bold mt-1">
                        Julius 🎄
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-(--cold-blue)">
                      RUTE: SNØFALL → ULRIKEN → LANDÅS
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-48 flex items-center justify-center border-2 border-(--neon-green)/30 bg-black/40">
                  <div className="text-center text-(--neon-green)/70">
                    <Icons.Mail size={48} color="gray" />
                    <div className="text-sm mt-4">Velg et brev fra listen</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Message */}
        <div className="p-4 border-2 border-(--cold-blue)/30 bg-(--cold-blue)/5 text-(--cold-blue) text-xs">
          <div className="font-bold mb-1">✉️ PERSONLIGE MELDINGER</div>
          <div className="opacity-80">
            Julius sender spesielle brev til dere! Disse brevene vises her etter
            hvert som dere fullfører oppdrag.
          </div>
        </div>
      </div>
    </RetroWindow>
  );
}
