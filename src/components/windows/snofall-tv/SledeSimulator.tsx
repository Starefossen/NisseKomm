"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { GameEngine } from "@/lib/game-engine";
import { mediaUrl } from "@/lib/media";
import { SoundManager } from "@/lib/sounds";
import {
  ALT_MAX,
  ALT_MIN,
  bjeller,
  createSim,
  ETAPPER,
  etapperFor,
  rekkeMult,
  type Hendelse,
  type Sim,
  type SledeEtappe,
  type Styring,
  type Ting,
} from "./slede";
import { SledeLyd } from "./slede-lyd";

/**
 * IQs sledesimulator: a pseudo-3D canvas (640×360, CSS-scaled) with IQ's brass
 * instrument panel in React on top. Pure play after the day's code; no clues.
 * The simulation itself lives in slede.ts; this file draws, listens and saves.
 */

const W = 640;
const H = 360;
const HOR = 150;
const FOCAL = 300;
const HALF = 450; // world units per track unit
const FADE_STEPS = 48;
/** Longest thing on a course (the cave in lagBane). */
const GROTTE_MAX = 1600;

type Fase = "start" | "spiller" | "pause" | "slutt" | "tapt";

interface Hud {
  alt: number;
  fart: number;
  poeng: number;
  varder: number;
  varderTotalt: number;
  liv: number;
  kraft: number;
  sprang: boolean;
  mult: number;
  vind: number;
  framdrift: number;
  nyser: boolean;
}

const KEYS: Record<string, keyof Held> = {
  ArrowLeft: "L",
  ArrowRight: "R",
  ArrowUp: "U",
  ArrowDown: "D",
  a: "L",
  d: "R",
  w: "U",
  s: "D",
  " ": "S",
};
type Held = { L: boolean; R: boolean; U: boolean; D: boolean; S: boolean };

const curveAt = (z: number) => Math.sin(z / 2600) * 0.3;

// Offscreen sprites built once: radial glow, star, frost vignette, aurora band.
function glowSprite(color: string, inner = 0) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, inner, 32, 32, 32);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

function starSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d")!;
  g.translate(16, 16);
  g.fillStyle = "#ffe066";
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 5 : 13;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.fill();
  return c;
}

function frostSprite() {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(
    W / 2,
    H / 2,
    H * 0.45,
    W / 2,
    H / 2,
    H * 0.95,
  );
  grad.addColorStop(0, "rgba(220,235,255,0)");
  grad.addColorStop(1, "rgba(220,235,255,0.85)");
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  return c;
}

function auroraSprite() {
  const c = document.createElement("canvas");
  c.width = W + 64;
  c.height = 80;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, 80);
  grad.addColorStop(0, "rgba(0,255,138,0)");
  grad.addColorStop(0.35, "rgba(0,255,138,0.55)");
  grad.addColorStop(0.7, "rgba(120,80,255,0.35)");
  grad.addColorStop(1, "rgba(120,80,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, 80);
  return c;
}

/** Fallback horizon when the painted still is missing: silhouette ridge on a gradient. */
function ridgeSprite(e: SledeEtappe) {
  const c = document.createElement("canvas");
  c.width = W * 2;
  c.height = HOR;
  const g = c.getContext("2d")!;
  const sky = g.createLinearGradient(0, 0, 0, HOR);
  sky.addColorStop(0, e.himmel[0]);
  sky.addColorStop(1, e.himmel[1]);
  g.fillStyle = sky;
  g.fillRect(0, 0, c.width, HOR);
  g.fillStyle = "#cfd8ff";
  for (let i = 0; i < 90; i++) {
    g.globalAlpha = 0.4 + ((i * 37) % 10) / 16;
    g.fillRect((i * 193) % c.width, (i * 71) % (HOR - 40), 2, 2);
  }
  g.globalAlpha = 1;
  g.fillStyle = e.tåke ? "#2a3345" : "#0b1030";
  g.beginPath();
  g.moveTo(0, HOR);
  for (let x = 0; x <= c.width; x += 8) {
    g.lineTo(
      x,
      HOR - 22 - Math.abs(Math.sin(x / 70) * 26 + Math.sin(x / 23) * 8),
    );
  }
  g.lineTo(c.width, HOR);
  g.fill();
  return c;
}

function groundPalette(e: SledeEtappe) {
  const hex = (h: string) =>
    [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const fog = hex(e.dis);
  return e.snø.map((s) => {
    const c = hex(s);
    return Array.from({ length: FADE_STEPS }, (_, i) => {
      const f = Math.pow(i / (FADE_STEPS - 1), e.tåke ? 0.6 : 1);
      const m = c.map((v, k) => Math.round(v + (fog[k] - v) * f));
      return `rgb(${m[0]},${m[1]},${m[2]})`;
    });
  });
}

export function SledeSimulator({ day }: { day: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const held = useRef<Held>({
    L: false,
    R: false,
    U: false,
    D: false,
    S: false,
  });
  const touch = useRef({ steer: 0, climb: 0 });
  const simRef = useRef<Sim | null>(null);
  const faseRef = useRef<Fase>("start");
  const lyd = useRef<SledeLyd | null>(null);
  const bilde = useRef<HTMLImageElement | null>(null);
  const [resultat, setResultat] = useState({ poeng: 0, bjeller: 0, beste: 0 });

  const åpne = etapperFor(day);
  const [etappe, setEtappe] = useState<SledeEtappe>(
    åpne[åpne.length - 1] ?? ETAPPER[0],
  );
  const etappeRef = useRef(etappe);
  const [assist, setAssist] = useState(true);
  const [fase, setFaseState] = useState<Fase>("start");
  const [hud, setHud] = useState<Hud | null>(null);
  const [beste, setBeste] = useState(() => GameEngine.getSledeResultater());
  const [touchHint, setTouchHint] = useState(false);
  const reduceMotion = useRef(false);

  // A tap can start and end between two frames; the loop consumes this latch.
  const sprang = useRef(false);

  const setFase = (f: Fase) => {
    // Wind restarts on its own via setVind when flying resumes.
    if (f !== "spiller") lyd.current?.stop();
    // Back on the start screen: a fresh course for attract mode.
    if (f === "start")
      simRef.current = createSim(etappeRef.current, {
        assist: true,
        reduceMotion: true,
      });
    faseRef.current = f;
    setFaseState(f);
  };

  const start = () => {
    SoundManager.playSound("click");
    simRef.current = createSim(etappe, {
      assist,
      reduceMotion: reduceMotion.current,
    });
    lyd.current?.startVind();
    setFase("spiller");
  };

  // Painted horizon for the chosen stage; the ridge fallback is drawn until it loads.
  useEffect(() => {
    bilde.current = null;
    etappeRef.current = etappe;
    const img = new Image();
    img.onload = () => (bilde.current = img);
    img.src = mediaUrl(etappe.horisont.fil);
    simRef.current = createSim(etappe, { assist: true, reduceMotion: true });
    return () => {
      img.onload = null;
    };
  }, [etappe]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !ctx) return;
    reduceMotion.current =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    const motion = reduceMotion.current ? 0.35 : 1;
    lyd.current = new SledeLyd();
    const font = getComputedStyle(canvas).fontFamily || "monospace";

    const GLOW_ORANGE = glowSprite("rgba(255,190,70,0.95)");
    const GLOW_GOLD = glowSprite("rgba(255,235,160,1)", 4);
    const GLOW_RED = glowSprite("rgba(255,70,60,0.9)");
    const GLOW_GREEN = glowSprite("rgba(0,255,138,0.7)");
    const GLOW_WHITE = glowSprite("rgba(245,250,255,1)", 12);
    const STAR = starSprite();
    const FROST = frostSprite();
    const AURORA = auroraSprite();
    let ridge = ridgeSprite(etappe);
    let palette = groundPalette(etappe);
    let paletteFor = etappe;

    // Snowflakes: x, y, size, fall speed.
    const flakes = Array.from({ length: 140 }, (_, i) => ({
      x: (i * 131) % W,
      y: (i * 71) % H,
      s: 1 + (i % 3),
      v: 60 + (i % 5) * 40,
    }));
    const splats: { x: number; y: number; r: number; t: number }[] = [];
    const texts: { s: string; x: number; y: number; t: number; c: string }[] =
      [];
    let shake = 0;
    let flash = 0;
    let nyser = 0;
    let streaks = 0;
    let last = 0;
    let hudAt = 0;
    let raf = 0;
    let sprangGlow = 0;

    const say = (s: string, c = "#ffd700") =>
      texts.push({ s, x: W / 2, y: H * 0.5, t: 0, c });

    const hendelse = (h: Hendelse, sim: Sim) => {
      const l = lyd.current;
      switch (h) {
        case "bjelle":
          l?.bjelle(rekkeMult(sim.s.rekke));
          flash = 0.25;
          if (sim.s.rekke % 3 === 0 && sim.s.rekke > 0)
            say(`REKKE x${rekkeMult(sim.s.rekke)}`, "#00ff8a");
          break;
        case "bom":
          if (sim.s.besteRekke >= 3) say("REKKEN RØK", "#8aa0c0");
          break;
        case "nære":
          l?.stjerne();
          say("NÆRE PÅ!", "#ffb347");
          break;
        case "stjerne":
          l?.stjerne();
          break;
        case "band":
          l?.stjerne();
          say("LØFT!", "#00ff8a");
          break;
        case "port":
          l?.port();
          flash = 0.6;
          say("PORTEN STÅR ÅPEN  +500");
          break;
        case "grotte":
          l?.port();
          say("LYS NED I GROTTEN  +150");
          break;
        case "sprang":
          l?.sprang();
          streaks = 3;
          sprangGlow = 3;
          say("SPRANG!", "#ff8a5a");
          break;
        case "krasj":
          l?.krasj();
          nyser = 1.5;
          if (!reduceMotion.current) shake = 0.45;
          for (let i = 0; i < 9; i++) {
            splats.push({
              x: W * 0.1 + Math.random() * W * 0.8,
              y: H * 0.15 + Math.random() * H * 0.7,
              r: 10 + Math.random() * 22,
              t: 0,
            });
          }
          say(
            sim.s.tapt ? "IQ KOBLER INN NØDBREMSEN" : "KLONK! SNØ I ANSIKTET",
            "#f0624a",
          );
          break;
        case "mål":
          l?.fanfare();
          break;
      }
    };

    const project = (
      xRel: number,
      h: number,
      z: number,
      px: number,
      alt: number,
      dist: number,
    ) => {
      const zc = z - dist;
      const s = FOCAL / zc;
      const offset = curveAt(z) - curveAt(dist);
      const x = W / 2 + ((xRel - px) * HALF + offset * zc) * s;
      const y = HOR + (alt - h) * s;
      return { x, y, s, zc };
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const sim = simRef.current;
      if (!sim) return;
      const e = etappeRef.current;
      if (paletteFor !== e) {
        palette = groundPalette(e);
        ridge = ridgeSprite(e);
        paletteFor = e;
      }
      const t = now / 1000;
      const spiller = faseRef.current === "spiller";

      if (spiller) {
        const k = held.current;
        const inn: Styring = {
          steer: Math.max(
            -1,
            Math.min(1, (k.R ? 1 : 0) - (k.L ? 1 : 0) + touch.current.steer),
          ),
          climb: Math.max(
            -1,
            Math.min(1, (k.U ? 1 : 0) - (k.D ? 1 : 0) + touch.current.climb),
          ),
          sprang: k.S || sprang.current,
        };
        sprang.current = false;
        const før = sim.s.poeng;
        for (const h of sim.step(dt, inn)) hendelse(h, sim);
        if (sim.s.poeng > før) say(`+${sim.s.poeng - før}`);
        lyd.current?.setVind(sim.s.fart / e.fart, sim.s.vind);
        if (sim.s.ferdig || sim.s.tapt) {
          const b = sim.s.ferdig
            ? bjeller(sim.s.varder, sim.s.varderTotalt, sim.s.krasj)
            : 0;
          const saved = GameEngine.recordSledeResultat(e.id, sim.s.poeng, b);
          setResultat({ poeng: sim.s.poeng, bjeller: b, beste: saved.poeng });
          setBeste(GameEngine.getSledeResultater());
          setFase(sim.s.ferdig ? "slutt" : "tapt");
        }
      } else if (faseRef.current === "start") {
        // Attract mode: drift slowly over the course behind the start panel.
        sim.s.dist += 160 * dt * motion;
        sim.s.px = Math.sin(t * 0.3) * 0.4;
        sim.s.bank = Math.cos(t * 0.3) * 0.12;
        while (
          sim.s.first < sim.s.ting.length &&
          sim.s.ting[sim.s.first].z <= sim.s.dist
        )
          sim.s.first++;
      }

      const { px, alt, bank, dist } = sim.s;
      const drawDist = e.tåke ? 1500 : 2600;
      shake = Math.max(0, shake - dt);
      flash = Math.max(0, flash - dt);
      nyser = Math.max(0, nyser - dt);
      streaks = Math.max(0, streaks - dt);
      sprangGlow = Math.max(0, sprangGlow - dt);

      ctx.save();
      if (shake > 0)
        ctx.translate(
          (Math.random() - 0.5) * 8 * shake,
          (Math.random() - 0.5) * 8 * shake,
        );

      // Sky: painted horizon with parallax, or the ridge fallback.
      const par = -px * 40 - bank * 30;
      const img = bilde.current;
      if (img) {
        const sh = img.naturalHeight * e.horisont.linje;
        const dw = W * 1.3;
        const dh = (sh / img.naturalWidth) * dw;
        const dy = HOR - dh + (alt - 120) * 0.05;
        ctx.drawImage(
          img,
          0,
          0,
          img.naturalWidth,
          sh,
          -W * 0.15 + par,
          dy,
          dw,
          dh,
        );
        if (dy > 0) {
          ctx.fillStyle = e.himmel[0];
          ctx.fillRect(0, 0, W, dy + 1);
        }
      } else {
        ctx.drawImage(ridge, -W * 0.5 + par, 0);
      }

      // Northern lights: one band sliced into columns that ride a slow sine.
      if (e.nordlys > 0) {
        ctx.globalAlpha = 0.35 * e.nordlys;
        for (let b = 0; b < (e.nordlys > 0.5 ? 2 : 1); b++) {
          const y0 = 10 + b * 34 + Math.sin(t * 0.5 * motion + b) * 8;
          for (let x = 0; x < W; x += 32) {
            const y = y0 + Math.sin(x / 90 + t * 1.1 * motion + b * 2) * 14;
            ctx.drawImage(AURORA, x + 32, 0, 32, 80, x, y, 32, 80 - b * 20);
          }
        }
        ctx.globalAlpha = 1;
      }

      // Twinkle a few stars over the painting.
      ctx.fillStyle = "#e6ecff";
      for (let i = 0; i < 24; i++) {
        if ((i + Math.floor(t * 3)) % 5 === 0) continue;
        ctx.fillRect(
          (((i * 97 + par) % W) + W) % W,
          (i * 53) % (HOR - 50),
          2,
          2,
        );
      }

      // Ground: one strip per scanline, colour from a precomputed fade palette.
      const trackHalf = HALF * 0.5;
      for (let y = HOR; y < H; y++) {
        const zc = (alt * FOCAL) / (y - HOR);
        const z = dist + zc;
        const band = Math.floor(z / 150) % 2 === 0 ? 0 : 1;
        const f = Math.min(
          FADE_STEPS - 1,
          Math.floor((zc / drawDist) * (FADE_STEPS - 1)),
        );
        ctx.fillStyle = palette[band][f];
        ctx.fillRect(0, y, W, 1);
        if (zc > drawDist) continue;
        const s = FOCAL / zc;
        const cx = W / 2 + (-px * HALF + (curveAt(z) - curveAt(dist)) * zc) * s;
        const w = Math.max(1, s * 26);
        ctx.fillStyle = "rgba(70,100,160,0.45)";
        ctx.fillRect(cx - trackHalf * s - w / 2, y, w, 1);
        ctx.fillRect(cx + trackHalf * s - w / 2, y, w, 1);
        // Sastrugi: sparse wind ripples give the snow texture.
        if ((Math.floor(z / 60) * 7919) % 7 === 0 && y % 2 === 0) {
          ctx.fillStyle = "rgba(90,120,180,0.25)";
          ctx.fillRect(
            cx + (((Math.floor(z / 60) * 104729) % 600) - 300) * s,
            y,
            40 * s,
            1,
          );
        }
      }

      // Things, far to near.
      const ting = sim.s.ting;
      let end = sim.s.first;
      while (end < ting.length && ting[end].z < dist + drawDist) end++;
      // Long things (the cave) stay visible after their start has passed.
      let lo = sim.s.first;
      while (lo > 0 && ting[lo - 1].z > dist - GROTTE_MAX) lo--;
      for (let i = end - 1; i >= lo; i--) {
        const o = ting[i];
        if (o.z <= dist + 20 && o.type !== "grotte" && o.type !== "vind")
          continue;
        if (o.type === "vind") continue;
        const p = project(o.x, 0, o.z, px, alt, dist);
        const fade = Math.min(1, p.zc / drawDist);
        ctx.globalAlpha = Math.max(0, 1 - fade * fade);
        drawTing(
          ctx,
          o,
          p,
          t,
          fade,
          px,
          alt,
          dist,
          project,
          GLOW_ORANGE,
          GLOW_GOLD,
          GLOW_GREEN,
          STAR,
        );
        ctx.globalAlpha = 1;
      }

      // Finish arch.
      if (e.lengde - dist < drawDist && e.lengde > dist) {
        const p = project(0, 0, e.lengde, px, alt, dist);
        const r = Math.max(4, 160 * p.s);
        ctx.globalAlpha = Math.max(0.2, 1 - p.zc / drawDist);
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = Math.max(1, 10 * p.s);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, Math.PI, 0);
        ctx.stroke();
        ctx.drawImage(GLOW_GOLD, p.x - r, p.y - r * 1.5, r * 2, r * 2);
        ctx.globalAlpha = 1;
      }

      // Gust: sideways snow streaks while inside a wind zone.
      if (Math.abs(sim.s.vind) > 0.2) {
        ctx.fillStyle = `rgba(255,255,255,${0.35 * Math.abs(sim.s.vind)})`;
        for (let i = 0; i < 26; i++) {
          const sx =
            (((i * 211 + t * 900 * Math.sign(sim.s.vind)) % W) + W) % W;
          const sy = (i * 97) % H;
          ctx.fillRect(sx, sy, 40, 1);
        }
      }

      // Speed streaks during a sprang.
      if (streaks > 0 && !reduceMotion.current) {
        ctx.strokeStyle = `rgba(255,255,255,${0.25 * Math.min(1, streaks)})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2 + t * 2;
          const r0 = 120 + ((i * 53 + t * 700) % 140);
          ctx.beginPath();
          ctx.moveTo(W / 2 + Math.cos(a) * r0, H * 0.55 + Math.sin(a) * r0);
          ctx.lineTo(
            W / 2 + Math.cos(a) * (r0 + 60),
            H * 0.55 + Math.sin(a) * (r0 + 60),
          );
          ctx.stroke();
        }
      }

      drawTeam(
        ctx,
        t,
        bank,
        nyser,
        sprangGlow,
        sim.s.fart / e.fart,
        GLOW_RED,
        motion,
      );

      // Snowfall; the gust leans it sideways.
      const n = Math.min(
        flakes.length,
        Math.round(e.snøfall * (reduceMotion.current ? 0.5 : 1)),
      );
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      const lean = sim.s.vind * 220 - px * 30;
      for (let i = 0; i < n; i++) {
        const f = flakes[i];
        f.y += (f.v + sim.s.fart * 0.1) * dt * motion;
        f.x += lean * dt + Math.sin(t + i) * 10 * dt;
        if (f.y > H) f.y -= H;
        if (f.x > W) f.x -= W;
        if (f.x < 0) f.x += W;
        ctx.fillRect(f.x, f.y, f.s, f.s);
      }

      // Windshield: frost at the edges (thick in the fog), snow splats after a crash, gold flash.
      ctx.globalAlpha = e.tåke ? 0.75 : 0.22;
      ctx.drawImage(FROST, 0, 0);
      ctx.globalAlpha = 1;
      for (let i = splats.length - 1; i >= 0; i--) {
        const sp = splats[i];
        sp.t += dt;
        if (sp.t > 1.6) {
          splats.splice(i, 1);
          continue;
        }
        // Soft snow blobs that slide down the glass and melt away.
        const a = 1 - sp.t / 1.6;
        const r = sp.r * (1 + sp.t * 0.3);
        const y = sp.y + sp.t * 30;
        ctx.globalAlpha = 0.5 * a;
        ctx.drawImage(
          GLOW_WHITE,
          sp.x - r * 1.6,
          y - r * 1.6,
          r * 3.2,
          r * 3.2,
        );
        ctx.globalAlpha = 0.85 * a;
        ctx.fillStyle = "#f3f8ff";
        ctx.beginPath();
        ctx.arc(sp.x, y, r * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (flash > 0 && !reduceMotion.current) {
        ctx.fillStyle = `rgba(255,215,0,${flash * 0.35})`;
        ctx.fillRect(0, 0, W, H);
      }

      // Floating feedback text.
      ctx.textAlign = "center";
      ctx.font = `22px ${font}`;
      for (let i = texts.length - 1; i >= 0; i--) {
        const tx = texts[i];
        tx.t += dt;
        if (tx.t > 1.2) {
          texts.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = 1 - tx.t / 1.2;
        ctx.fillStyle = tx.c;
        ctx.fillText(tx.s, tx.x, tx.y - tx.t * 40);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      if (spiller && now - hudAt > 100) {
        hudAt = now;
        setHud({
          alt: sim.s.alt,
          fart: sim.s.fart,
          poeng: sim.s.poeng,
          varder: sim.s.varder,
          varderTotalt: sim.s.varderTotalt,
          liv: sim.s.liv,
          kraft: sim.s.kraft,
          sprang: sim.s.tid < sim.s.sprangTil,
          mult: rekkeMult(sim.s.rekke),
          vind: sim.s.vind,
          framdrift: Math.min(1, sim.s.dist / e.lengde),
          nyser: nyser > 0,
        });
      }
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      lyd.current?.stop();
    };
    // Sprites and loop are built once; stage changes are read through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = KEYS[e.key];
      if (k) {
        held.current[k] = true;
        if (k === "S") sprang.current = true;
        // Only while flying: on the panels space and arrows still work the buttons.
        if (faseRef.current === "spiller") e.preventDefault();
      }
      if (e.key === "Escape" || e.key === "p") {
        if (faseRef.current === "spiller") setFase("pause");
        else if (faseRef.current === "pause") setFase("spiller");
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = KEYS[e.key];
      if (k) held.current[k] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Touch: left half slides the course, right half the altitude; several fingers at once.
  const pointers = useRef(new Map<number, "kurs" | "høyde">());
  const onPointer = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const el = ev.currentTarget;
    const r = el.getBoundingClientRect();
    const nx = (ev.clientX - r.left) / r.width;
    const ny = (ev.clientY - r.top) / r.height;
    if (ev.type === "pointerdown") {
      el.setPointerCapture(ev.pointerId);
      pointers.current.set(ev.pointerId, nx < 0.5 ? "kurs" : "høyde");
      if (ev.pointerType !== "mouse") setTouchHint(true);
    }
    const zone = pointers.current.get(ev.pointerId);
    if (!zone) return;
    if (ev.type === "pointerup" || ev.type === "pointercancel") {
      pointers.current.delete(ev.pointerId);
      // Another finger may still hold this zone; it sets the value on its next move.
      if ([...pointers.current.values()].includes(zone)) return;
      if (zone === "kurs") touch.current.steer = 0;
      else touch.current.climb = 0;
      return;
    }
    const dead = (v: number) =>
      Math.abs(v) < 0.12 ? 0 : Math.max(-1, Math.min(1, v));
    if (zone === "kurs") touch.current.steer = dead((nx - 0.25) / 0.18);
    else touch.current.climb = dead((0.5 - ny) / 0.28);
  };

  const velg = (e: SledeEtappe) => {
    SoundManager.playSound("click");
    setEtappe(e);
  };

  const b = hud;
  const altPct = b ? (b.alt - ALT_MIN) / (ALT_MAX - ALT_MIN) : 0.4;
  const knop = b ? Math.round(b.fart / 12) : 0;
  const panel =
    "border-2 border-(--brass) bg-black/70 text-(--neon-green) px-2 py-1 text-lg leading-tight";
  const knapp =
    "min-h-11 min-w-11 px-3 border-2 text-lg font-bold cursor-pointer";

  return (
    <div className="relative flex-1 min-h-0 bg-black select-none touch-none overflow-hidden font-retro">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="block w-full h-full object-cover font-retro"
        style={{ imageRendering: "pixelated" }}
      />
      {/* Touch zones: whole canvas, invisible; hints in the corners once touched. */}
      <div
        className="absolute inset-0"
        onPointerDown={onPointer}
        onPointerMove={onPointer}
        onPointerUp={onPointer}
        onPointerCancel={onPointer}
        onContextMenu={(e) => e.preventDefault()}
        aria-hidden="true"
      />
      {touchHint && fase === "spiller" && (
        <>
          <div className="absolute bottom-2 left-3 text-(--neon-green)/40 text-base pointer-events-none">
            ← → KURS
          </div>
          <div className="absolute bottom-2 right-3 text-(--neon-green)/40 text-base pointer-events-none">
            ▲ ▼ HØYDE
          </div>
        </>
      )}

      {/* IQ's panel */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1 left-1 ${panel}`}>
          <div className="text-(--gold) uppercase">{etappe.navn}</div>
          <div>
            VARDER {b?.varder ?? 0}/{b?.varderTotalt ?? 0}
          </div>
        </div>
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1/3">
          <div className="h-2 border border-(--brass) bg-black/60">
            <div
              className="h-full bg-(--gold)"
              style={{ width: `${(b?.framdrift ?? 0) * 100}%` }}
            />
          </div>
          {Math.abs(b?.vind ?? 0) > 0.3 && (
            <div className="text-center text-(--cold-blue) text-base animate-pulse">
              KASTEVIND {(b?.vind ?? 0) < 0 ? "←←" : "→→"}
            </div>
          )}
        </div>
        <div className={`absolute top-1 right-14 ${panel} text-right`}>
          <div className="text-(--gold) tabular-nums text-2xl">
            {b?.poeng ?? 0}
            {(b?.mult ?? 1) > 1 && (
              <span className="ml-2 text-(--neon-green) text-xl">
                x{b?.mult}
              </span>
            )}
          </div>
          {!assist && (
            <div
              className="flex gap-1 justify-end"
              aria-label={`${b?.liv ?? 3} forsøk igjen`}
            >
              {[0, 1, 2].map((i) => (
                <Slede key={i} dim={(b?.liv ?? 3) <= i} />
              ))}
            </div>
          )}
        </div>
        {/* Altitude */}
        <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
          <div className="text-base text-(--neon-green)/80">HØYDE</div>
          <div className="relative w-4 h-28 border-2 border-(--brass) bg-black/60">
            <div
              className={`absolute bottom-0 inset-x-0 ${altPct < 0.15 ? "bg-(--christmas-red)" : altPct < 0.35 ? "bg-(--gold)" : "bg-(--neon-green)"}`}
              style={{ height: `${altPct * 100}%` }}
            />
          </div>
          <div className="text-base tabular-nums text-(--neon-green)/80">
            {b ? Math.round(b.alt / 10) : 12} FV
          </div>
        </div>
        {/* Speed and reindeer */}
        <div
          className={`absolute right-1 top-1/2 -translate-y-1/2 ${panel} text-right`}
        >
          <div className="tabular-nums">{knop} KNOP</div>
          <div
            className={
              b?.nyser
                ? "text-(--christmas-red)"
                : b?.sprang
                  ? "text-(--gold)"
                  : ""
            }
          >
            RUDOLF: {b?.nyser ? "NYSER" : b?.sprang ? "GLØDER" : "I FORM"}
          </div>
        </div>
      </div>

      {/* Sprang button and pause: real targets */}
      {fase === "spiller" && (
        <>
          <button
            type="button"
            aria-label="Sprang"
            className={`absolute bottom-3 right-3 w-14 h-14 rounded-full border-4 text-base font-bold cursor-pointer ${
              (b?.kraft ?? 0) >= 1
                ? "border-(--gold) bg-(--gold) text-black animate-pulse"
                : "border-(--brass) bg-black/60 text-(--neon-green)/70"
            }`}
            style={{
              backgroundImage:
                (b?.kraft ?? 0) < 1
                  ? `conic-gradient(var(--brass) ${(b?.kraft ?? 0) * 360}deg, transparent 0)`
                  : undefined,
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              sprang.current = true;
            }}
            onClick={() => (sprang.current = true)}
          >
            SPRANG
          </button>
          <button
            type="button"
            aria-label="Pause"
            className={`absolute top-1 right-1 ${knapp} border-(--brass) bg-black/70 text-(--neon-green)`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setFase("pause")}
          >
            II
          </button>
        </>
      )}

      {fase !== "spiller" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 p-2 overflow-y-auto">
          <div className="border-2 border-(--brass) bg-black/85 p-3 max-w-md w-full max-h-full overflow-y-auto text-(--neon-green) space-y-2 text-center">
            {fase === "start" && (
              <>
                <div className="text-(--gold) text-2xl">IQs SLEDESIMULATOR</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {åpne.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => velg(e)}
                      className={`${knapp} ${e.id === etappe.id ? "border-(--gold) bg-(--gold) text-black" : "border-(--neon-green)/50"}`}
                    >
                      {e.navn} {bjelletegn(beste[e.id]?.bjeller ?? 0)}
                    </button>
                  ))}
                </div>
                <div className="text-lg">«{etappe.intro}»</div>
                <button
                  type="button"
                  onClick={() => {
                    SoundManager.playSound("click");
                    setAssist((a) => !a);
                  }}
                  className={`${knapp} ${assist ? "border-(--cold-blue) text-(--cold-blue)" : "border-(--christmas-red) text-(--christmas-red)"}`}
                >
                  IQ-ASSISTENT: {assist ? "PÅ" : "AV"}
                </button>
                <div className="text-base opacity-70">
                  {assist
                    ? "Sleden holder høyden selv og krasjer aldri. Styr gjennom vardene!"
                    : "Tre forsøk, kastevind og stjerner. Jakt på tre bjeller!"}
                </div>
                <button
                  type="button"
                  onClick={start}
                  className={`${knapp} border-(--gold) text-(--gold) w-full`}
                >
                  START
                </button>
                <div className="text-base opacity-60">
                  PILTASTER / WASD · MELLOMROM = SPRANG · ESC = PAUSE
                </div>
              </>
            )}
            {fase === "pause" && (
              <>
                <div className="text-(--gold) text-2xl">PAUSE</div>
                <button
                  type="button"
                  onClick={() => setFase("spiller")}
                  className={`${knapp} border-(--gold) text-(--gold) w-full`}
                >
                  FORTSETT
                </button>
                <button
                  type="button"
                  onClick={() => setFase("start")}
                  className={`${knapp} border-(--neon-green)/50 w-full`}
                >
                  AVBRYT
                </button>
              </>
            )}
            {(fase === "slutt" || fase === "tapt") && (
              <>
                <div className="text-(--gold) text-2xl">
                  {fase === "slutt"
                    ? "GODKJENT AV IQ!"
                    : "IQ KOBLER INN NØDBREMSEN"}
                </div>
                {fase === "slutt" && (
                  <div className="text-3xl text-(--gold)">
                    {bjelletegn(resultat.bjeller)}
                  </div>
                )}
                <div className="text-xl tabular-nums">
                  POENG {resultat.poeng} · BESTE {resultat.beste}
                </div>
                <div className="text-base opacity-70">
                  {fase === "slutt"
                    ? etappe.id === "julenatt"
                      ? "Ruten er klar. God jul fra IQ og Rudolf!"
                      : "Ruten er logget i IQs notatbok."
                    : "Rudolf trenger en gulrot og et nytt forsøk."}
                </div>
                <button
                  type="button"
                  onClick={start}
                  className={`${knapp} border-(--gold) text-(--gold) w-full`}
                >
                  IGJEN
                </button>
                <button
                  type="button"
                  onClick={() => setFase("start")}
                  className={`${knapp} border-(--neon-green)/50 w-full`}
                >
                  VELG ETAPPE
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const bjelletegn = (n: number) => "●".repeat(n) + "○".repeat(3 - n);

/** A small brass sleigh for the repair quota. */
function Slede({ dim }: { dim: boolean }) {
  return (
    <svg
      viewBox="0 0 24 14"
      className={`w-6 h-4 ${dim ? "opacity-25" : ""}`}
      aria-hidden="true"
    >
      <path d="M3 9 Q2 3 8 3 H19 L17 9 Z" fill="var(--brass)" />
      <path
        d="M1 12 Q1 9 4 9 H20 Q23 9 23 12"
        fill="none"
        stroke="var(--brass)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

type Project = (
  xRel: number,
  h: number,
  z: number,
  px: number,
  alt: number,
  dist: number,
) => { x: number; y: number; s: number; zc: number };

function drawTing(
  ctx: CanvasRenderingContext2D,
  o: Ting,
  p: { x: number; y: number; s: number; zc: number },
  t: number,
  fade: number,
  px: number,
  alt: number,
  dist: number,
  project: Project,
  GLOW_ORANGE: HTMLCanvasElement,
  GLOW_GOLD: HTMLCanvasElement,
  GLOW_GREEN: HTMLCanvasElement,
  STAR: HTMLCanvasElement,
) {
  const s = p.s;
  switch (o.type) {
    case "tre": {
      const h = 160 * s;
      const w = 60 * s;
      ctx.fillStyle = "#3a2a1a";
      ctx.fillRect(p.x - 4 * s, p.y - 20 * s, 8 * s, 20 * s);
      for (let k = 0; k < 3; k++) {
        const ty = p.y - 20 * s - k * h * 0.27;
        const tw = w * (1 - k * 0.25);
        const th = h * 0.42;
        ctx.fillStyle = "#0e2a26";
        ctx.beginPath();
        ctx.moveTo(p.x, ty - th);
        ctx.lineTo(p.x - tw, ty);
        ctx.lineTo(p.x + tw, ty);
        ctx.fill();
        ctx.fillStyle = "#dbe8ff";
        ctx.beginPath();
        ctx.moveTo(p.x, ty - th);
        ctx.lineTo(p.x - tw * 0.45, ty - th * 0.5);
        ctx.lineTo(p.x + tw * 0.45, ty - th * 0.5);
        ctx.fill();
      }
      break;
    }
    case "topp": {
      const h = 230 * s;
      const w = 200 * s;
      ctx.fillStyle = "#1c2238";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - h);
      ctx.lineTo(p.x - w, p.y + 4);
      ctx.lineTo(p.x + w, p.y + 4);
      ctx.fill();
      ctx.fillStyle = "#e8f0ff";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - h);
      ctx.lineTo(p.x - w * 0.3, p.y - h * 0.62);
      ctx.lineTo(p.x - w * 0.1, p.y - h * 0.7);
      ctx.lineTo(p.x + w * 0.12, p.y - h * 0.6);
      ctx.lineTo(p.x + w * 0.3, p.y - h * 0.62);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = Math.max(1, 2 * s);
      ctx.beginPath();
      ctx.moveTo(p.x + w * 0.05, p.y - h * 0.6);
      ctx.lineTo(p.x + w * 0.45, p.y);
      ctx.stroke();
      break;
    }
    case "varde": {
      const h = 90 * s;
      // Stone cairn: three stacked stones with snow on top, flame above.
      for (let k = 0; k < 3; k++) {
        const sw = (34 - k * 8) * s;
        const sh = h * 0.3;
        ctx.fillStyle = k % 2 ? "#4a4a56" : "#3a3a44";
        ctx.fillRect(p.x - sw / 2, p.y - sh * (k + 1), sw, sh);
        ctx.fillStyle = "rgba(230,240,255,0.8)";
        ctx.fillRect(p.x - sw / 2, p.y - sh * (k + 1), sw, Math.max(1, 2 * s));
      }
      const pulse = o.treff ? 1 : 0.6 + Math.sin(t * 6 + o.z) * 0.3;
      const r = Math.max(3, (o.treff ? 70 : 48) * s);
      ctx.drawImage(
        o.treff ? GLOW_GOLD : GLOW_ORANGE,
        p.x - r,
        p.y - h - r,
        r * 2,
        r * 2,
      );
      ctx.fillStyle = o.treff
        ? "#fff2b0"
        : `rgba(255,${160 + pulse * 60},60,1)`;
      const fl = 14 * s * (0.8 + pulse * 0.3);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - h - fl * 1.6);
      ctx.quadraticCurveTo(
        p.x + fl * 0.6,
        p.y - h - fl * 0.4,
        p.x,
        p.y - h + 2 * s,
      );
      ctx.quadraticCurveTo(
        p.x - fl * 0.6,
        p.y - h - fl * 0.4,
        p.x,
        p.y - h - fl * 1.6,
      );
      ctx.fill();
      // Target ring: the altitude window the sleigh must pass through.
      if (!o.ferdig && fade < 0.5) {
        ctx.strokeStyle = `rgba(255,200,80,${0.5 * (1 - fade * 2)})`;
        ctx.lineWidth = Math.max(1, 3 * s);
        ctx.beginPath();
        ctx.ellipse(
          p.x,
          p.y - 140 * s,
          180 * s * 0.4,
          90 * s,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
      break;
    }
    case "stjerne": {
      if (o.treff) break;
      const q = project(o.x, o.h, o.z, px, alt, dist);
      const r = Math.max(3, 30 * s) * (0.9 + Math.sin(t * 5 + o.z) * 0.15);
      ctx.drawImage(STAR, q.x - r, q.y - r, r * 2, r * 2);
      break;
    }
    case "band": {
      const q = project(o.x, 200, o.z, px, alt, dist);
      const rx = 270 * s;
      const ry = 60 * s;
      ctx.strokeStyle = `rgba(0,255,138,${o.treff ? 0.2 : 0.55 + Math.sin(t * 4) * 0.2})`;
      ctx.lineWidth = Math.max(1, 14 * s);
      ctx.beginPath();
      ctx.ellipse(q.x, q.y, rx, ry, 0, Math.PI, 0);
      ctx.stroke();
      const r = Math.max(4, 120 * s);
      ctx.drawImage(GLOW_GREEN, q.x - r, q.y - r, r * 2, r * 2);
      break;
    }
    case "mur": {
      const h = o.h * s;
      const gw = 0.35;
      const l = project(-1.9, 0, o.z, px, alt, dist).x;
      const r = project(1.9, 0, o.z, px, alt, dist).x;
      const g0 = project((o.port ?? 0) - gw, 0, o.z, px, alt, dist).x;
      const g1 = project((o.port ?? 0) + gw, 0, o.z, px, alt, dist).x;
      ctx.fillStyle = "#1a1d26";
      ctx.fillRect(l, p.y - h, g0 - l, h);
      ctx.fillRect(g1, p.y - h, r - g1, h);
      ctx.fillStyle = "rgba(220,230,245,0.5)";
      ctx.fillRect(l, p.y - h, g0 - l, Math.max(1, 3 * s));
      ctx.fillRect(g1, p.y - h, r - g1, Math.max(1, 3 * s));
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      for (let k = 1; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(l, p.y - (h * k) / 4);
        ctx.lineTo(r, p.y - (h * k) / 4);
        ctx.stroke();
      }
      // The open gate glows warm through the fog, visible long before the wall.
      ctx.globalAlpha = 1;
      const gr = Math.max(6, 220 * s);
      const gx = (g0 + g1) / 2;
      ctx.drawImage(GLOW_GOLD, gx - gr, p.y - h * 0.6 - gr, gr * 2, gr * 2);
      ctx.fillStyle = `rgba(255,220,140,${o.treff ? 0.9 : 0.75})`;
      ctx.fillRect(g0, p.y - h, g1 - g0, h);
      ctx.fillStyle = "rgba(255,200,100,0.35)";
      ctx.beginPath();
      ctx.moveTo(g0, p.y);
      ctx.lineTo(g1, p.y);
      ctx.lineTo(g1 + (g1 - g0) * 1.5, p.y + h * 0.8);
      ctx.lineTo(g0 - (g1 - g0) * 1.5, p.y + h * 0.8);
      ctx.fill();
      break;
    }
    case "grotte": {
      // A golden crack in the ground between z and z + lengde.
      const z1 = Math.max(o.z, dist + 40);
      const z2 = o.z + (o.lengde ?? 0);
      if (z2 <= z1) break;
      const a = project(o.x - 0.6, 0, z1, px, alt, dist);
      const b2 = project(o.x + 0.6, 0, z1, px, alt, dist);
      const c = project(o.x + 0.25, 0, z2, px, alt, dist);
      const d = project(o.x - 0.25, 0, z2, px, alt, dist);
      ctx.fillStyle = o.treff
        ? "rgba(255,235,170,0.7)"
        : "rgba(255,190,80,0.45)";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b2.x, b2.y);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(d.x, d.y);
      ctx.fill();
      const m = project(o.x, 0, (z1 + z2) / 2, px, alt, dist);
      const r = Math.max(10, 420 * m.s);
      ctx.drawImage(GLOW_GOLD, m.x - r, m.y - r, r * 2, r * 2);
      break;
    }
  }
}

/** Three reindeer with harness and reins, trotting, banking with the turn; Rudolf leads. */
function drawTeam(
  ctx: CanvasRenderingContext2D,
  t: number,
  bank: number,
  nyser: number,
  sprang: number,
  fart: number,
  GLOW_RED: HTMLCanvasElement,
  motion: number,
) {
  ctx.save();
  ctx.translate(W / 2, H * 0.8);
  ctx.rotate(bank * 0.45);
  const tempo = (7 + fart * 4) * motion;
  const trot = Math.sin(t * tempo);
  const pos = [
    [-62, 6, 0.95],
    [0, -10, 1],
    [62, 6, 0.95],
  ] as const;
  // Sleigh front: dark red bow with a brass rail and a small lantern each side.
  ctx.fillStyle = "#5a1414";
  ctx.beginPath();
  ctx.moveTo(-120, 92);
  ctx.quadraticCurveTo(-125, 58, -95, 56);
  ctx.lineTo(95, 56);
  ctx.quadraticCurveTo(125, 58, 120, 92);
  ctx.fill();
  ctx.fillStyle = "#c9a227";
  ctx.fillRect(-96, 55, 192, 3);
  ctx.fillStyle = "#8a6a3a";
  ctx.fillRect(-40, 66, 80, 10);
  // Reins from the dashboard to each harness.
  ctx.strokeStyle = "#6b4a24";
  ctx.lineWidth = 1.5;
  for (const [dx] of pos) {
    ctx.beginPath();
    ctx.moveTo(dx * 0.25, 64);
    ctx.quadraticCurveTo(
      dx * 0.6,
      44 + trot * 2 + Math.sin(t * 13 + dx) * 1.5,
      dx,
      12,
    );
    ctx.stroke();
  }
  pos.forEach(([dx, dy, sc], i) => {
    const bob = Math.sin(t * tempo + i * 2.1) * 3;
    const shake = nyser > 0 ? Math.sin(t * 40) * 3 * nyser : 0;
    drawReindeer(
      ctx,
      dx + shake,
      dy + bob,
      sc,
      i === 1 ? trot : -trot,
      i === 1,
      t,
      sprang,
      GLOW_RED,
    );
  });
  // Lanterns on the bow.
  for (const sx of [-108, 108]) {
    ctx.drawImage(GLOW_RED, sx - 10, 52, 20, 20);
    ctx.fillStyle = "#ffd27a";
    ctx.fillRect(sx - 2, 60, 4, 5);
  }
  ctx.restore();
}

function drawReindeer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  trot: number,
  lead: boolean,
  t: number,
  sprang: number,
  GLOW_RED: HTMLCanvasElement,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const fur = "#3b2616";
  const dark = "#24160c";
  ctx.lineCap = "round";
  // Legs, seen from behind: two pairs in opposite phase.
  ctx.strokeStyle = dark;
  ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const phase = i < 2 ? trot : -trot;
    ctx.beginPath();
    ctx.moveTo(side * 9, 6);
    ctx.lineTo(side * 11 + phase * 4, 24 + Math.abs(phase) * 3);
    ctx.lineTo(side * 11 + phase * 7, 32);
    ctx.stroke();
  }
  // Body, tail, neck, head.
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(0, 2, 17, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e9dcc8";
  ctx.beginPath();
  ctx.ellipse(0, 8, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.quadraticCurveTo(-7, -22, -4, -24);
  ctx.lineTo(4, -24);
  ctx.quadraticCurveTo(7, -22, 6, -4);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -27, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Ears and antlers.
  ctx.beginPath();
  ctx.ellipse(-8, -30, 3, 2, -0.5, 0, Math.PI * 2);
  ctx.ellipse(8, -30, 3, 2, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8a6a3a";
  ctx.lineWidth = 2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 4, -33);
    ctx.lineTo(s * 9, -43);
    ctx.lineTo(s * 15, -41);
    ctx.moveTo(s * 7, -39);
    ctx.lineTo(s * 4, -46);
    ctx.moveTo(s * 11, -42);
    ctx.lineTo(s * 12, -48);
    ctx.stroke();
  }
  // Harness: red breast band with brass bells, and the back strap.
  ctx.strokeStyle = "#a8282a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.quadraticCurveTo(0, 8, 16, 0);
  ctx.stroke();
  ctx.fillStyle = "#e0b64a";
  for (const bx of [-9, -3, 3, 9]) {
    ctx.beginPath();
    ctx.arc(
      bx,
      5 + Math.abs(bx) * -0.2 + Math.sin(t * 12 + bx) * 0.6,
      1.4,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  // Rudolf's nose glows, stronger during a sprang.
  if (lead) {
    const r = 10 + Math.sin(t * 5) * 2 + sprang * 6;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(GLOW_RED, -r, -27 - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ff5a4a";
    ctx.beginPath();
    ctx.arc(0, -29, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
