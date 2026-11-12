"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/lib/icons";
import { sim } from "@/lib/simulation";
import {
  getCurrentDate,
  isTimeMachineEnabled,
  setTimeOverride,
} from "@/lib/date-utils";

const pad = (n: number) => String(n).padStart(2, "0");
const clamp = (v: string, max: number) =>
  Math.max(0, Math.min(max, Number(v) || 0));

/**
 * Dev/test-only control to set simulated date and time live.
 * Applying reloads the page so every component reads the new date.
 */
export function Tidsmaskin() {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);

  // Scripted playthroughs (scripts/gjennomspilling.mjs) drive the same tools
  useEffect(() => {
    if (!isTimeMachineEnabled()) return;
    (window as unknown as { nissekomm: unknown }).nissekomm = { sim };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!isTimeMachineEnabled()) return null;

  const openPanel = () => {
    const now = getCurrentDate();
    setDay(now.getMonth() === 11 ? Math.min(24, now.getDate()) : 1);
    setHour(now.getHours());
    setMinute(now.getMinutes());
    setOpen(true);
  };

  // "fremgang" leaves today unsolved; "løst" includes today.
  const apply = async (solveTo = 0) => {
    setTimeOverride({ day, month: 12, hour, minute });
    if (solveTo > 0) await sim.solveUntil(solveTo);
    window.location.reload();
  };

  const clear = () => {
    setTimeOverride(null);
    window.location.reload();
  };

  const reset = () => {
    if (!confirm("Nullstille all fremdrift? Tidsmaskinen beholder datoen.")) {
      return;
    }
    // Kid sessions can't clear the server (403); this screen is still reset.
    void sim
      .reset()
      .catch(() => {})
      .finally(() => window.location.reload());
  };

  const corner =
    "fixed bottom-2 right-2 z-[9999] font-retro text-sm print:hidden";
  const btn =
    "min-h-11 px-2 border-2 border-(--gold) text-(--gold) hover:bg-(--gold)/20";
  const field =
    "bg-black border border-(--neon-green) text-(--neon-green) min-h-11 px-1";

  if (!open) {
    return (
      <button
        onClick={openPanel}
        className={`${corner} ${btn} bg-black flex items-center gap-2`}
      >
        <Icons.Clock size={16} color="gold" aria-hidden />
        TIDSMASKIN
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Tidsmaskin"
      className={`${corner} w-64 bg-black border-2 border-(--brass)`}
    >
      <div className="flex items-center justify-between pl-2 bg-(--crt-bg) text-(--neon-green) border-b-2 border-(--brass) leading-none">
        <span className="tracking-wider">TIDSMASKIN (test)</span>
        <button
          onClick={() => setOpen(false)}
          className="w-11 h-11 -my-2 flex items-center justify-center hover:bg-(--brass)/30 active:bg-(--brass)/50 transition-colors"
          aria-label="Lukk"
        >
          <Icons.Close size={12} color="green" />
        </button>
      </div>
      <div className="p-2 space-y-2">
        <div className="flex items-center gap-1 text-(--neon-green)">
          <select
            aria-label="Dag"
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className={`${field} flex-1`}
          >
            {Array.from({ length: 24 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}. des
              </option>
            ))}
          </select>
          {/* Two 24 h fields: <input type="time"> follows the OS locale (AM/PM) */}
          <input
            type="number"
            min={0}
            max={23}
            aria-label="Time"
            value={pad(hour)}
            onChange={(e) => setHour(clamp(e.target.value, 23))}
            className={`${field} w-11`}
          />
          :
          <input
            type="number"
            min={0}
            max={59}
            aria-label="Minutt"
            value={pad(minute)}
            onChange={(e) => setMinute(clamp(e.target.value, 59))}
            className={`${field} w-11`}
          />
        </div>
        <div className="grid grid-cols-2 gap-1">
          {(
            [
              ["Gå til", "Gå til dag", () => apply()],
              ["Med fremgang", "Gå til dag med fremgang", () => apply(day - 1)],
              ["Løst", "Gå til dag, løst", () => apply(day)],
              ["Ekte tid", "Ekte tid", clear],
            ] as const
          ).map(([kort, full, fn]) => (
            <button
              key={full}
              onClick={() => void fn()}
              title={full}
              aria-label={full}
              className={btn}
            >
              {kort}
            </button>
          ))}
        </div>
        <button
          onClick={reset}
          className="min-h-11 px-2 text-xs border border-(--christmas-red) text-(--christmas-red) hover:bg-(--christmas-red)/20"
        >
          Nullstill fremdrift
        </button>
      </div>
    </div>
  );
}
