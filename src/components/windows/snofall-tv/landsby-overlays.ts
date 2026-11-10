import type { LandsbyEventKind } from "./channels";

/**
 * Village events drawn over landsby-rolig.mp4. Positions are fractions of
 * the 1280×720 frame (same framing as nokkelramme-v2.jpg), so they follow
 * the cover-fit and handheld drift LiveCam applies to the video.
 */
export const LANDSBY_POINTS = {
  /** Slot of the red postkasse, right of the tower (825, 425). */
  postkasse: [0.645, 0.59],
  /** Top of the postkasse lid (829, 402); the box is ~45 px wide. */
  lokk: [0.648, 0.558],
  /** Foot of the golden clock tower in the square (645, 435). */
  tarn: [0.504, 0.604],
  /** Clock face (640, 300). */
  urskive: [0.5, 0.417],
} as const;
export const POSTKASSE_WIDTH = 0.035;
/** Gatehouse roof in the foreground, peak at (645, 428). */
const GATE_ROOF: [number, number][] = [
  [0.4, 0.8],
  [0.504, 0.594],
  [0.61, 0.8],
];
/** The sky ends around y = 110 px. */
export const SKY_BOTTOM = 0.15;

export interface FrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Frame fraction → canvas pixels for the drawn video rectangle. */
export function framePoint(
  [nx, ny]: readonly [number, number],
  r: FrameRect,
): [number, number] {
  return [r.x + nx * r.w, r.y + ny * r.h];
}

const BIRDS = 4;
const FLIGHT = 0.4; // share of the event each bird spends in the air
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);

function drawBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  flap: number,
  dir: number,
  alpha: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.globalAlpha = alpha;
  const wing = size * 0.45 * flap;
  ctx.fillStyle = "rgb(245,238,220)";
  ctx.strokeStyle = "rgba(120,100,70,0.8)";
  ctx.lineWidth = Math.max(0.5, size * 0.04);
  // Folded-paper body (an envelope diamond) with two triangle wings.
  ctx.beginPath();
  ctx.moveTo(size * 0.5, 0);
  ctx.lineTo(0, -size * 0.15);
  ctx.lineTo(-size * 0.5, 0);
  ctx.lineTo(0, size * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgb(230,222,200)";
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(size * 0.2, 0);
    ctx.lineTo(-size * 0.15, 0);
    ctx.lineTo(-size * 0.1, s * (size * 0.12 + wing));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawBrevfugler(
  ctx: CanvasRenderingContext2D,
  r: FrameRect,
  p: number,
  t: number,
) {
  const [ex, ey] = LANDSBY_POINTS.postkasse;
  const lastLanding = Math.max(
    ...Array.from({ length: BIRDS }, (_, i) => {
      const land = (i * (1 - FLIGHT)) / (BIRDS - 1) + FLIGHT;
      return land <= p ? land : -1;
    }),
  );
  // Lid bounce and glow just after each landing.
  const since = p - lastLanding;
  if (lastLanding > 0 && since < 0.08) {
    const k = Math.sin((since / 0.08) * Math.PI);
    const [lx, ly] = framePoint(LANDSBY_POINTS.lokk, r);
    const lw = POSTKASSE_WIDTH * r.w;
    const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, lw * 1.4);
    glow.addColorStop(0, `rgba(255,210,120,${0.6 * k})`);
    glow.addColorStop(1, "rgba(255,210,120,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(lx - lw * 1.5, ly - lw * 1.5, lw * 3, lw * 3);
    ctx.fillStyle = "rgb(150,25,25)";
    ctx.fillRect(lx - lw * 0.45, ly - k * lw * 0.15, lw * 0.9, lw * 0.12);
  }
  for (let i = 0; i < BIRDS; i++) {
    const start = (i * (1 - FLIGHT)) / (BIRDS - 1);
    const q = (p - start) / FLIGHT;
    if (q < 0 || q >= 1) continue;
    const s = ease(q);
    // Quadratic curve from the sky, swinging wide, down into the slot.
    const sx = 0.12 + 0.25 * i;
    const sy = SKY_BOTTOM * (0.3 + 0.2 * (i % 2));
    const cx = i % 2 ? 0.9 : 0.35;
    const cy = 0.2;
    const nx = lerp(lerp(sx, cx, s), lerp(cx, ex, s), s);
    const ny = lerp(lerp(sy, cy, s), lerp(cy, ey, s), s);
    const dx = 2 * (1 - s) * (cx - sx) + 2 * s * (ex - cx) >= 0 ? 1 : -1;
    // Perspective: farther (higher in frame) is smaller.
    // Near the box ~0.03 w, still narrower than the postkasse (0.035 w).
    const size = r.w * (0.016 + 0.024 * ny);
    const [x, y] = framePoint([nx, ny], r);
    const flap = q > 0.92 ? 0.2 : 0.6 + 0.4 * Math.sin(t * 9 + i * 2);
    drawBird(ctx, x, y, size, flap, dx, q > 0.9 ? (1 - q) * 10 : 1);
  }
}

function drawTarnklokke(
  ctx: CanvasRenderingContext2D,
  r: FrameRect,
  p: number,
) {
  const [cx, cy] = framePoint(LANDSBY_POINTS.tarn, r);
  const fade = 1 - p;
  // The clock face lights up as the ring leaves.
  const [fx, fy] = framePoint(LANDSBY_POINTS.urskive, r);
  const fr = r.w * 0.03;
  const face = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
  face.addColorStop(0, `rgba(255,220,130,${0.7 * fade})`);
  face.addColorStop(1, "rgba(255,220,130,0)");
  ctx.fillStyle = face;
  ctx.fillRect(fx - fr, fy - fr, fr * 2, fr * 2);
  // The ring stays inside the square: an ellipse foreshortened to its perspective.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, r.w * 0.18, r.w * 0.055, 0, 0, Math.PI * 2);
  // Cut out the gatehouse roof in front of the square so the ring goes behind it.
  ctx.moveTo(...framePoint(GATE_ROOF[0], r));
  for (const pt of GATE_ROOF.slice(1)) ctx.lineTo(...framePoint(pt, r));
  ctx.closePath();
  ctx.clip("evenodd");
  const rx = r.w * (0.02 + 0.15 * ease(p));
  ctx.strokeStyle = `rgba(255,205,110,${0.75 * fade})`;
  ctx.shadowColor = "rgba(255,190,90,0.9)";
  ctx.shadowBlur = r.w * 0.01;
  ctx.lineWidth = r.w * 0.006 * (1 + fade);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, rx * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Draw `kind` at progress 0–1; `t` (seconds) drives the wing flap. */
export function drawLandsbyEvent(
  ctx: CanvasRenderingContext2D,
  kind: LandsbyEventKind,
  progress: number,
  rect: FrameRect,
  t: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  if (kind === "brevfugler") drawBrevfugler(ctx, rect, progress, t);
  else drawTarnklokke(ctx, rect, progress);
  ctx.restore();
}
