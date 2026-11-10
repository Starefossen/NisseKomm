"use client";

import { useState } from "react";
import { SoundManager } from "@/lib/sounds";

export function DarkChannel() {
  const [flipped, setFlipped] = useState(false);

  const handleToggle = () => {
    SoundManager.playSound("click");
    setFlipped((f) => !f);
  };

  return (
    <div className="absolute inset-0 bg-[#040604] flex flex-col items-center justify-center p-3 select-none text-(--neon-green) overflow-y-auto">
      {/* CRT scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.35)_0px,rgba(0,0,0,0.35)_1px,transparent_1px,transparent_3px)]" />

      {/* Channel OSD top bar */}
      <div className="w-full flex items-center justify-between text-xs sm:text-sm font-mono text-(--neon-green)/40 mb-2 px-2 z-10">
        <span>K2 IQS VERKSTED</span>
        <span>MØRK KANAL // SIKRING BRUTT</span>
      </div>

      {/* Fuse box SVG drawing */}
      <div className="relative z-10 flex flex-col items-center max-w-xs sm:max-w-sm w-full">
        <svg
          viewBox="0 0 240 130"
          className="w-full max-h-36 sm:max-h-44"
          aria-label="Tegning av sikringsboks"
        >
          {/* Cabinet outline */}
          <rect
            x="10"
            y="10"
            width="220"
            height="110"
            rx="4"
            fill="#020402"
            stroke="var(--neon-green)"
            strokeWidth="1.5"
            strokeOpacity="0.3"
          />
          {/* Inner bezel */}
          <rect
            x="18"
            y="18"
            width="204"
            height="94"
            fill="#010201"
            stroke="var(--neon-green)"
            strokeWidth="1"
            strokeOpacity="0.15"
          />

          {/* Screws in corners */}
          <circle
            cx="15"
            cy="15"
            r="2"
            fill="none"
            stroke="var(--neon-green)"
            strokeOpacity="0.2"
          />
          <circle
            cx="225"
            cy="15"
            r="2"
            fill="none"
            stroke="var(--neon-green)"
            strokeOpacity="0.2"
          />
          <circle
            cx="15"
            cy="115"
            r="2"
            fill="none"
            stroke="var(--neon-green)"
            strokeOpacity="0.2"
          />
          <circle
            cx="225"
            cy="115"
            r="2"
            fill="none"
            stroke="var(--neon-green)"
            strokeOpacity="0.2"
          />

          {/* Header text */}
          <text
            x="120"
            y="32"
            textAnchor="middle"
            fill="var(--neon-green)"
            fillOpacity="0.35"
            className="font-mono text-[9px] tracking-widest"
          >
            SIKRINGSSKAP // KURS 2
          </text>

          {/* 3 Blown Fuses */}
          {[60, 120, 180].map((x, idx) => (
            <g key={idx}>
              {/* Outer ceramic holder */}
              <circle
                cx={x}
                cy="64"
                r="18"
                fill="#050a05"
                stroke="var(--neon-green)"
                strokeWidth="1.5"
                strokeOpacity="0.25"
              />
              {/* Inner glass window */}
              <circle
                cx={x}
                cy="64"
                r="11"
                fill="#020302"
                stroke="var(--neon-green)"
                strokeWidth="1"
                strokeOpacity="0.2"
              />
              {/* Blown fuse indicator mark */}
              <circle
                cx={x}
                cy="64"
                r="3.5"
                fill="var(--christmas-red)"
                fillOpacity="0.5"
              />
              <path
                d={`M ${x - 5} 59 L ${x + 5} 69 M ${x + 5} 59 L ${x - 5} 69`}
                stroke="var(--christmas-red)"
                strokeWidth="1"
                strokeOpacity="0.6"
              />
              <text
                x={x}
                y="94"
                textAnchor="middle"
                fill="var(--christmas-red)"
                fillOpacity="0.5"
                className="font-mono text-[8px] tracking-wider"
              >
                UTLØST
              </text>
            </g>
          ))}

          {/* Connecting wire lines */}
          <line
            x1="25"
            y1="64"
            x2="42"
            y2="64"
            stroke="var(--neon-green)"
            strokeWidth="1"
            strokeOpacity="0.15"
          />
          <line
            x1="78"
            y1="64"
            x2="102"
            y2="64"
            stroke="var(--neon-green)"
            strokeWidth="1"
            strokeOpacity="0.15"
          />
          <line
            x1="138"
            y1="64"
            x2="162"
            y2="64"
            stroke="var(--neon-green)"
            strokeWidth="1"
            strokeOpacity="0.15"
          />
          <line
            x1="198"
            y1="64"
            x2="215"
            y2="64"
            stroke="var(--neon-green)"
            strokeWidth="1"
            strokeOpacity="0.15"
          />
        </svg>

        {/* Toggle switch button - 44px min touch target */}
        <div className="mt-2 flex flex-col items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={flipped}
            onClick={handleToggle}
            className="min-h-11 min-w-11 px-4 py-2 border-2 border-(--neon-green)/50 bg-black/90 text-(--neon-green) hover:border-(--neon-green) hover:bg-(--neon-green)/20 transition-colors motion-reduce:transition-none flex items-center gap-3 cursor-pointer select-none"
            aria-label="Vipp hovedsikring"
          >
            <span className="font-mono text-base font-bold">HOVEDSIKRING</span>
            <span
              className={`inline-flex items-center justify-center w-8 h-8 border font-mono text-sm font-bold transition-colors motion-reduce:transition-none ${
                flipped
                  ? "border-(--christmas-red) bg-(--christmas-red)/30 text-(--christmas-red)"
                  : "border-(--neon-green)/50 bg-black text-(--neon-green)/70"
              }`}
            >
              {flipped ? "▲" : "▼"}
            </span>
            <span className="font-mono text-sm">
              {flipped ? "UTLØST" : "AV"}
            </span>
          </button>

          {flipped && (
            <div
              aria-live="polite"
              className="mt-1 px-3 py-1.5 border border-(--gold)/60 bg-black/90 text-(--gold) font-mono text-base text-center max-w-sm transition-opacity motion-reduce:transition-none"
            >
              IQ: «Det var IKKE kaffetrakteren! Sikringen holder ikke før
              kretsen er hel!»
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
