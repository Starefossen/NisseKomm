"use client";

import { useEffect, useState } from "react";
import { sim } from "@/lib/simulation";
import {
  getCurrentDate,
  isTimeMachineEnabled,
  setTimeOverride,
} from "@/lib/date-utils";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Dev/test-only control to set simulated date and time live.
 * Applying reloads the page so every component reads the new date.
 */
export function Tidsmaskin() {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(1);
  const [time, setTime] = useState("07:00");

  // Scripted playthroughs (scripts/gjennomspilling.mjs) drive the same tools
  useEffect(() => {
    (window as unknown as { nissekomm: unknown }).nissekomm = { sim };
  }, []);

  if (!isTimeMachineEnabled()) return null;

  const toggle = () => {
    if (!open) {
      const now = getCurrentDate();
      setDay(now.getMonth() === 11 ? Math.min(24, now.getDate()) : 1);
      setTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
    }
    setOpen(!open);
  };

  const apply = () => {
    const [hour, minute] = time.split(":").map(Number);
    setTimeOverride({ day, month: 12, hour, minute });
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
    sim.reset();
    window.location.reload();
  };

  const btn =
    "min-h-11 px-3 border-2 border-(--gold) text-(--gold) hover:bg-(--gold)/20";

  return (
    <div className="fixed bottom-2 right-2 z-[9999] font-mono text-sm print:hidden">
      {open && (
        <div className="mb-2 p-3 bg-black border-2 border-(--gold) space-y-2 w-64">
          <div className="text-(--gold) font-bold">TIDSMASKIN (test)</div>
          <label className="flex items-center justify-between gap-2 text-(--neon-green)">
            Dag
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="bg-black border border-(--neon-green) text-(--neon-green) min-h-11 px-2"
            >
              {Array.from({ length: 24 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}. des
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between gap-2 text-(--neon-green)">
            Klokke
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-black border border-(--neon-green) text-(--neon-green) min-h-11 px-2"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button onClick={apply} className={btn}>
              Bruk
            </button>
            <button onClick={clear} className={btn}>
              Ekte tid
            </button>
          </div>
          <button
            onClick={reset}
            className="w-full min-h-11 px-3 border-2 border-(--christmas-red) text-(--christmas-red) hover:bg-(--christmas-red)/20"
          >
            Nullstill fremdrift
          </button>
        </div>
      )}
      <button onClick={toggle} className={`${btn} bg-black`}>
        ⏱ TIDSMASKIN
      </button>
    </div>
  );
}
