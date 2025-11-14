"use client";

import { ReactNode } from "react";
import { Icons } from "@/lib/icons";

interface RetroModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function RetroModal({ title, children, onClose }: RetroModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/70">
      <div
        className="relative w-[500px] max-w-[90%] bg-(--crt-bg) border-4 border-(--cold-blue) shadow-[0_0_20px_rgba(0,221,255,0.3)]"
        style={{ animation: "scale-in 0.2s ease-out" }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-(--cold-blue) text-black border-b-4 border-(--cold-blue)">
          <span className="text-lg font-bold tracking-wider">{title}</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center bg-red-800 hover:bg-red-900 border-2 border-black transition-colors"
            aria-label="Lukk"
          >
            <Icons.Close size={16} color="gray" />
          </button>
        </div>

        {/* Modal content */}
        <div className="p-6 text-(--neon-green) overflow-auto">{children}</div>
      </div>
    </div>
  );
}
