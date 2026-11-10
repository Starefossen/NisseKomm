"use client";

import { useEffect, useRef } from "react";
import { getCurrentDate } from "@/lib/date-utils";
import type { LandsbyEventKind } from "./channels";
import { drawLandsbyEvent } from "./landsby-overlays";

/**
 * LiveCam - one Snøfall TV channel drawn into a single canvas each frame:
 * a looping video (or a still as fallback) with handheld drift, then the
 * code effects on top: frost grading and ice from the edges, Kulde's
 * hijack ghost, day-10 colour drain, day-20 flicker, day-21 freeze,
 * day-24 warmth, CRT grain/scanlines/vignette and a burned-in OSD.
 *
 * src === null means no carrier: pure snow.
 */

export interface LiveCamEffects {
  /** 0–100: how far Kulde has frozen the line. */
  frost: number;
  /** Kulde takes over the signal: blue ghost interference. */
  hijack?: boolean;
  /** Day 10: colours drained, brief glimpses of red and green, VHS stripes. */
  gray?: boolean;
  /** Day 20: the picture drops out more often. */
  flicker?: boolean;
  /** Day 21 before the code: frozen frame with Kulde's line. */
  frozen?: boolean;
  /** Day 24: warm, full colour. */
  warm?: boolean;
  /** Day 7: Kulde's signature burns in for a moment. */
  signature?: boolean;
  /** Ghost text shown in the middle while hijacked. */
  ghostLine?: string;
  /** Village event to draw over the picture right now (polled each frame). */
  eventAt?: () => { kind: LandsbyEventKind; progress: number } | null;
}

interface LiveCamProps extends LiveCamEffects {
  src: string | null;
  fallback?: string | null;
  label: string;
  className?: string;
}

const FPS = 30;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

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

export function LiveCam({
  src,
  fallback,
  label,
  className,
  ...fx
}: LiveCamProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const props = useRef<LiveCamEffects & { label: string }>({
    frost: 0,
    label,
  });
  useEffect(() => {
    props.current = {
      ...fx,
      label,
      frost: Math.max(0, Math.min(100, fx.frost)) / 100,
    };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let source: HTMLVideoElement | HTMLImageElement | null = null;
    let video: HTMLVideoElement | null = null;
    if (src?.endsWith(".mp4")) {
      video = document.createElement("video");
      video.src = src;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "auto";
      if (fallback) {
        const fallbackImg = new Image();
        fallbackImg.src = fallback;
        video.onerror = () => {
          source = fallbackImg;
          video = null;
        };
      }
      if (!reduceMotion) video.play().catch(() => {});
      source = video;
    } else if (src) {
      const img = new Image();
      img.src = src;
      source = img;
    }
    const activeVideo = video;
    // next/font registers a hashed family name; canvas needs it spelled out
    const font =
      getComputedStyle(document.body).getPropertyValue("--font-vt323") ||
      "monospace";
    document.fonts?.load(`20px ${font}`).catch(() => {});

    const noiseTiles = Array.from({ length: 4 }, () => makeNoiseTile());
    const blob = makeBlobTile();

    // Static layers rebuilt on resize (vignette, scanlines) and on frost change (ice).
    let W = 0;
    let H = 0;
    let vignette: HTMLCanvasElement | null = null;
    let scanlines: CanvasPattern | null = null;
    let ice: HTMLCanvasElement | null = null;
    let iceFrost = -1;

    let frozenUntil = 0;
    let hijackBurstUntil = 0;
    let nextHijackBurst = 0;
    let colourFlashUntil = 0;
    let colourFlashHue = 0;
    let raf = 0;
    let lastDrawn = 0;
    const startedAt = performance.now();

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
    };

    // Ice layer: blob patches masked by an edge gradient whose reach grows with frost.
    const buildIce = (f: number) => {
      if (!ice) ice = document.createElement("canvas");
      ice.width = W;
      ice.height = H;
      const g = ice.getContext("2d")!;
      g.clearRect(0, 0, W, H);
      iceFrost = f;
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
    };

    const sourceSize = (): [number, number] => {
      if (!source) return [0, 0];
      if (source instanceof HTMLVideoElement) {
        return source.readyState >= 2
          ? [source.videoWidth, source.videoHeight]
          : [0, 0];
      }
      return source.complete
        ? [source.naturalWidth, source.naturalHeight]
        : [0, 0];
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const motion = !reduceMotion;
      // 30 fps is plenty for a CRT feed and halves the work on laptops.
      if (now - lastDrawn < (motion ? 1000 / FPS - 2 : 1000)) return;
      resize();
      const p = props.current;
      const f = p.frozen ? 1 : p.frost;
      // Frame freezes: the colder, the more often and the longer.
      if (motion && now < frozenUntil) return;
      if (motion && f > 0.3 && Math.random() < (f - 0.3) * 0.012) {
        frozenUntil = now + 150 + f * 1400;
      }
      lastDrawn = now;
      const t = now / 1000;
      // Day 21: the line is frozen solid, the picture stops moving.
      if (video && motion) {
        if (p.frozen && !video.paused) video.pause();
        else if (!p.frozen && video.paused) video.play().catch(() => {});
      }

      if (p.hijack && motion) {
        if (now > nextHijackBurst) {
          hijackBurstUntil = now + rand(500, 1400);
          nextHijackBurst = hijackBurstUntil + rand(1500, 4000);
        }
      } else {
        hijackBurstUntil = 0;
        nextHijackBurst = 0;
      }
      const burst = now < hijackBurstUntil;
      const hjAmount = p.hijack
        ? burst
          ? 1
          : 0.35 + 0.1 * Math.sin(t * 2)
        : 0;

      // --- Base picture with handheld drift (cover-fit) -----------------
      const [sw, sh] = sourceSize();
      const drift = motion && !p.frozen;
      const scale = 1.05 + (drift ? 0.012 * Math.sin(t * 0.09) : 0);
      const dx = drift ? Math.sin(t * 0.13) * W * 0.006 : 0;
      const dy = drift ? Math.cos(t * 0.17) * H * 0.005 : 0;
      let ix = 0;
      let iy = 0;
      let iw = W;
      let ih = H;
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      // Day 20: the carrier drops out now and then.
      const dropout = p.flicker && motion && Math.random() < 0.04;
      if (sw && source && !dropout) {
        const cover = Math.max(W / sw, H / sh);
        iw = sw * cover * scale;
        ih = sh * cover * scale;
        ix = (W - iw) / 2 + dx;
        iy = (H - ih) / 2 + dy;
        ctx.drawImage(source, ix, iy, iw, ih);
        // Positions match the video framing only, not the fallback still.
        const ev = p.frozen || !video ? null : p.eventAt?.();
        if (ev) {
          // Reduced motion: one still frame from the middle of the event.
          const prog = motion ? ev.progress : 0.5;
          drawLandsbyEvent(
            ctx,
            ev.kind,
            prog,
            { x: ix, y: iy, w: iw, h: ih },
            t,
          );
        }
      } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);
      }
      const noSignal = !sw || dropout;

      // --- Grading: cold with frost, grey on day 10, warm on day 24 ------
      if (p.gray) {
        if (motion && now > colourFlashUntil && Math.random() < 0.01) {
          colourFlashUntil = now + rand(120, 400);
          colourFlashHue = Math.random() < 0.5 ? 0 : 1;
        }
        const flash = now < colourFlashUntil;
        ctx.globalCompositeOperation = "saturation";
        ctx.fillStyle = "rgb(128,128,128)";
        ctx.fillRect(0, 0, W, H);
        if (flash) {
          ctx.globalCompositeOperation = "color";
          ctx.fillStyle = colourFlashHue
            ? "rgba(40,220,90,0.55)"
            : "rgba(230,40,40,0.55)";
          ctx.fillRect(0, 0, W, H);
        }
      } else if (f > 0) {
        ctx.globalCompositeOperation = "saturation";
        ctx.fillStyle = `rgba(128,128,128,${f * 0.85})`;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = `rgba(110,160,230,${f * 0.16})`;
        ctx.fillRect(0, 0, W, H);
      }
      if (p.warm) {
        ctx.globalCompositeOperation = "soft-light";
        ctx.fillStyle = "rgba(255,170,80,0.35)";
        ctx.fillRect(0, 0, W, H);
      }

      // --- Kulde hijack: blue ghost image ------------------------------
      if (hjAmount > 0 && source && sw) {
        ctx.globalCompositeOperation = "screen";
        const jitter = burst && motion ? rand(-W * 0.03, W * 0.03) : W * 0.012;
        ctx.globalAlpha = 0.35 * hjAmount;
        ctx.drawImage(
          source,
          ix + jitter,
          iy + (burst ? rand(-4, 4) : 0),
          iw,
          ih,
        );
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = `rgba(70,130,255,${0.3 * hjAmount})`;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }

      // --- Ice creeping in from the edges -------------------------------
      ctx.globalCompositeOperation = "source-over";
      if (Math.abs(f - iceFrost) > 0.02 || !ice) buildIce(f);
      if (ice && f > 0.01) {
        ctx.globalAlpha = 0.5 + f * 0.5;
        ctx.drawImage(ice, 0, 0);
        ctx.globalAlpha = 1;
      }

      // --- Dropouts / tearing (self-copy of horizontal bands) ----------
      if (motion && !p.frozen) {
        const tearChance =
          f * 0.1 +
          hjAmount * 0.5 +
          (p.gray ? 0.25 : 0) +
          (p.flicker ? 0.2 : 0);
        if (Math.random() < tearChance) {
          const bands = burst || p.gray ? 3 : 1;
          for (let b = 0; b < bands; b++) {
            const y = (Math.random() * H) | 0;
            const h = rand(2, 14 + f * 30 + hjAmount * 40) | 0;
            const shift = rand(-W * 0.05, W * 0.05) * (1 + hjAmount * 2);
            ctx.drawImage(canvas, 0, y, W, h, shift, y, W, h);
          }
        }
      }

      // --- CRT: grain, scanlines, rolling bar, vignette -----------------
      ctx.globalCompositeOperation = noSignal ? "source-over" : "overlay";
      ctx.globalAlpha = noSignal ? 0.9 : 0.07 + f * 0.2 + hjAmount * 0.25;
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
        bar.addColorStop(0.5, `rgba(255,255,255,${p.gray ? 0.14 : 0.06})`);
        bar.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = bar;
        ctx.fillRect(0, by - H * 0.08, W, H * 0.16);
      }
      if (vignette) ctx.drawImage(vignette, 0, 0);

      // --- OSD ----------------------------------------------------------
      const fs = Math.max(12, Math.round(H * 0.045));
      const pad = Math.round(H * 0.035);
      ctx.font = `${fs}px ${font}`;
      ctx.textBaseline = "top";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 3;
      ctx.fillStyle = hjAmount > 0.5 ? "rgb(150,200,255)" : "rgb(230,230,210)";
      ctx.textAlign = "left";
      ctx.fillText(
        hjAmount > 0.5 && Math.random() < 0.3 ? "CAM ?" : p.label,
        pad,
        pad,
      );
      const d = getCurrentDate();
      const two = (n: number) => String(n).padStart(2, "0");
      ctx.textAlign = "right";
      ctx.fillText(
        `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`,
        W - pad,
        pad,
      );
      ctx.fillText(
        `${two(d.getDate())}.${two(d.getMonth() + 1)}`,
        W - pad,
        pad + fs,
      );
      ctx.textAlign = "left";
      ctx.fillText(`TEMP ${Math.round(-2 - f * 28)}°C`, pad, H - pad - fs);
      if (!motion || Math.floor(t * 2) % 2 === 0) {
        ctx.fillStyle = "rgb(255,60,60)";
        ctx.fillText("● REC", pad, pad + fs);
      }
      ctx.textAlign = "center";
      if (noSignal && !dropout) {
        ctx.font = `${fs * 1.4}px ${font}`;
        ctx.fillStyle = "rgba(230,230,210,0.8)";
        ctx.fillText("INGEN BÆREBØLGE", W / 2, H * 0.44);
      }
      if (hjAmount > 0.5 || p.frozen) {
        ctx.font = `${fs * 1.6}px ${font}`;
        ctx.fillStyle = `rgba(170,210,255,${p.frozen ? 0.9 : 0.5 + 0.5 * Math.random()})`;
        const line = p.ghostLine ?? "SIGNAL OVERTATT";
        ctx.fillText(line, W / 2 + (p.frozen ? 0 : rand(-3, 3)), H * 0.42);
      }
      // Day 7: the name burns in for a few seconds after tuning in.
      const sinceStart = now - startedAt;
      if (p.signature && sinceStart > 1200 && sinceStart < 4200) {
        ctx.font = `${fs * 4}px ${font}`;
        ctx.fillStyle = `rgba(170,215,255,${0.75 * Math.sin(((sinceStart - 1200) / 3000) * Math.PI)})`;
        ctx.fillText("KULDE", W / 2 + (motion ? rand(-4, 4) : 0), H * 0.32);
      }
      ctx.shadowBlur = 0;
    };

    raf = requestAnimationFrame(draw);
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (activeVideo) {
        activeVideo.pause();
        activeVideo.removeAttribute("src");
        activeVideo.load();
      }
    };
  }, [src, fallback]);

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full h-full bg-black ${className ?? ""}`}
      aria-label={`${label}, direktesending`}
      role="img"
    />
  );
}
