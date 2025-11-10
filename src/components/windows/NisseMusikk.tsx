"use client";

import { useState } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";

interface Track {
  id: number;
  title: string;
  duration: string;
}

const PLAYLIST: Track[] = [
  { id: 1, title: "Deilig er Jorden (8-bit)", duration: "2:45" },
  { id: 2, title: "Vi Tenner Våre Lykter (Chiptune)", duration: "3:12" },
  { id: 3, title: "Musevisa (Retro Mix)", duration: "2:30" },
  { id: 4, title: "Rudolf med Rød Nese (8-bit)", duration: "2:58" },
  { id: 5, title: "Bjelleklang (Oscillator Ver.)", duration: "2:15" },
  { id: 6, title: "Glade Jul (Synth Wave)", duration: "3:05" },
];

interface NisseMusikkProps {
  onClose: () => void;
}

export function NisseMusikk({ onClose }: NisseMusikkProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);

  const handlePlayPause = () => {
    if (isPlaying) {
      SoundManager.playSound("click");
      setIsPlaying(false);
    } else {
      SoundManager.playSound("success");
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    SoundManager.playSound("click");
    setCurrentTrack((prev) => (prev + 1) % PLAYLIST.length);
  };

  const handlePrevious = () => {
    SoundManager.playSound("click");
    setCurrentTrack((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
  };

  const handleTrackSelect = (index: number) => {
    SoundManager.playSound("click");
    setCurrentTrack(index);
    setIsPlaying(true);
  };

  const track = PLAYLIST[currentTrack];

  return (
    <RetroWindow title="NISSEMUSIKK - 8-BIT JUKEBOX" onClose={onClose}>
      <div className="p-6 h-full overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b-4 border-(--neon-green)/30">
          <Icons.Music size={32} color="blue" />
          <div className="flex-1">
            <div className="text-2xl font-bold tracking-wider">
              NORDPOL RADIO
            </div>
            <div className="text-sm opacity-70">
              KLASSISKE JULESANGER - RETRO EDITION
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 border-2 border-(--gold) bg-(--gold)/20">
            <div className="w-2 h-2 bg-(--gold) rounded-full animate-pulse-led"></div>
            <span className="text-(--gold) text-xs tracking-wider">
              LÅST OPP DAG 7
            </span>
          </div>
        </div>

        {/* Now Playing Display */}
        <div className="border-4 border-(--neon-green) bg-black p-6 space-y-4">
          <div className="text-center space-y-2">
            <div className="text-xs text-(--cold-blue) tracking-wider">
              NÅ SPILLER
            </div>
            <div className="text-2xl text-(--neon-green) font-bold tracking-wider animate-pulse">
              {track.title}
            </div>
            <div className="text-sm text-(--neon-green)/70">
              Spor {currentTrack + 1} av {PLAYLIST.length}
            </div>
          </div>

          {/* Visualizer (animated bars) */}
          <div className="flex items-end justify-center gap-1 h-16">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-2 bg-(--neon-green)"
                style={{
                  height: isPlaying ? `${20 + (i % 5) * 15}%` : "10%",
                  animation: isPlaying
                    ? `pulse ${0.5 + (i % 3) * 0.2}s ease-in-out infinite`
                    : "none",
                }}
              ></div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="h-2 bg-(--neon-green)/20 border border-(--neon-green)">
              <div
                className="h-full bg-(--neon-green) transition-all"
                style={{
                  width: isPlaying ? "45%" : "0%",
                  transition: "width 0.5s linear",
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-(--neon-green)/70">
              <span>1:23</span>
              <span>{track.duration}</span>
            </div>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePrevious}
            className="p-3 border-2 border-(--cold-blue) hover:bg-(--cold-blue)/20 transition-all hover:shadow-[0_0_10px_rgba(0,221,255,0.5)]"
          >
            <Icons.SkipBack size={24} color="blue" />
          </button>

          <button
            onClick={handlePlayPause}
            className="p-4 border-4 border-(--neon-green) hover:bg-(--neon-green)/20 transition-all hover:shadow-[0_0_15px_rgba(0,255,0,0.6)]"
          >
            {isPlaying ? (
              <Icons.Pause size={32} color="green" />
            ) : (
              <Icons.Play size={32} color="green" />
            )}
          </button>

          <button
            onClick={handleNext}
            className="p-3 border-2 border-(--cold-blue) hover:bg-(--cold-blue)/20 transition-all hover:shadow-[0_0_10px_rgba(0,221,255,0.5)]"
          >
            <Icons.SkipForward size={24} color="blue" />
          </button>
        </div>

        {/* Playlist */}
        <div className="border-2 border-(--neon-green)/30 space-y-0">
          <div className="p-2 bg-(--neon-green)/10 border-b-2 border-(--neon-green)/30">
            <div className="text-sm tracking-wider text-(--neon-green)">
              SPILLELISTE
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {PLAYLIST.map((t, index) => (
              <button
                key={t.id}
                onClick={() => handleTrackSelect(index)}
                className={`
                  w-full p-3 text-left flex items-center justify-between
                  border-b border-(--neon-green)/10 transition-all
                  ${index === currentTrack
                    ? "bg-(--neon-green)/20 text-(--neon-green)"
                    : "hover:bg-(--neon-green)/10 text-(--neon-green)/70 hover:text-(--neon-green)"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs opacity-70 w-6">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm tracking-wider">{t.title}</span>
                  {index === currentTrack && isPlaying && (
                    <div className="flex gap-0.5">
                      <div className="w-0.5 h-3 bg-(--neon-green) animate-pulse"></div>
                      <div className="w-0.5 h-3 bg-(--neon-green) animate-pulse delay-100"></div>
                      <div className="w-0.5 h-3 bg-(--neon-green) animate-pulse delay-200"></div>
                    </div>
                  )}
                </div>
                <span className="text-xs opacity-70">{t.duration}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info Message */}
        <div className="p-4 border-2 border-(--cold-blue)/30 bg-(--cold-blue)/5 text-(--cold-blue) text-xs">
          <div className="font-bold mb-1">ℹ️ SIMULERT AVSPILLING</div>
          <div className="opacity-80">
            8-bit musikkspiller låst opp etter 7 dager! I en fremtidig versjon
            vil dette spille ekte chiptune-julesanger med Web Audio API. 🎵
          </div>
        </div>
      </div>
    </RetroWindow>
  );
}
