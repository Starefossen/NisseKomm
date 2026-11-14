"use client";

import { ReactNode } from "react";
import { Icon, Icons } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";

interface RetroWindowProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Near full screen, for scene-driven windows such as Ugleposten */
  stor?: boolean;
}

export function RetroWindow({
  title,
  children,
  onClose,
  stor,
}: RetroWindowProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 p-4">
      <div
        className={`relative w-full ${stor ? "max-h-full landscape:w-[min(100%,calc((100dvh-8.75rem)*16/9))]" : "md:w-[90%] md:max-w-4xl h-full"} bg-(--dark-crt) border-2 border-(--brass) shadow-[0_8px_40px_rgba(0,0,0,0.6)]`}
        style={{ animation: "scale-in 0.3s ease-out" }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between pl-4 bg-(--crt-bg) text-(--neon-green) border-b-2 border-(--brass)">
          <div className="flex items-center gap-2">
            <span className="text-xl md:text-2xl tracking-wider">{title}</span>
          </div>
          <button
            onClick={() => {
              SoundManager.playSound("click");
              onClose();
            }}
            className="w-12 h-12 flex items-center justify-center text-(--neon-green) border-l-2 border-(--brass) hover:bg-(--brass)/30 active:bg-(--brass)/50 transition-colors"
            aria-label="Lukk"
          >
            <Icons.Close size={24} color="green" />
          </button>
        </div>

        {/* Window content */}
        <div
          className={`h-[calc(100%-3.125rem)] ${stor ? "h-auto!" : ""} overflow-auto text-(--neon-green)`}
        >
          {children}
        </div>
        {stor && (
          // Games are built for landscape; a portrait iPad gets a prompt instead of a cut layout
          <div className="absolute inset-x-0 bottom-0 top-12.5 z-10 hidden [@media(orientation:portrait)_and_(pointer:coarse)]:flex flex-col items-center justify-center gap-4 bg-(--dark-crt) p-6 text-center text-(--neon-green)">
            <div className="flex items-center gap-3">
              <Icon name="tablet" size={64} color="gold" />
              <Icon name="redo" size={48} color="gold" />
            </div>
            <div className="text-3xl tracking-wider text-(--gold)">
              SNU SKJERMEN
            </div>
            <div className="text-xl">Legg iPaden på siden for å spille.</div>
          </div>
        )}
      </div>
    </div>
  );
}
