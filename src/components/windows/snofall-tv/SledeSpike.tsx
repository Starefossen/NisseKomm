"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Teknisk spike for «IQs sledesimulator»: pseudo-3D vidde på et lavoppløst
 * 2D-canvas, reinsdyr i forgrunnen, varder og trær som ruller mot kameraet.
 * Ikke koblet til spillet. Åpnes fra /dev/slede-spike.
 */

const W = 640;
const H = 360;
const FOCAL = 300;
const ROAD_W = 900; // verdensbredde på sporet
const DRAW_DIST = 2400;
const SEG = 200; // avstand mellom objekter i z

type Thing = { z: number; x: number; kind: "varde" | "tre" };

const KEYS: Record<string, "L" | "R" | "U" | "D"> = {
  ArrowLeft: "L",
  ArrowRight: "R",
  ArrowUp: "U",
  ArrowDown: "D",
  a: "L",
  d: "R",
  w: "U",
  s: "D",
};

export default function SledeSpike() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const held = useRef(new Set<"L" | "R" | "U" | "D">());
  const [fps, setFps] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !ctx) return;

    // Spillerposisjon: x i [-1,1] over sporet, alt = høyde over bakken (verdensenheter).
    let px = 0;
    let alt = 120;
    let bank = 0;
    let dist = 0;
    const speed = 900; // enheter/s
    // Svak slalåm: sporet bøyer seg som en sinus i z.
    const curveAt = (z: number) => Math.sin(z / 2200) * 0.35;

    let things: Thing[] = [];
    let nextZ = 600;
    const spawn = () => {
      while (nextZ < dist + DRAW_DIST) {
        const i = Math.round(nextZ / SEG);
        if (i % 3 === 0) {
          things.push({ z: nextZ, x: i % 2 === 0 ? 0.5 : -0.5, kind: "varde" });
        } else {
          const side = i % 2 === 0 ? 1 : -1;
          things.push({
            z: nextZ,
            x: side * (1.3 + (i % 5) * 0.25),
            kind: "tre",
          });
        }
        nextZ += SEG;
      }
      things = things.filter((t) => t.z > dist - 50);
    };

    // Projiserer verdens-x (relativt sporet) og høyde h ved avstand z til skjerm.
    const project = (xRel: number, h: number, z: number) => {
      const zc = z - dist;
      const s = FOCAL / zc;
      const offset = curveAt(z) - curveAt(dist);
      const x = W / 2 + ((xRel - px) * ROAD_W * 0.5 + offset * zc) * s;
      const horizon = H * 0.42;
      const y = horizon + (alt - h) * s;
      return { x, y, s };
    };

    let last = 0;
    let frames = 0;
    let fpsAt = 0;
    let raf = 0;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      frames++;
      if (now - fpsAt > 500) {
        setFps(Math.round((frames * 1000) / (now - fpsAt)));
        frames = 0;
        fpsAt = now;
      }

      const k = held.current;
      const steer = (k.has("R") ? 1 : 0) - (k.has("L") ? 1 : 0);
      const climb = (k.has("U") ? 1 : 0) - (k.has("D") ? 1 : 0);
      px = Math.max(-1.2, Math.min(1.2, px + steer * 1.6 * dt));
      alt = Math.max(40, Math.min(260, alt + climb * 120 * dt));
      bank += (steer * 0.35 - bank) * Math.min(1, dt * 6);
      dist += speed * dt;
      spawn();

      const t = now / 1000;
      const horizon = H * 0.42;

      // Himmel med nordlys-slør.
      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, "#050816");
      sky.addColorStop(1, "#141c3a");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, horizon);
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < 3; i++) {
        const y0 = 30 + i * 28 + Math.sin(t * 0.7 + i) * 10;
        const g = ctx.createLinearGradient(0, y0, 0, y0 + 60);
        g.addColorStop(0, "rgba(0,255,138,0)");
        g.addColorStop(0.5, "rgba(0,255,138,0.6)");
        g.addColorStop(1, "rgba(120,80,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 32) {
          const y = y0 + Math.sin(x / 90 + t * 1.3 + i) * 12;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(W, horizon);
        ctx.lineTo(0, horizon);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Stjerner (deterministiske).
      ctx.fillStyle = "#cfd8ff";
      for (let i = 0; i < 60; i++) {
        const sx = ((i * 97) % W) - ((px * 30) % W);
        const sy = (i * 53) % (horizon - 20);
        if ((i + Math.floor(t * 2)) % 7 !== 0)
          ctx.fillRect((sx + W) % W, sy, 2, 2);
      }
      // Fjellsilhuett med parallakse.
      ctx.fillStyle = "#0b1030";
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      for (let x = 0; x <= W; x += 16) {
        const wx = x + px * 60 + curveAt(dist) * 200;
        const y =
          horizon -
          30 -
          Math.abs(Math.sin(wx / 70) * 28 + Math.sin(wx / 23) * 8);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, horizon);
      ctx.fill();

      // Bakken: ett strip per skjermlinje, z = alt*FOCAL/(y-horizon).
      for (let y = Math.ceil(horizon); y < H; y++) {
        const zc = (alt * FOCAL) / (y - horizon);
        const z = dist + zc;
        const band = Math.floor(z / 120) % 2 === 0;
        const fade = Math.min(1, zc / DRAW_DIST);
        ctx.fillStyle = band
          ? `rgb(${210 - fade * 150},${225 - fade * 150},${245 - fade * 130})`
          : `rgb(${185 - fade * 140},${205 - fade * 150},${235 - fade * 130})`;
        ctx.fillRect(0, y, W, 1);
        // Sporet: to mørkere meiespor som følger kurven.
        const s = FOCAL / zc;
        const cx =
          W / 2 + (-px * ROAD_W * 0.5 + (curveAt(z) - curveAt(dist)) * zc) * s;
        const half = ROAD_W * 0.5 * s;
        ctx.fillStyle = "rgba(80,110,170,0.5)";
        ctx.fillRect(cx - half, y, Math.max(1, s * 30), 1);
        ctx.fillRect(cx + half, y, Math.max(1, s * 30), 1);
      }

      // Objekter, bakerst først.
      for (let i = things.length - 1; i >= 0; i--) {
        const o = things[i];
        if (o.z <= dist) continue;
        const p = project(o.x, 0, o.z);
        if (o.kind === "tre") {
          const h = 160 * p.s;
          const w = 70 * p.s;
          ctx.fillStyle = "#0e2a26";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - h);
          ctx.lineTo(p.x - w, p.y);
          ctx.lineTo(p.x + w, p.y);
          ctx.fill();
          ctx.fillStyle = "#dbe8ff";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - h);
          ctx.lineTo(p.x - w * 0.35, p.y - h * 0.55);
          ctx.lineTo(p.x + w * 0.35, p.y - h * 0.55);
          ctx.fill();
        } else {
          const h = 90 * p.s;
          const w = 28 * p.s;
          ctx.fillStyle = "#3a3a44";
          ctx.fillRect(p.x - w / 2, p.y - h, w, h);
          const pulse = 0.6 + Math.sin(t * 6 + o.z) * 0.3;
          const r = Math.max(2, 40 * p.s);
          const g = ctx.createRadialGradient(p.x, p.y - h, 0, p.x, p.y - h, r);
          g.addColorStop(0, `rgba(255,200,80,${pulse})`);
          g.addColorStop(1, "rgba(255,140,0,0)");
          ctx.fillStyle = g;
          ctx.fillRect(p.x - r, p.y - h - r, r * 2, r * 2);
        }
      }

      // Reinsdyr: tre silhuetter foran sleden, lett trav og krenging.
      ctx.save();
      ctx.translate(W / 2, H * 0.78);
      ctx.rotate(bank * 0.4);
      const trot = Math.sin(t * 9);
      for (let i = 0; i < 3; i++) {
        const dx = (i - 1) * 54;
        const dy = Math.sin(t * 9 + i * 2) * 3;
        drawReindeer(ctx, dx, dy, 1 - i * 0.02, trot, i === 1);
      }
      // Tømmer fra sleden til hvert dyr.
      ctx.strokeStyle = "#8a6a3a";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const dx = (i - 1) * 54;
        ctx.beginPath();
        ctx.moveTo(dx * 0.2, 70);
        ctx.quadraticCurveTo(dx * 0.6, 40 + trot * 2, dx, 18);
        ctx.stroke();
      }
      // Sledens front.
      ctx.fillStyle = "#6b1a1a";
      ctx.fillRect(-90, 62, 180, 20);
      ctx.fillStyle = "#c9a227";
      ctx.fillRect(-90, 60, 180, 3);
      ctx.restore();

      // Snøfokk.
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      for (let i = 0; i < 40; i++) {
        const sx = (i * 131 + t * (300 + (i % 5) * 80)) % W;
        const sy = (i * 71 + t * 60) % H;
        ctx.fillRect(sx, sy, 2, 2);
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = KEYS[e.key];
      if (k) {
        held.current.add(k);
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = KEYS[e.key];
      if (k) held.current.delete(k);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const zone = (key: "L" | "R" | "U" | "D", label: string, cls: string) => (
    <button
      type="button"
      className={`pointer-events-auto select-none touch-none font-retro text-3xl text-(--neon-green) border-2 border-(--neon-green) bg-black/40 active:bg-(--neon-green) active:text-black ${cls}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        held.current.add(key);
      }}
      onPointerUp={() => held.current.delete(key)}
      onPointerCancel={() => held.current.delete(key)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );

  return (
    <div className="relative w-full aspect-video max-h-dvh bg-black select-none touch-none overflow-hidden">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="block w-full h-full"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="absolute inset-0 pointer-events-none font-retro text-(--neon-green)">
        <div className="absolute top-2 left-3 text-2xl">
          IQs SLEDE-TESTRIGG · {fps} FPS
        </div>
        <div className="absolute top-2 right-3 text-xl text-(--gold)">
          PILTASTER: KURS OG HØYDE
        </div>
        <div className="absolute inset-y-0 left-0 w-1/5 flex flex-col">
          {zone("L", "<", "flex-1 m-2")}
        </div>
        <div className="absolute inset-y-0 right-0 w-1/5 flex flex-col">
          {zone("U", "STIG", "flex-1 m-2 mb-1")}
          {zone("D", "DYKK", "flex-1 m-2 mt-1")}
        </div>
        <div className="absolute inset-y-0 left-1/5 w-1/5 flex flex-col">
          {zone("R", ">", "flex-1 m-2")}
        </div>
      </div>
    </div>
  );
}

// Reinsdyr sett bakfra: kropp, hals, hode med gevir, fire bein i trav.
function drawReindeer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  trot: number,
  lead: boolean,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#2a1a12";
  ctx.strokeStyle = "#2a1a12";
  ctx.lineWidth = 4;
  // Bein.
  for (let i = 0; i < 4; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const phase = i < 2 ? trot : -trot;
    ctx.beginPath();
    ctx.moveTo(side * 9, 8);
    ctx.lineTo(side * 11 + phase * 3, 28);
    ctx.stroke();
  }
  // Kropp og hals.
  ctx.beginPath();
  ctx.ellipse(0, 4, 16, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-5, -18, 10, 22);
  // Hode.
  ctx.beginPath();
  ctx.ellipse(0, -22, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Gevir.
  ctx.lineWidth = 2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 4, -28);
    ctx.lineTo(s * 10, -40);
    ctx.lineTo(s * 14, -36);
    ctx.moveTo(s * 7, -34);
    ctx.lineTo(s * 3, -40);
    ctx.stroke();
  }
  // Lederdyret har glødende mule.
  if (lead) {
    ctx.fillStyle = "#ff4040";
    ctx.shadowColor = "#ff4040";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, -26, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}
