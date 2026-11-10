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

/**
 * Day 14 only: small blue bird circling the clock tower slowly.
 * Perspective-correct: smaller than the postbox (0.035 w) everywhere,
 * slightly larger in front of the tower and smaller behind it.
 */
function drawBlafugl(
  ctx: CanvasRenderingContext2D,
  r: FrameRect,
  p: number,
  t: number,
) {
  const [cx, cy] = framePoint([0.502, 0.38], r);
  const rx = r.w * 0.085;
  const ry = r.w * 0.026;
  const theta = p * Math.PI * 2;
  const x = cx + rx * Math.cos(theta);
  const y = cy + ry * Math.sin(theta);

  // Velocity dx/dtheta = -rx * sin(theta) -> facing right when sin < 0, left when sin >= 0
  const dir = Math.sin(theta) < 0 ? 1 : -1;

  // Perspective scaling (always smaller than postbox width 0.035 * r.w)
  const baseSize = r.w * 0.018;
  const size = baseSize * (1 + 0.25 * Math.sin(theta));

  const behind = Math.sin(theta) < 0;
  const alpha = behind ? 0.85 : 1.0;
  const flap = 0.6 + 0.4 * Math.sin(t * 8);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "rgba(100, 200, 255, 0.85)";
  ctx.shadowBlur = size * 0.45;
  const wing = size * 0.45 * flap;

  // Blue origami body
  ctx.fillStyle = "rgb(110, 190, 255)";
  ctx.strokeStyle = "rgba(30, 80, 180, 0.9)";
  ctx.lineWidth = Math.max(0.5, size * 0.04);
  ctx.beginPath();
  ctx.moveTo(size * 0.5, 0);
  ctx.lineTo(0, -size * 0.15);
  ctx.lineTo(-size * 0.5, 0);
  ctx.lineTo(0, size * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wings
  ctx.fillStyle = "rgb(170, 225, 255)";
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

/**
 * Day 13 only, 06:00–09:00: Lucia procession across the square and out.
 * A short line of tiny figures in white robes with warm candle glows.
 */
function drawLuciatog(
  ctx: CanvasRenderingContext2D,
  r: FrameRect,
  p: number,
  t: number,
) {
  const sx = 0.26;
  const sy = 0.635;
  const ex = 0.74;
  const ey = 0.62;

  const count = 5;
  const spacing = 0.05;

  ctx.save();
  // Cut out the foreground gatehouse roof so procession walks behind it
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.moveTo(...framePoint(GATE_ROOF[0], r));
  for (const pt of GATE_ROOF.slice(1)) ctx.lineTo(...framePoint(pt, r));
  ctx.closePath();
  ctx.clip("evenodd");

  const figH = r.h * 0.028;
  const figW = r.w * 0.009;

  for (let i = 0; i < count; i++) {
    const u = p * 1.25 - i * spacing;
    if (u < 0 || u > 1) continue;

    const nx = sx + (ex - sx) * u;
    const ny = sy + (ey - sy) * u;
    const [fx, fy] = framePoint([nx, ny], r);

    // Fade in at entry, fade out at exit
    const alpha = Math.min(1, Math.max(0, u / 0.08, (1 - u) / 0.08));
    const isLucia = i === 0;

    // Small walk bobbing
    const bob = Math.abs(Math.sin(t * 7 + i * 1.3)) * (r.h * 0.0018);
    const y = fy - bob;
    const x = fx;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Candle glow on snow around figures
    const flicker = 0.85 + 0.15 * Math.sin(t * 12 + i * 3);
    const glowRadius = (isLucia ? r.w * 0.035 : r.w * 0.022) * flicker;
    const glowY = y - figH * 0.45;
    const glow = ctx.createRadialGradient(
      x + figW * 0.5,
      glowY,
      0,
      x + figW * 0.5,
      glowY,
      glowRadius,
    );
    glow.addColorStop(0, `rgba(255, 225, 110, ${isLucia ? 0.75 : 0.55})`);
    glow.addColorStop(0.35, "rgba(255, 175, 45, 0.25)");
    glow.addColorStop(1, "rgba(255, 140, 20, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(
      x + figW * 0.5 - glowRadius,
      glowY - glowRadius,
      glowRadius * 2,
      glowRadius * 2,
    );

    // White robe
    ctx.fillStyle = "rgba(245, 245, 238, 0.95)";
    ctx.beginPath();
    ctx.moveTo(x + figW * 0.25, y - figH * 0.65);
    ctx.lineTo(x + figW * 0.75, y - figH * 0.65);
    ctx.lineTo(x + figW, y);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();

    // Red sash for Lucia
    if (isLucia) {
      ctx.fillStyle = "rgba(215, 40, 40, 0.9)";
      ctx.fillRect(x + figW * 0.15, y - figH * 0.38, figW * 0.7, figH * 0.08);
    }

    // Head
    const headRadius = figW * 0.38;
    ctx.fillStyle = "rgb(240, 215, 190)";
    ctx.beginPath();
    ctx.arc(x + figW * 0.5, y - figH * 0.78, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Candles
    if (isLucia) {
      // Crown with 4 tiny candles
      const crownY = y - figH * 0.78 - headRadius;
      ctx.fillStyle = "rgb(255, 230, 120)";
      for (const cxOffset of [
        -figW * 0.35,
        -figW * 0.12,
        figW * 0.12,
        figW * 0.35,
      ]) {
        ctx.beginPath();
        ctx.arc(
          x + figW * 0.5 + cxOffset,
          crownY - figH * 0.06 * flicker,
          figW * 0.14,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    } else {
      // Handheld candle
      const candleX = x + figW * 0.85;
      const candleY = y - figH * 0.45;
      ctx.fillStyle = "rgb(240, 240, 230)";
      ctx.fillRect(candleX - figW * 0.1, candleY, figW * 0.2, figH * 0.15);
      // Flame
      ctx.fillStyle = "rgb(255, 220, 90)";
      ctx.beginPath();
      ctx.arc(
        candleX,
        candleY - figH * 0.05 * flicker,
        figW * 0.16,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    ctx.restore();
  }

  ctx.restore();
}

/** Draw `kind` at progress 0–1; `t` (seconds) drives animations. */
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
  else if (kind === "tarnklokke") drawTarnklokke(ctx, rect, progress);
  else if (kind === "blafugl") drawBlafugl(ctx, rect, progress, t);
  else if (kind === "luciatog") drawLuciatog(ctx, rect, progress, t);
  ctx.restore();
}
