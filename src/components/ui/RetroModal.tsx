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
    <div className="fixed inset-0 flex items-center justify-center z-60 bg-black/70">
      <div
        className="relative w-[500px] max-w-[90%] bg-(--dark-crt) border-2 border-(--brass) shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
        style={{ animation: "scale-in 0.2s ease-out" }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between pl-4 bg-(--crt-bg) text-(--neon-green) border-b-2 border-(--brass)">
          <span className="text-xl tracking-wider">{title}</span>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center border-l-2 border-(--brass) hover:bg-(--brass)/30 transition-colors"
            aria-label="Lukk"
          >
            <Icons.Close size={20} color="green" />
          </button>
        </div>

        {/* Modal content */}
        <div className="p-6 text-(--neon-green) overflow-auto">{children}</div>
      </div>
    </div>
  );
}
