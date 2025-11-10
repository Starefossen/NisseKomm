"use client";

import { useState, useEffect } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { StorageManager } from "@/lib/storage";
import { getCompletionCount } from "@/lib/oppdrag-loader";

interface NisseStatsProps {
  onClose: () => void;
  currentDay: number;
}

export function NisseStats({ onClose, currentDay }: NisseStatsProps) {
  const crisisStatus = StorageManager.getCrisisStatus();
  const isInventoryBroken = currentDay >= 17 && !crisisStatus.inventory;

  const [gaveProduksjon, setGaveProduksjon] = useState(() => {
    if (isInventoryBroken) return 0;
    if (crisisStatus.inventory) return 75000;
    return 48392;
  });
  const [nissekraft, setNissekraft] = useState(() => {
    if (isInventoryBroken) return 0;
    return 94;
  });
  const [workshopTemp, setWorkshopTemp] = useState(-2);

  const codes = StorageManager.getSubmittedCodes();
  const completionCount = getCompletionCount(codes.map((c) => c.kode));
  const completionPercent = Math.round((completionCount / 24) * 100);

  // Animate counters
  useEffect(() => {
    const interval = setInterval(() => {
      setGaveProduksjon((prev) => {
        if (isInventoryBroken) return 0;
        if (crisisStatus.inventory && prev < 75000) return 75000;
        if (prev >= 95000) return 48392;
        return prev + Math.floor(Math.random() * 100) + 50;
      });

      setNissekraft(() => {
        if (isInventoryBroken) return 0;
        return 90 + Math.floor(Math.random() * 10);
      });

      setWorkshopTemp((t) => {
        const variation = (Math.random() - 0.5) * 2;
        return Math.max(-15, Math.min(0, t + variation));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isInventoryBroken, crisisStatus.inventory, gaveProduksjon]);

  const dagerTilJul = (() => {
    const now = new Date();
    const christmas = new Date(now.getFullYear(), 11, 24);
    if (now > christmas) {
      christmas.setFullYear(christmas.getFullYear() + 1);
    }
    const diff = christmas.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  })();

  const reinsdyrStatus = isInventoryBroken
    ? "VENTER"
    : completionPercent === 100
      ? "KLAR!"
      : "TRENING";

  return (
    <RetroWindow title="NISSESTATS - SANNTIDSDATA" onClose={onClose}>
      <div className="p-6 h-full overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b-4 border-(--neon-green)/30">
          <Icons.Chart size={32} color="blue" />
          <div className="flex-1">
            <div className="text-2xl font-bold tracking-wider">
              PRODUKSJONSDATA
            </div>
            <div className="text-sm opacity-70">
              LIVE STATISTIKK FRA NORDPOLEN
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 border-2 border-(--gold) bg-(--gold)/20">
            <div className="w-2 h-2 bg-(--gold) rounded-full animate-pulse-led"></div>
            <span className="text-(--gold) text-xs tracking-wider">
              LÅST OPP DAG 16
            </span>
          </div>
        </div>

        {/* Crisis Warning */}
        {isInventoryBroken && (
          <div className="p-4 border-4 border-(--christmas-red) bg-(--christmas-red)/20 animate-[red-shake_0.5s_ease-in-out_infinite]">
            <div className="flex items-center gap-3">
              <Icons.Alert size={32} color="red" />
              <div>
                <div className="text-lg font-bold text-(--christmas-red)">
                  ⚠️ KRITISK FEIL ⚠️
                </div>
                <div className="text-sm text-(--christmas-red)/90">
                  INVENTORY SYSTEM OFFLINE - PRODUKSJON STOPPET
                </div>
                <div className="text-xs text-(--christmas-red)/70 mt-1">
                  Sjekk NISSEMAIL for instruksjoner
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Gave Produksjon */}
          <div
            className={`p-4 border-4 ${isInventoryBroken
                ? "border-(--christmas-red) bg-(--christmas-red)/10"
                : "border-(--neon-green) bg-(--neon-green)/10"
              }`}
          >
            <div className="text-xs opacity-70 mb-2">GAVEPRODUKSJON</div>
            <div
              className={`text-3xl font-bold tracking-wider ${isInventoryBroken
                  ? "text-(--christmas-red)"
                  : "text-(--neon-green)"
                }`}
            >
              {isInventoryBroken ? "OFFLINE" : gaveProduksjon.toLocaleString()}
            </div>
            {!isInventoryBroken && (
              <div className="text-xs opacity-70 mt-1">
                leker produsert i år
              </div>
            )}
          </div>

          {/* Dager til Jul */}
          <div className="p-4 border-4 border-(--gold) bg-(--gold)/10">
            <div className="text-xs opacity-70 mb-2">DAGER TIL JUL</div>
            <div className="text-3xl font-bold tracking-wider text-(--gold)">
              {dagerTilJul}
            </div>
            <div className="text-xs opacity-70 mt-1">
              {dagerTilJul === 0 ? "I DAG!" : "dager igjen"}
            </div>
          </div>

          {/* Nissekraft */}
          <div className="p-4 border-2 border-(--cold-blue)/50">
            <div className="text-xs text-(--cold-blue)/70 mb-2">NISSEKRAFT</div>
            <div className="relative h-6 bg-(--cold-blue)/20 border border-(--cold-blue)">
              <div
                className="absolute inset-y-0 left-0 bg-(--cold-blue) transition-all"
                style={{ width: `${nissekraft}%` }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-(--cold-blue)">
                {nissekraft}%
              </div>
            </div>
          </div>

          {/* Workshop Temp */}
          <div className="p-4 border-2 border-(--cold-blue)/50">
            <div className="text-xs text-(--cold-blue)/70 mb-2">
              VERKSTED TEMPERATUR
            </div>
            <div className="text-2xl font-bold text-(--cold-blue)">
              {workshopTemp.toFixed(1)}°C
            </div>
            <div className="text-xs text-(--cold-blue)/70 mt-1">
              {workshopTemp < -10 ? "Veldig kaldt!" : "Normalt"}
            </div>
          </div>
        </div>

        {/* Progress Tracking */}
        <div className="border-4 border-(--gold) p-4 space-y-3">
          <div className="text-sm font-bold text-(--gold)">
            OPPDRAGSFREMDRIFT
          </div>
          <div>
            <div className="flex justify-between text-xs text-(--gold)/70 mb-1">
              <span>Fullførte oppdrag</span>
              <span>
                {completionCount} / 24 ({completionPercent}%)
              </span>
            </div>
            <div className="h-4 bg-(--gold)/20 border-2 border-(--gold)">
              <div
                className="h-full bg-(--gold) transition-all"
                style={{ width: `${completionPercent}%` }}
              ></div>
            </div>
          </div>
          {completionPercent === 100 && (
            <div className="text-center text-sm font-bold text-(--gold) animate-[gold-flash_1s_ease-in-out_infinite]">
              🎄 ALLE OPPDRAG FULLFØRT! 🎄
            </div>
          )}
        </div>

        {/* Reinsdyr Status */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 border-2 border-(--neon-green)/30 text-center">
            <div className="text-xs text-(--neon-green)/70">REINSDYR</div>
            <div className="text-lg font-bold text-(--neon-green)">
              {reinsdyrStatus}
            </div>
          </div>
          <div className="p-3 border-2 border-(--neon-green)/30 text-center">
            <div className="text-xs text-(--neon-green)/70">SLEDE</div>
            <div className="text-lg font-bold text-(--neon-green)">KLAR</div>
          </div>
          <div className="p-3 border-2 border-(--neon-green)/30 text-center">
            <div className="text-xs text-(--neon-green)/70">JULENISSEN</div>
            <div className="text-lg font-bold text-(--neon-green)">
              {completionPercent === 100 ? "FLYR!" : "VENTER"}
            </div>
          </div>
        </div>

        {/* Live Updates Feed */}
        <div className="border-2 border-(--neon-green)/30 max-h-40 overflow-y-auto">
          <div className="p-2 bg-(--neon-green)/10 border-b-2 border-(--neon-green)/30">
            <div className="text-xs tracking-wider text-(--neon-green)">
              LIVE OPPDATERINGER
            </div>
          </div>
          <div className="divide-y divide-(--neon-green)/10">
            {[
              "Elf_042: Pakking av lego-sett fullført",
              "Elf_137: Kvalitetskontroll av teddybjørner OK",
              "Rudolf: Varmer opp for treningsøkt",
              "Nissemor: Syr nytt nisseantrekk",
              "Workshop: Temperatur stabil",
              "Security: Alle systemer operational",
            ].map((update, i) => (
              <div key={i} className="p-2 text-xs text-(--neon-green)/70">
                [{new Date().toLocaleTimeString("no-NO")}] {update}
              </div>
            ))}
          </div>
        </div>

        {/* Info Message */}
        <div className="p-4 border-2 border-(--cold-blue)/30 bg-(--cold-blue)/5 text-(--cold-blue) text-xs">
          <div className="font-bold mb-1">📊 SANNTIDSDATA</div>
          <div className="opacity-80">
            Live statistikk fra Nordpolen! Tallene oppdateres automatisk. Hold
            øye med gaveproduksjonen og følg med på fremdriften deres.
          </div>
        </div>
      </div>
    </RetroWindow>
  );
}
