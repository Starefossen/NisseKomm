"use client";

import { fyll } from "@/lib/navn";
import { useEffect, useRef, useState } from "react";
import { SoundManager } from "@/lib/sounds";
import { GameEngine } from "@/lib/game-engine";
import Image from "next/image";
import { RetroModal } from "./RetroModal";

interface GrandFinaleModalProps {
  onClose: () => void;
}

/** Hidden stages keep their place, so the window never jumps as they appear. */
const trinn = (synlig: boolean) =>
  synlig ? "animate-[fadeIn_0.8s_ease-out]" : "invisible";

/**
 * Day 24 finale: thaw (tøvær), four stages. Text from app-tekster-2026.md A9.
 */
export function GrandFinaleModal({ onClose }: GrandFinaleModalProps) {
  const [stage, setStage] = useState(1);
  const stages = useRef<(HTMLDivElement | null)[]>([]);
  const godJul = useRef<HTMLButtonElement>(null);

  const playerNames = GameEngine.getPlayerNames();
  const tall = [
    [GameEngine.getCollectedSymbols().length, "symboler"],
    [GameEngine.getSolvedDecryptions().length, "dekrypteringer"],
    [GameEngine.getProgressionSummary().bonusOppdrag.completed, "bonus"],
  ] as const;
  const badge = GameEngine.getBadge("snofalls-venn");

  useEffect(() => {
    SoundManager.playSound("success");

    const timers = [2000, 4000, 6000].map((ms, i) =>
      setTimeout(() => setStage((s) => Math.max(s, i + 2)), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // On a phone the later stages are below the fold: follow the story down
  useEffect(() => {
    stages.current[stage]?.scrollIntoView?.({
      block: "nearest",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
    if (stage === 4) godJul.current?.focus({ preventScroll: true });
  }, [stage]);

  return (
    <RetroModal title="24. DESEMBER · FROSTGRAD 0 %" onClose={onClose} gull>
      {/* A tap anywhere skips the wait */}
      <div className="space-y-3 text-center" onClick={() => setStage(4)}>
        {/* 1: Thaw */}
        <div className="relative overflow-hidden py-2">
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-r from-transparent via-(--aurora)/40 to-transparent opacity-0 animate-[aurora-wash_4s_ease-out_0.3s]"
          />
          <h1 className="relative text-6xl md:text-7xl leading-none text-(--gold) tracking-widest [text-shadow:0_0_24px_color-mix(in_oklab,var(--gold)_60%,transparent)] animate-[flicker-in_0.8s_ease-out]">
            TØVÆR
          </h1>
        </div>

        {/* 2: The nice list */}
        <div
          ref={(el) => {
            stages.current[2] = el;
          }}
          className={`space-y-2 ${trinn(stage >= 2)}`}
        >
          <div className="text-xl tracking-wider">
            JULIUS SKREV NAVNENE SELV
          </div>
          <div className="text-3xl uppercase tracking-wider text-(--gold) border-2 border-(--gold) px-4 py-2 bg-(--gold)/10">
            {/* Skipped name entry still gets a named list */}
            {playerNames.length > 0
              ? playerNames.join(" · ")
              : fyll("Kristian · Håkon · Hanna")}
          </div>
          <div className="text-base opacity-80">
            22. desember, for hånd, én gang.
          </div>
        </div>

        {/* 3: What happened */}
        <div
          ref={(el) => {
            stages.current[3] = el;
          }}
          className={`border-2 border-(--brass) bg-(--crt-bg) ${trinn(stage >= 3)}`}
        >
          <div className="px-4 py-3 text-lg leading-snug">
            <p>Linjen holdt. 24 dager.</p>
            <p>Isen sukket, og dere hørte det.</p>
            <p>Muren holder. Porten står åpen.</p>
            <p>
              Sleden fløy over grotten med alle lysene på. Noe blått fløy opp og
              møtte den.
            </p>
          </div>
          <div className="grid grid-cols-3 border-t-2 border-(--brass)">
            {tall.map(([n, navn], i) => (
              <div
                key={navn}
                className={`py-1.5 ${i ? "border-l-2 border-(--brass)" : ""}`}
              >
                <div className="text-3xl leading-none text-(--cold-blue)">
                  {n}
                </div>
                <div className="text-base opacity-80">{navn}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 4: The badge and goodbye */}
        <div
          ref={(el) => {
            stages.current[4] = el;
          }}
          className={`space-y-3 pb-2 ${trinn(stage >= 4)}`}
        >
          {badge && (
            <div className="flex items-center justify-center gap-4">
              <Image
                src={`/badges/${badge.ikon}`}
                alt=""
                width={64}
                height={64}
                className="drop-shadow-[0_0_12px_color-mix(in_oklab,var(--gold)_60%,transparent)]"
              />
              <div className="text-3xl md:text-4xl text-(--gold) tracking-wider">
                {badge.navn.toUpperCase()}
              </div>
            </div>
          )}
          <div className="text-lg">
            <p>Det er ikke kaldt der nede lenger.</p>
            <p>Under treet ligger noe fra Vintervokteren. Det smelter ikke.</p>
          </div>
          <p className="text-base opacity-70">
            Diplom: Nissemor-guiden → Utskrifter
          </p>
          <button
            ref={godJul}
            onClick={onClose}
            className="min-h-12 px-10 py-2 bg-(--gold) border-2 border-(--gold) text-black font-bold text-2xl tracking-wider hover:bg-transparent hover:text-(--gold) transition-colors animate-[gold-glow_2s_ease-in-out_3]"
          >
            GOD JUL
          </button>
        </div>
      </div>
    </RetroModal>
  );
}
