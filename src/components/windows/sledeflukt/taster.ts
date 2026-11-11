/** Held keys for SLEDEFLUKT, shared by the stages and free flight. */
export type Held = {
  L: boolean;
  R: boolean;
  U: boolean;
  D: boolean;
  /** Sprang (boost) when the meter is full. */
  S: boolean;
  G: boolean;
  B: boolean;
};

export const tomHeld = (): Held => ({
  L: false,
  R: false,
  U: false,
  D: false,
  S: false,
  G: false,
  B: false,
});

// By e.code, not e.key: a letter released while Shift (FART) is down arrives
// as "A", not "a", and a key map on e.key never let go of it. That held the
// sled against the edge of the course.
const KODER: Record<string, keyof Held> = {
  ArrowLeft: "L",
  ArrowRight: "R",
  ArrowUp: "U",
  ArrowDown: "D",
  KeyA: "L",
  KeyD: "R",
  KeyW: "U",
  KeyS: "D",
  KeyE: "S",
  ShiftLeft: "G",
  ShiftRight: "G",
  KeyX: "B",
};

export const tast = (e: { code: string }): keyof Held | undefined =>
  KODER[e.code];

/** Space and Enter drop a package. */
export const erSlipp = (e: { code: string; key: string }) =>
  e.code === "Space" || e.key === "Enter";

/** Lets go of every key: keyups that happen while the window is unfocused never arrive. */
export function slippAlle(h: Held) {
  for (const k of Object.keys(h) as (keyof Held)[]) h[k] = false;
}

/** A stick value from a drag; NaN (a zero-size element) counts as centred. */
export const stikkeVerdi = (v: number) =>
  !Number.isFinite(v) || Math.abs(v) < 0.08 ? 0 : Math.max(-1, Math.min(1, v));
