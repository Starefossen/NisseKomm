"use client";

import { useState } from "react";
import { Icons } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      SoundManager.initialize();
      return SoundManager.isEnabled();
    }
    return true;
  });
  const [musicEnabled, setMusicEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return SoundManager.isMusicEnabled();
    }
    return false;
  });

  const handleToggle = () => {
    const newState = SoundManager.toggle();
    setEnabled(newState);
    SoundManager.playSound("click");
  };

  const handleMusicToggle = () => {
    const newState = SoundManager.toggleMusic();
    setMusicEnabled(newState);
    SoundManager.playSound("click");
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      {/* Music Toggle */}
      <button
        onClick={handleMusicToggle}
        className="flex items-center gap-2 px-3 py-2 bg-(--crt-bg) border-2 border-(--neon-green) hover:bg-(--neon-green)/20 transition-colors"
        title={musicEnabled ? "Skru av musikk" : "Skru på musikk"}
      >
        <Icons.Music size={20} color={musicEnabled ? "green" : "gray"} />
        <span
          className={`text-sm font-bold tracking-wider ${musicEnabled ? "text-(--neon-green)" : "text-(--gray)"}`}
        >
          {musicEnabled ? "MUSIKK" : "MUSIKK"}
        </span>
      </button>

      {/* Sound Effects Toggle */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-2 bg-(--crt-bg) border-2 border-(--neon-green) hover:bg-(--neon-green)/20 transition-colors"
        title={enabled ? "Skru av lydeffekter" : "Skru på lydeffekter"}
      >
        <Icons.Volume size={20} color={enabled ? "green" : "gray"} />
        <span
          className={`text-sm font-bold tracking-wider ${enabled ? "text-(--neon-green)" : "text-(--gray)"}`}
        >
          {enabled ? "EFFEKTER" : "EFFEKTER"}
        </span>
      </button>
    </div>
  );
}
