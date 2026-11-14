"use client";

import { ReactNode } from "react";
import { Icons } from "@/lib/icons";

interface RetroModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Celebration (snill-listen, finalen): gold frame with a glow, wider */
  gull?: boolean;
}

export function RetroModal({
  title,
  children,
  onClose,
  gull,
}: RetroModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`fixed inset-0 flex items-center justify-center z-60 ${gull ? "bg-black/80 p-2 md:p-4" : "bg-black/70"}`}
    >
      <div
        className={`relative flex flex-col max-h-full bg-(--dark-crt) border-2 ${
          gull
            ? "w-full max-w-3xl border-(--gold) shadow-[0_0_40px_color-mix(in_oklab,var(--gold)_35%,transparent)]"
            : "w-[500px] max-w-[90%] border-(--brass) shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
        }`}
        style={{ animation: "scale-in 0.2s ease-out" }}
      >
        {/* Title bar */}
        <div className="flex shrink-0 items-center justify-between pl-4 bg-(--crt-bg) text-(--neon-green) border-b-2 border-(--brass)">
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
        <div
          className={`${gull ? "p-4 md:p-6" : "p-6"} min-h-0 text-(--neon-green) overflow-auto`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
