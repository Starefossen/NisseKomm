"use client";

import { useEffect, useRef } from "react";
import { getCurrentDate } from "@/lib/date-utils";

/**
 * LiveCam - a procedurally animated CAM 2 (IQs verksted) feed.
 *
 * Everything is drawn into one canvas each frame: the still image with
 * handheld drift, lamp glow aligned to the light sources in the painting,
 * steam, sparks, snow in the window, frost creeping in from the edges,
 * CRT grain/scanlines/vignette/rolling bar, and a burned-in OSD.
 *
 * Prototype only: not wired into SnøfallTV yet.
 */

interface LiveCamProps {
  /** 0–100: how far Kulde has frozen the line. */
  frost: number;
  /** Kulde takes over the signal: blue ghost interference. */
  hijack?: boolean;
  className?: string;
}

const IMAGE_SRC = "/feed/iq-verksted.png";

// All coordinates are fractions of the image (1376x768), measured by eye.
const LAMPS = [
  { x: 0.403, y: 0.469, r: 0.045, rgb: "255,70,60", base: 0.5, hz: 6.1 },
  { x: 0.436, y: 0.469, r: 0.045, rgb: "80,255,130", base: 0.5, hz: 4.3 },
  { x: 0.585, y: 0.651, r: 0.045, rgb: "255,70,60", base: 0.5, hz: 5.7 },
  { x: 0.621, y: 0.651, r: 0.045, rgb: "80,255,130", base: 0.5, hz: 3.9 },
  { x: 0.658, y: 0.657, r: 0.03, rgb: "255,240,200", base: 0.4, hz: 9.1 },
  { x: 0.709, y: 0.638, r: 0.1, rgb: "255,170,60", base: 0.75, hz: 2.3 },
  { x: 0.763, y: 0.645, r: 0.055, rgb: "255,90,60", base: 0.5, hz: 4.9 },
  { x: 0.269, y: 0.742, r: 0.055, rgb: "255,70,60", base: 0.5, hz: 5.3 },
  { x: 0.3125, y: 0.755, r: 0.04, rgb: "255,190,90", base: 0.55, hz: 7.7 },
];
const SCOPE = { x: 0.425, y: 0.586, r: 0.034 };
const WINDOW = { x: 0.578, y: 0.241, w: 0.131, h: 0.338 };
const STEAM_SRC = { x: 0.32, y: 0.6 };
const SPARK_SRC = { x: 0.515, y: 0.615 };

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function makeGlow(rgb: string, size = 256): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0, `rgba(${rgb},0.9)`);
  grad.addColorStop(0.25, `rgba(${rgb},0.35)`);
  grad.addColorStop(0.6, `rgba(${rgb},0.08)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

function makeNoiseTile(size = 256, asAlpha = false): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const img = g.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = asAlpha ? 255 : v;
    img.data[i + 3] = asAlpha ? v : 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

// Blobby alpha mask: low-res alpha noise scaled up with smoothing, alphas
// multiplied across three scales so only a few patches stay opaque.
function makeBlobTile(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = true;
  [6, 14, 40].forEach((cells, i) => {
    g.globalCompositeOperation = i === 0 ? "source-over" : "destination-in";
    g.drawImage(makeNoiseTile(cells, true), 0, 0, 512, 512);
  });
  return c;
}

export function LiveCam({ frost, hijack = false, className }: LiveCamProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const props = useRef({ frost: 0, hijack: false });
  useEffect(() => {
    props.current = { frost: Math.max(0, Math.min(100, frost)) / 100, hijack };
  }, [frost, hijack]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const img = new Image();
    img.src = IMAGE_SRC;
    document.fonts?.load("20px VT323").catch(() => {});

    const glows = LAMPS.map((l) => makeGlow(l.rgb));
    const whiteGlow = makeGlow("255,255,255", 64);
    const noiseTiles = Array.from({ length: 4 }, () => makeNoiseTile());
    const blob = makeBlobTile();

    // Static layers rebuilt on resize (vignette, scanlines) and on frost change (ice).
    let W = 0;
    let H = 0;
    let vignette: HTMLCanvasElement | null = null;
    let scanlines: CanvasPattern | null = null;
    let ice: HTMLCanvasElement | null = null;
    let iceFrost = -1;

    const steam: Particle[] = [];
    const sparks: Particle[] = [];
    const flakes: Particle[] = [];
    const stutterUntil = new Array(LAMPS.length).fill(0);
    let nextSpark = 2000;
    let frozenUntil = 0;
    let hijackBurstUntil = 0;
    let nextHijackBurst = 0;
    let raf = 0;
    let lastDrawn = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (w === W && h === H) return;
      W = canvas.width = w;
      H = canvas.height = h;

      vignette = document.createElement("canvas");
      vignette.width = W;
      vignette.height = H;
      const vg = vignette.getContext("2d")!;
      const grad = vg.createRadialGradient(
        W / 2,
        H / 2,
        H * 0.35,
        W / 2,
        H / 2,
        H * 0.95,
      );
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,0.75)");
      vg.fillStyle = grad;
      vg.fillRect(0, 0, W, H);

      const sl = document.createElement("canvas");
      sl.width = 1;
      sl.height = 3;
      const sg = sl.getContext("2d")!;
      sg.fillStyle = "rgba(0,0,0,0.28)";
      sg.fillRect(0, 0, 1, 1);
      scanlines = ctx.createPattern(sl, "repeat");
      iceFrost = -1;
      flakes.length = 0;
    };

    // Ice layer: blob patches masked by an edge gradient whose reach grows with frost.
    const buildIce = (f: number) => {
      if (!ice) {
        ice = document.createElement("canvas");
      }
      ice.width = W;
      ice.height = H;
      const g = ice.getContext("2d")!;
      g.clearRect(0, 0, W, H);
      if (f <= 0.01) return;
      g.globalCompositeOperation = "source-over";
      g.drawImage(blob, 0, 0, W, H);
      g.drawImage(blob, -W * 0.37, -H * 0.21, W * 1.6, H * 1.6);
      // Adding the layer onto itself boosts alpha contrast: patches, not fog.
      g.globalCompositeOperation = "lighter";
      g.drawImage(ice, 0, 0);
      g.drawImage(ice, 0, 0);
      // Keep only patches near the edges; the clear centre shrinks with frost.
      g.globalCompositeOperation = "destination-in";
      const inner = H * (0.95 - f * 0.75);
      const grad = g.createRadialGradient(W / 2, H / 2, inner, W / 2, H / 2, H);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.5, `rgba(0,0,0,${0.4 + f * 0.5})`);
      grad.addColorStop(1, "rgba(0,0,0,1)");
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = "source-atop";
      g.fillStyle = "rgba(200,230,255,0.9)";
      g.fillRect(0, 0, W, H);
      // Solid rime along the very edge of the lens.
      g.globalCompositeOperation = "source-over";
      const rim = g.createRadialGradient(
        W / 2,
        H / 2,
        H * 0.7,
        W / 2,
        H / 2,
        H,
      );
      rim.addColorStop(0, "rgba(215,238,255,0)");
      rim.addColorStop(1, `rgba(215,238,255,${0.9 * f})`);
      g.fillStyle = rim;
      g.fillRect(0, 0, W, H);
      iceFrost = f;
    };

    const spawnSparks = () => {
      for (let i = 0; i < 14; i++) {
        sparks.push({
          x: SPARK_SRC.x * W + rand(-2, 2),
          y: SPARK_SRC.y * H,
          vx: rand(-1.6, 1.6) * (W / 1000),
          vy: rand(-3.2, -0.6) * (W / 1000),
          age: 0,
          life: rand(250, 650),
          size: rand(0.8, 2),
        });
      }
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!img.complete || img.naturalWidth === 0) return;
      resize();
      const { frost: f, hijack: hj } = props.current;
      const motion = !reduceMotion;
      // Reduced motion: redraw at 1 fps so only the clock moves.
      if (!motion && now - lastDrawn < 1000) return;
      // Frame freezes: the colder, the more often and the longer.
      if (motion && now < frozenUntil) return;
      if (motion && f > 0.3 && Math.random() < (f - 0.3) * 0.006) {
        frozenUntil = now + 150 + f * 1400;
      }
      const dt = Math.min(50, now - lastDrawn || 16);
      lastDrawn = now;
      const t = now / 1000;

      if (hj && motion) {
        if (now > nextHijackBurst) {
          hijackBurstUntil = now + rand(500, 1400);
          nextHijackBurst = hijackBurstUntil + rand(1500, 4000);
        }
      } else {
        hijackBurstUntil = 0;
        nextHijackBurst = 0;
      }
      const burst = now < hijackBurstUntil;
      const hjAmount = hj ? (burst ? 1 : 0.35 + 0.1 * Math.sin(t * 2)) : 0;

      // --- Base image with handheld drift (cover-fit) -----------------
      const scale = 1.05 + (motion ? 0.012 * Math.sin(t * 0.09) : 0);
      const dx = motion ? Math.sin(t * 0.13) * W * 0.006 : 0;
      const dy = motion ? Math.cos(t * 0.17) * H * 0.005 : 0;
      const cover = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const iw = img.naturalWidth * cover * scale;
      const ih = img.naturalHeight * cover * scale;
      const ix = (W - iw) / 2 + dx;
      const iy = (H - ih) / 2 + dy;
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.drawImage(img, ix, iy, iw, ih);
      const toX = (nx: number) => ix + nx * iw;
      const toY = (ny: number) => iy + ny * ih;

      // --- Cold grading: desaturate and cool down with frost ------------
      if (f > 0) {
        ctx.globalCompositeOperation = "saturation";
        ctx.fillStyle = `rgba(128,128,128,${f * 0.85})`;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = `rgba(110,160,230,${f * 0.16})`;
        ctx.fillRect(0, 0, W, H);
      }

      // --- Oscilloscope trace ------------------------------------------
      {
        const cx = toX(SCOPE.x);
        const cy = toY(SCOPE.y);
        const r = SCOPE.r * iw;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = "rgba(4,28,12,0.88)";
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        ctx.strokeStyle = "rgba(60,160,80,0.25)";
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(cx - r, cy + (i * r) / 2.5);
          ctx.lineTo(cx + r, cy + (i * r) / 2.5);
          ctx.moveTo(cx + (i * r) / 2.5, cy - r);
          ctx.lineTo(cx + (i * r) / 2.5, cy + r);
          ctx.stroke();
        }
        const amp = r * 0.55 * (1 - f * 0.7);
        const pts = 48;
        ctx.beginPath();
        for (let i = 0; i <= pts; i++) {
          const px = cx - r + (i / pts) * r * 2;
          const ph = (i / pts) * Math.PI * 4 - (motion ? t * 6 : 0);
          let py = cy + Math.sin(ph) * amp;
          if (hjAmount > 0.5) py += rand(-r * 0.4, r * 0.4) * hjAmount;
          else if (f > 0.5 && motion) py += rand(-1, 1) * (f - 0.5) * r * 0.3;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle =
          hjAmount > 0.5 ? "rgba(140,190,255,0.5)" : "rgba(90,255,130,0.45)";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.strokeStyle =
          hjAmount > 0.5 ? "rgb(200,230,255)" : "rgb(190,255,200)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // --- Lamp glow with per-lamp flicker ------------------------------
      ctx.globalCompositeOperation = "lighter";
      LAMPS.forEach((l, i) => {
        let a = l.base;
        if (motion) {
          a +=
            0.12 * Math.sin(t * l.hz + i) +
            0.08 * Math.sin(t * l.hz * 2.71 + i * 1.3);
          if (now < stutterUntil[i]) a *= 0.25;
          else if (Math.random() < 0.004 + f * 0.02) {
            stutterUntil[i] = now + rand(40, 220);
          }
        }
        a *= 1 - f * 0.55;
        a *= 1 - hjAmount * 0.8;
        if (a <= 0.01) return;
        const size = l.r * iw * 2;
        ctx.globalAlpha = Math.min(1, a);
        ctx.drawImage(
          glows[i],
          toX(l.x) - size / 2,
          toY(l.y) - size / 2,
          size,
          size,
        );
      });
      ctx.globalAlpha = 1;

      // --- Steam from the copper coils ----------------------------------
      if (motion) {
        const steamRate = (1 - f) * 0.9;
        if (steam.length < 30 && Math.random() < steamRate * 0.3) {
          steam.push({
            x: toX(STEAM_SRC.x) + rand(-6, 6),
            y: toY(STEAM_SRC.y),
            vx: rand(-0.15, 0.25),
            vy: rand(-0.55, -0.3),
            age: 0,
            life: rand(1800, 3200),
            size: rand(10, 18) * (W / 1000),
          });
        }
        ctx.globalCompositeOperation = "source-over";
        for (let i = steam.length - 1; i >= 0; i--) {
          const p = steam[i];
          p.age += dt;
          if (p.age > p.life) {
            steam.splice(i, 1);
            continue;
          }
          const k = p.age / p.life;
          p.x += (p.vx + Math.sin(t * 2 + i) * 0.1) * (dt / 16) * (W / 1000);
          p.y += p.vy * (dt / 16) * (W / 1000);
          const s = p.size * (1 + k * 2.5);
          ctx.globalAlpha = 0.16 * Math.sin(k * Math.PI);
          ctx.drawImage(whiteGlow, p.x - s / 2, p.y - s / 2, s, s);
        }
        ctx.globalAlpha = 1;
      }

      // --- Sparks -------------------------------------------------------
      if (motion && !hj) {
        if (now > nextSpark) {
          spawnSparks();
          nextSpark = now + rand(2500, 9000) * (1 + f * 3);
        }
        ctx.globalCompositeOperation = "lighter";
        for (let i = sparks.length - 1; i >= 0; i--) {
          const p = sparks[i];
          p.age += dt;
          if (p.age > p.life) {
            sparks.splice(i, 1);
            continue;
          }
          p.vy += 0.12 * (dt / 16) * (W / 1000);
          p.x += p.vx * (dt / 16);
          p.y += p.vy * (dt / 16);
          const k = 1 - p.age / p.life;
          ctx.strokeStyle = `rgba(255,${(180 + k * 60) | 0},80,${k})`;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
          ctx.stroke();
        }
      }

      // --- Snow in the arched window -----------------------------------
      {
        const wx = toX(WINDOW.x);
        const wy = toY(WINDOW.y);
        const ww = WINDOW.w * iw;
        const wh = WINDOW.h * ih;
        const want = 28 + Math.round(f * 40);
        while (flakes.length < want) {
          flakes.push({
            x: Math.random(),
            y: Math.random(),
            vx: 0,
            vy: rand(0.06, 0.16),
            age: rand(0, 10),
            life: 0,
            size: rand(1, 2.4),
          });
        }
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(wx, wy + ww / 2);
        ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0);
        ctx.lineTo(wx + ww, wy + wh);
        ctx.lineTo(wx, wy + wh);
        ctx.closePath();
        ctx.clip();
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(235,245,255,0.85)";
        for (const p of flakes) {
          if (motion) {
            p.y += p.vy * (dt / 1000) * (1 + f);
            if (p.y > 1) p.y -= 1;
          }
          const sway = Math.sin(t * 0.8 + p.age) * 0.03;
          const px = wx + ((p.x + sway + 1) % 1) * ww;
          const py = wy + p.y * wh;
          ctx.beginPath();
          ctx.arc(px, py, p.size * (W / 1000), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // --- Kulde hijack: blue ghost image ------------------------------
      if (hjAmount > 0) {
        ctx.globalCompositeOperation = "screen";
        const jitter = burst && motion ? rand(-W * 0.03, W * 0.03) : W * 0.012;
        ctx.globalAlpha = 0.35 * hjAmount;
        ctx.filter = "saturate(0) brightness(1.2)";
        ctx.drawImage(img, ix + jitter, iy + (burst ? rand(-4, 4) : 0), iw, ih);
        ctx.filter = "none";
        ctx.fillStyle = `rgba(70,130,255,${0.3 * hjAmount})`;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }

      // --- Ice creeping in from the edges -------------------------------
      if (Math.abs(f - iceFrost) > 0.02 || !ice) buildIce(f);
      if (ice && f > 0.01) {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.5 + f * 0.5;
        ctx.drawImage(ice, 0, 0);
        ctx.globalAlpha = 1;
      }

      // --- Dropouts / tearing (self-copy of horizontal bands) ----------
      if (motion) {
        const tearChance = f * 0.1 + hjAmount * 0.5;
        if (Math.random() < tearChance) {
          const bands = burst ? 4 : 1;
          for (let b = 0; b < bands; b++) {
            const y = (Math.random() * H) | 0;
            const h = rand(2, 14 + f * 30 + hjAmount * 40) | 0;
            const shift = rand(-W * 0.05, W * 0.05) * (1 + hjAmount * 2);
            ctx.drawImage(canvas, 0, y, W, h, shift, y, W, h);
          }
        }
      }

      // --- CRT: grain, scanlines, rolling bar, vignette -----------------
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = 0.07 + f * 0.2 + hjAmount * 0.25;
      const tile = noiseTiles[motion ? (Math.random() * 4) | 0 : 0];
      ctx.fillStyle = ctx.createPattern(tile, "repeat")!;
      ctx.save();
      ctx.translate(motion ? rand(0, 256) : 0, motion ? rand(0, 256) : 0);
      ctx.fillRect(-256, -256, W + 512, H + 512);
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      if (scanlines) {
        ctx.fillStyle = scanlines;
        ctx.fillRect(0, 0, W, H);
      }
      if (motion) {
        const by = (((t * 0.08) % 1.2) - 0.1) * H;
        const bar = ctx.createLinearGradient(
          0,
          by - H * 0.08,
          0,
          by + H * 0.08,
        );
        bar.addColorStop(0, "rgba(255,255,255,0)");
        bar.addColorStop(0.5, "rgba(255,255,255,0.06)");
        bar.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = bar;
        ctx.fillRect(0, by - H * 0.08, W, H * 0.16);
      }
      if (vignette) ctx.drawImage(vignette, 0, 0);

      // --- OSD ----------------------------------------------------------
      const fs = Math.max(12, Math.round(H * 0.045));
      const pad = Math.round(H * 0.035);
      ctx.font = `${fs}px VT323, monospace`;
      ctx.textBaseline = "top";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 3;
      const osdColor = hjAmount > 0.5 ? "rgb(150,200,255)" : "rgb(230,230,210)";
      ctx.fillStyle = osdColor;
      ctx.textAlign = "left";
      ctx.fillText(
        hjAmount > 0.5 && Math.random() < 0.3
          ? "CAM ? KULDE"
          : "CAM 2 IQS VERKSTED",
        pad,
        pad,
      );
      const d = getCurrentDate();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      ctx.textAlign = "right";
      ctx.fillText(`${hh}:${mm}:${ss}`, W - pad, pad);
      ctx.fillText(
        `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`,
        W - pad,
        pad + fs,
      );
      ctx.textAlign = "left";
      ctx.fillText(`TEMP ${Math.round(-2 - f * 28)}°C`, pad, H - pad - fs);
      if (!motion || Math.floor(t * 2) % 2 === 0) {
        ctx.fillStyle = "rgb(255,60,60)";
        ctx.fillText("● REC", pad, pad + fs);
      }
      if (hjAmount > 0.5) {
        ctx.font = `${fs * 1.6}px VT323, monospace`;
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(170,210,255,${0.5 + 0.5 * Math.random()})`;
        ctx.fillText("SIGNAL OVERTATT", W / 2 + rand(-3, 3), H * 0.42);
      }
      ctx.shadowBlur = 0;
    };

    raf = requestAnimationFrame(draw);
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full h-full bg-black ${className ?? ""}`}
      aria-label="CAM 2 – IQs verksted, direktesending"
      role="img"
    />
  );
}
