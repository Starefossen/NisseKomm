"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  erSlipp,
  slippAlle,
  stikkeVerdi,
  tast,
  tomHeld,
  type Held,
} from "./taster";

/** Keys typed into a field elsewhere in the window are not flying. */
const iFelt = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement | null;
  return (
    !!t &&
    (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
  );
};

/**
 * Keyboard and touch for SLEDEFLUKT, shared by the stages and free flight.
 * `påTast` handles the screen's own keys (pause, start); `påPause` runs when
 * the window loses focus, after every held key is let go.
 */
export function useKontroller(
  spiller: () => boolean,
  påTast: (e: KeyboardEvent) => void,
  påPause: () => void,
) {
  const held = useRef<Held>(tomHeld());
  const touch = useRef({ steer: 0, climb: 0, gass: 0 });
  const slipp = useRef(false);
  const sprang = useRef(false);
  const [touchHint, setTouchHint] = useState(false);
  const cb = useRef({ spiller, påTast, påPause });
  useEffect(() => {
    cb.current = { spiller, påTast, påPause };
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (iFelt(e)) return;
      const k = tast(e);
      if (k) {
        held.current[k] = true;
        if (k === "S") sprang.current = true;
        if (cb.current.spiller()) e.preventDefault();
      }
      if (erSlipp(e) && cb.current.spiller()) {
        slipp.current = true;
        e.preventDefault();
        return;
      }
      cb.current.påTast(e);
    };
    const up = (e: KeyboardEvent) => {
      const k = tast(e);
      if (k) held.current[k] = false;
    };
    // Losing focus (tab switch, home button) pauses; nothing flies unseen.
    const pause = () => {
      slippAlle(held.current);
      cb.current.påPause();
    };
    const skjult = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", skjult);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", skjult);
    };
  }, []);

  // One relative stick: where the finger lands is neutral, drag sideways for
  // course and up/down for altitude. A wider throw on touch, so a 9-year-old's
  // small drag is not full lock.
  const stikke = useRef<{
    id: number;
    x0: number;
    y0: number;
    fin: number;
  } | null>(null);
  const onPointer = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const el = ev.currentTarget;
    const rect = el.getBoundingClientRect();
    const nx = (ev.clientX - rect.left) / rect.width;
    const ny = (ev.clientY - rect.top) / rect.height;
    if (ev.type === "pointerdown") {
      if (stikke.current) return;
      el.setPointerCapture(ev.pointerId);
      const mus = ev.pointerType === "mouse";
      stikke.current = { id: ev.pointerId, x0: nx, y0: ny, fin: mus ? 1 : 1.5 };
      if (!mus) setTouchHint(true);
      return;
    }
    const s = stikke.current;
    if (!s || s.id !== ev.pointerId) return;
    if (
      ev.type === "pointerup" ||
      ev.type === "pointercancel" ||
      ev.type === "lostpointercapture"
    ) {
      stikke.current = null;
      touch.current.steer = 0;
      touch.current.climb = 0;
      return;
    }
    touch.current.steer = stikkeVerdi((nx - s.x0) / (0.12 * s.fin));
    touch.current.climb = stikkeVerdi((s.y0 - ny) / 0.2);
  };
  const slippGass = () => {
    touch.current.gass = 0;
  };

  return { held, touch, slipp, sprang, touchHint, onPointer, slippGass };
}
