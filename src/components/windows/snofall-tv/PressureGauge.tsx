"use client";

import { useEffect, useState } from "react";
import { getCurrentDate } from "@/lib/date-utils";
import { SoundManager } from "@/lib/sounds";

/**
 * Pressure gauge dial that slowly rises during the day based on the app's time
 * from date-utils.
 * 00:00:00 -> 1.0 BAR
 * 12:00:00 -> 5.25 BAR
 * 23:59:59 -> 9.5 BAR
 */
export function pressureForDate(d: Date): number {
  const seconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  const dayProgress = Math.min(1, Math.max(0, seconds / 86400));
  return 1.0 + dayProgress * 8.5;
}

export function PressureGauge() {
  const [date, setDate] = useState(() => getCurrentDate());
  const [venting, setVenting] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setDate(getCurrentDate());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const basePressure = pressureForDate(date);
  const currentPressure = venting
    ? Math.max(1.0, basePressure - 1.5)
    : basePressure;

  // Sweep from -120 deg (0 bar) to +120 deg (10 bar) -> 240 deg span
  const angle = Math.min(
    120,
    Math.max(-120, -120 + (currentPressure / 10) * 240),
  );

  const handleVent = () => {
    SoundManager.playSound("click");
    setVenting(true);
    setTimeout(() => {
      setVenting(false);
    }, 2000);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-black/60 backdrop-blur-[1px] select-none text-(--neon-green) pointer-events-auto overflow-y-auto">
      {/* Top HUD */}
      <div className="w-full flex justify-between text-xs sm:text-sm font-mono text-(--neon-green)/50 px-2 mb-1">
        <span>K2 IQS VERKSTED</span>
        <span>MANOMETER // LINJE-TRYKK</span>
      </div>

      <div className="flex flex-col items-center">
        {/* SVG Dial */}
        <svg
          viewBox="0 0 200 200"
          className="w-36 h-36 sm:w-44 sm:h-44"
          aria-label={`Trykkmåler: ${currentPressure.toFixed(1)} bar`}
        >
          {/* Outer dial ring */}
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="#030603"
            stroke="var(--neon-green)"
            strokeWidth="2.5"
            strokeOpacity="0.6"
          />
          {/* Inner ring */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="#010301"
            stroke="var(--neon-green)"
            strokeWidth="1"
            strokeOpacity="0.2"
          />

          {/* Normal arc (0 to 7.5 bar) and Danger arc (7.5 to 10 bar) */}
          <path
            d="M 28 141 A 80 80 0 0 1 141 33"
            fill="none"
            stroke="var(--neon-green)"
            strokeWidth="3"
            strokeOpacity="0.4"
          />
          <path
            d="M 141 33 A 80 80 0 0 1 172 141"
            fill="none"
            stroke="var(--christmas-red)"
            strokeWidth="3"
            strokeOpacity="0.7"
          />

          {/* Major tick marks and numbers */}
          {[0, 2, 4, 6, 8, 10].map((val) => {
            const tickAngle = -120 + (val / 10) * 240;
            const rad = (tickAngle - 90) * (Math.PI / 180);
            const x1 = 100 + 70 * Math.cos(rad);
            const y1 = 100 + 70 * Math.sin(rad);
            const x2 = 100 + 80 * Math.cos(rad);
            const y2 = 100 + 80 * Math.sin(rad);
            const tx = 100 + 58 * Math.cos(rad);
            const ty = 100 + 58 * Math.sin(rad);
            const isDanger = val >= 8;

            return (
              <g key={val}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={
                    isDanger ? "var(--christmas-red)" : "var(--neon-green)"
                  }
                  strokeWidth={2}
                  strokeOpacity={0.8}
                />
                <text
                  x={tx}
                  y={ty + 3}
                  textAnchor="middle"
                  fill={isDanger ? "var(--christmas-red)" : "var(--neon-green)"}
                  fillOpacity={0.8}
                  className="font-mono text-[9px] font-bold"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Center labels */}
          <text
            x="100"
            y="65"
            textAnchor="middle"
            fill="var(--neon-green)"
            fillOpacity="0.6"
            className="font-mono text-[9px] tracking-widest"
          >
            TRYKK (BAR)
          </text>
          <text
            x="100"
            y="140"
            textAnchor="middle"
            fill="var(--gold)"
            className="font-mono text-base sm:text-lg font-bold"
          >
            {currentPressure.toFixed(1)} BAR
          </text>
          <text
            x="100"
            y="155"
            textAnchor="middle"
            fill="var(--cold-blue)"
            fillOpacity="0.8"
            className="font-mono text-[8px] tracking-widest"
          >
            {venting ? "VENTIL ÅPEN" : "STATUS: STIGENDE"}
          </text>

          {/* Needle with rotation transform */}
          <g
            transform={`rotate(${angle} 100 100)`}
            className="transition-transform duration-500 ease-out motion-reduce:transition-none"
          >
            <line
              x1="100"
              y1="115"
              x2="100"
              y2="28"
              stroke="var(--gold)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <polygon points="97,35 103,35 100,24" fill="var(--gold)" />
          </g>

          {/* Center hub */}
          <circle cx="100" cy="100" r="8" fill="var(--neon-green)" />
          <circle cx="100" cy="100" r="3" fill="#010301" />
        </svg>

        {/* Valve release button - 44px min touch target */}
        <div className="mt-1 flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={handleVent}
            className="min-h-11 min-w-11 px-3 py-1.5 border border-(--neon-green)/60 bg-black/80 text-(--neon-green) hover:border-(--neon-green) hover:bg-(--neon-green)/20 text-xs sm:text-sm font-mono font-bold cursor-pointer transition-colors motion-reduce:transition-none"
          >
            LETT PÅ TRYKKEN
          </button>
          {venting && (
            <span className="text-(--cold-blue) font-mono text-xs">
              VENTIL ÅPNET – TRYKKET BYGGER SEG OPP IGJEN
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
