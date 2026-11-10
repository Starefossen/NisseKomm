"use client";

import { useEffect, useState } from "react";
import { StorageManager } from "@/lib/storage";
import { getCurrentDate, getCurrentDay } from "@/lib/date-utils";
import { IDLE_MS, TIDBITS, peekAllowed, rotate } from "@/lib/tidbits";

const EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

/**
 * Rampenissen peeks from a corner after IDLE_MS without input, at most once
 * an hour (tidbits.json idle). The parent unmounts it during frost mode,
 * day-1 boot, finale and open windows.
 */
export function IdlePeek() {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const now = getCurrentDate().getTime();
        if (!peekAllowed(StorageManager.getIdlePeek(), now)) return;
        const text = rotate(
          TIDBITS.idle.linjer,
          Math.floor(now / 3_600_000),
          getCurrentDay(),
        );
        if (!text) return;
        StorageManager.setIdlePeek(now);
        setLine(text);
      }, IDLE_MS);
    };
    const onInput = () => {
      setLine(null);
      arm();
    };
    arm();
    EVENTS.forEach((e) => window.addEventListener(e, onInput));
    return () => {
      clearTimeout(timer);
      EVENTS.forEach((e) => window.removeEventListener(e, onInput));
    };
  }, []);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none">
      {line && (
        <div className="fixed bottom-4 right-4 z-50 max-w-xs flex items-end gap-2 animate-[scale-in_0.4s_ease-out]">
          <div className="border-2 border-(--gold) bg-black/90 p-3 text-base text-(--gold)">
            {line}
          </div>
          <div aria-hidden className="text-4xl text-(--christmas-red)">
            ▲
          </div>
        </div>
      )}
    </div>
  );
}
