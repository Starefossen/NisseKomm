"use client";

import { ReactNode } from "react";
import { Icons } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";

interface RetroWindowProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function RetroWindow({ title, children, onClose }: RetroWindowProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
      <div
        className="relative w-full md:w-[90%] md:max-w-4xl h-[90vh] md:h-[80vh] bg-(--crt-bg) border-4 border-(--neon-green) shadow-[0_0_20px_rgba(0,255,0,0.3)]"
        style={{ animation: "scale-in 0.3s ease-out" }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-(--neon-green) text-black border-b-4 border-(--neon-green)">
          <div className="flex items-center gap-2">
            <span className="text-lg md:text-xl font-bold tracking-wider">
              {title}
            </span>
          </div>
          <button
            onClick={() => {
              SoundManager.playSound("click");
              onClose();
            }}
            className="w-12 h-12 flex items-center justify-center bg-red-800 hover:bg-red-900 active:bg-red-950 border-2 border-black transition-colors"
            aria-label="Lukk"
          >
            <Icons.Close size={24} color="gray" />
          </button>
        </div>

        {/* Window content */}
        <div className="h-[calc(100%-3.5rem)] overflow-auto text-(--neon-green)">
          {children}
        </div>
      </div>
    </div>
  );
}
