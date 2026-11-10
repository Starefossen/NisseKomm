"use client";

import { useEffect, useRef, useState } from "react";
import { getCurrentDate } from "./date-utils";

const hourKey = () => {
  const d = getCurrentDate();
  return `${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
};

/**
 * Re-renders when the day or hour changes, so midnight unlocks, the 20:00
 * frost fail-safe and a new Julius video show up without a reload.
 */
export function useHourTick(onChange: () => void): string {
  const [key, setKey] = useState(hourKey);
  const last = useRef(key);
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  });
  useEffect(() => {
    const id = setInterval(() => {
      const next = hourKey();
      if (next === last.current) return;
      last.current = next;
      setKey(next);
      cb.current();
    }, 60_000);
    return () => clearInterval(id);
  }, []);
  return key;
}
