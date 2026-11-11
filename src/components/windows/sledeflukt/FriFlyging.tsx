"use client";

import { useEffect, useRef, useState } from "react";
import { GameEngine } from "@/lib/game-engine";
import { SoundManager } from "@/lib/sounds";
import {
  ALT_MAX,
  landingTekst,
  pakkenavn,
  radiolinje,
  type Styring,
} from "../snofall-tv/slede";
import {
  ALT_MIN,
  BERGEN_KURS,
  BERGEN_SLUTT,
  fraKorridor,
  createFri,
  FJELL,
  forutsiFri,
  FUGL_TILBAKE,
  FUGLER,
  fuglPos,
  GRENSE,
  høyde,
  MUR,
  murPunkt,
  nærmesteSted,
  peiling,
  PORT_BREDDE,
  STEDER,
  stedÅpent,
  stedsnavn,
  TUN,
  vinkelTil,
  type FriHendelse,
  type FriOpts,
  type FriSim,
} from "../snofall-tv/vidda";
import { SledeLyd } from "../snofall-tv/slede-lyd";
import {
  bak,
  hex,
  identity,
  multiply,
  transform,
  type Vec3,
} from "./gl";
import {
  GRENSE_MS,
  OPPLØSNINGER,
  Renderer,
  TRINN,
  type Oppløsning,
} from "./renderer";
import { RadioBoks } from "./RadioBoks";
import { useKontroller } from "./kontroller";
import { PYNTETRÆR, snofallMesh } from "./snofall";
import {
  BEIN,
  fjernMesh,
  gardinMesh,
  grotteMesh,
  husPlassFri,
  lagRute,
  meshes,
  murGlødMesh,
  murMesh,
  REIN,
  REIN_SKALA,
  mannskap,
  RUTE,
  SKALA,
  SPOR,
  tilVidda,
  pipeRøyk,
  RØYK_FADE,
  RØYK_MAKS,
  SKY_FADE,
  skyRøyk,
} from "./verden";

/**
 * FRI FLYGING: the open vidda around Snøfall. The pure sim in snofall-tv/vidda.ts
 * flies by heading; this file draws square terrain tiles around the sled, a coarse
 * horizon beyond them, the curtain at the edge, places with their locks, birds,
 * chimneys, and keeps the compass, the map and IQ's panel.
 */

type Fase = "spiller" | "pause";
/** Near draw distance in render units; the horizon mesh takes over beyond it. */
const RULL = 0.8;
const FJERN = 600;
const FJERN_SIM = FJERN / SKALA;
const HORISONT = 4200;

const IDENT = identity();
const RØYK = new Float32Array(RØYK_MAKS * 4);
const SKY = new Float32Array(RØYK_MAKS * 4);
const LYS: Vec3 = [0.35, 0.8, 0.5];
const HIMMEL = {
  topp: hex(0x070a1c),
  horisont: hex(0x1a2448),
  dis: hex(0x9fb0cc),
  nordlys: 0.4,
};

interface Hud {
  alt: number;
  skade: number;
  /** A hit just now: the screen edge flashes red. */
  treff: boolean;
  fart: number;
  poeng: number;
  pakker: number;
  fugler: number;
  neste: string;
  sted: string;
  funnet: number;
  åpne: number;
  gass: number;
}

interface Melding {
  tekst: string;
  farge: string;
  id: number;
}

interface Rute {
  mesh: Float32Array;
  trær: Float32Array;
  /** Inside a locked place: drawn stone grey. */
  grå: boolean;
}

const nøkkel = (ix: number, iz: number) => (ix + 2048) * 4096 + (iz + 2048);

export function FriFlyging({
  day,
  fps = false,
  oppløsning,
  onAvslutt,
  onTapt,
}: {
  day: number;
  fps?: boolean;
  oppløsning?: Oppløsning;
  onAvslutt: () => void;
  onTapt?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onTaptRef = useRef(onTapt);
  useEffect(() => {
    onTaptRef.current = onTapt;
  });
  const kartRef = useRef<HTMLCanvasElement>(null);
  const kompassRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<FriSim | null>(null);
  const faseRef = useRef<Fase>("spiller");
  const lyd = useRef<SledeLyd | null>(null);
  const [fase, setFaseState] = useState<Fase>("spiller");
  const [hud, setHud] = useState<Hud | null>(null);
  const [melding, setMelding] = useState<Melding | null>(null);
  const [pluss, setPluss] = useState<Melding | null>(null);
  const [radio, setRadio] = useState<Melding[]>([]);
  const [feil, setFeil] = useState<string | null>(null);
  const [stat, setStat] = useState({
    p50: 0,
    p95: 0,
    res: (oppløsning ?? 640) as Oppløsning,
  });
  // Bergen lies beyond the gate once day 24 is solved; its name is Landås only with day 22 solved.
  const opts = useRef<FriOpts>({ dag: day, bergen: false, landås: false });

  const setFase = (f: Fase) => {
    if (f !== "spiller") lyd.current?.stop();
    else lyd.current?.startVind();
    faseRef.current = f;
    setFaseState(f);
  };
  const {
    held: heldRef,
    touch: touchRef,
    slipp: slippRef,
    touchHint,
    onPointer,
    slippGass,
  } = useKontroller(
    () => faseRef.current === "spiller",
    (e) => {
      if (e.key === "Escape" || e.key === "p")
        setFase(faseRef.current === "spiller" ? "pause" : "spiller");
      else if (e.key === "Enter") setFase("spiller");
    },
    () => {
      if (faseRef.current === "spiller") setFase("pause");
    },
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let r: Renderer;
    try {
      r = new Renderer(canvas);
    } catch (err) {
      console.error("SLEDEFLUKT", err);
      const id = requestAnimationFrame(() =>
        setFeil("3D-visningen kunne ikke starte på denne enheten."),
      );
      return () => cancelAnimationFrame(id);
    }
    r.påTapt = () => onTaptRef.current?.();
    let res: Oppløsning = oppløsning ?? 640;
    r.setOppløsning(OPPLØSNINGER[res][0], OPPLØSNINGER[res][1]);
    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    const motion = reduceMotion ? 0.35 : 1;
    const løst = GameEngine.getCompletedDays();
    const o: FriOpts = {
      dag: day,
      bergen: løst.has(24),
      landås: løst.has(22),
      reduceMotion,
    };
    opts.current = o;
    const sim = createFri(o);
    simRef.current = sim;
    // Dev page only: screenshots can place the sled and the camera.
    const dev = fps
      ? (window as unknown as {
          friSim?: FriSim;
          friKamera?: { eye: Vec3; target: Vec3 };
        })
      : null;
    if (dev) dev.friSim = sim;
    const brev = GameEngine.getSantaLetters();
    lyd.current = new SledeLyd();
    lyd.current.startVind();
    const M = meshes();
    const fjern = fjernMesh();
    const gardin = gardinMesh(o.bergen);
    const grotte = grotteMesh(1600);
    const portMesh = murMesh(0);
    // Before day 21 Muren is a grey silhouette; from then the whole arc glows warm.
    const murGlød = stedÅpent(
      STEDER.find((s) => s.id === "muren")!,
      o,
    )
      ? murGlødMesh()
      : null;
    const snofall = snofallMesh();
    const BERGEN_PORT = fraKorridor(GRENSE, 0);
    const ruter = new Map<number, Rute>();
    // The houses never move: baked once into one mesh, one draw call.
    const husBakt = bak(
      sim.s.hus.map((h) => [M.hus[h.variant].mesh, husPlassFri(h)] as const),
    );
    const kart = kartRef.current?.getContext("2d") ?? null;
    const kompass = kompassRef.current?.getContext("2d") ?? null;
    const grotten = STEDER.find((s) => s.id === "grotten")!;
    const antenna = STEDER.find((s) => s.id === "antenne")!;
    const antennePos = tilVidda(antenna.x, 0, antenna.z);
    antennePos[1] = høyde(antenna.x, antenna.z) * SKALA - 0.2;
    const grottePos = tilVidda(grotten.x + 800, 0, grotten.z + 300);
    grottePos[1] = høyde(grotten.x, grotten.z + 300) * SKALA;
    const portPos = tilVidda(BERGEN_PORT[0], 0, BERGEN_PORT[1]);
    const murPos = tilVidda(MUR.x, 0, MUR.z);
    murPos[1] = høyde(MUR.x, MUR.z) * SKALA - 0.2;
    const åpne = STEDER.filter((s) => stedÅpent(s, o)).length;

    let last = 0;
    let hudAt = 0;
    let raf = 0;
    let shake = 0;
    let gange = 0;
    let id = 0;
    let eye: Vec3 | null = null;
    let hopp = 0;
    // Crew animations (verden.mannskap): seconds left.
    let vink = 0;
    let kast = 0;
    let dukk = 0;
    // Crash tumble: a full barrel roll of the sled over RULL seconds.
    let rull = 0;
    let radioTil = 0;
    let radioN = 0;
    const puff: { p: Vec3; t0: number }[] = [];
    const tider = new Float32Array(180);
    let nTid = 0;
    let målAt = 0;

    const say = (tekst: string, farge = "#ffd700") =>
      setMelding({ tekst, farge, id: ++id });
    const radioen = (linje: string | null, now: number) => {
      if (!linje || now < radioTil) return;
      radioN++;
      radioTil = now + 4;
      setRadio((k) =>
        [...k, { tekst: linje, farge: "#ffb347", id: ++id }].slice(-3),
      );
    };

    const hendelse = (h: FriHendelse) => {
      if (h === "krasj") dukk = 1;
      if (h === "slipp") kast = 0.6;
      if (h === "oppdaget") vink = 1.5;
      const l = lyd.current;
      const now = performance.now() / 1000;
      switch (h) {
        case "oppdaget": {
          l?.port();
          say(sim.s.sisteSted, "#00ff8a");
          const st = STEDER.find(
            (x) =>
              sim.s.oppdaget.has(x.id) && stedsnavn(x, o) === sim.s.sisteSted,
          );
          radioen(st?.radio ?? null, now - 6);
          return;
        }
        case "låst":
          l?.tikk(false);
          hopp = 0.5;
          say(`LÅST · ${sim.s.sisteSted}`, "#8aa0c0");
          break;
        case "snu":
          say("SNU! LYSGARDINEN ER ENDEN PÅ KARTET", "#8aa0c0");
          break;
        case "bergen":
          l?.fanfare();
          say(
            o.landås ? "VELKOMMEN TIL LANDÅS" : "VELKOMMEN TIL BERGEN",
            "#00ff8a",
          );
          break;
        case "fugl":
          l?.stjerne();
          hopp = 0.5;
          say("BREVFUGL FANGET  +80", "#c0d2ec");
          break;
        case "skrape":
          l?.krasj();
          hopp = 0.4;
          say("AU! SLEDEN TOK SKADE", "#f0624a");
          break;
        case "krasj":
          l?.krasj();
          hopp = 0.7;
          if (!reduceMotion) {
            shake = 0.45;
            rull = RULL;
          }
          say("KLONK! FJELLET STÅR STILLE", "#f0624a");
          break;
        case "grotte":
          l?.port();
          say("LYS NED I GROTTEN  +150");
          break;
        case "slipp":
          l?.tikk(false);
          return;
        case "levering":
          l?.stjerne();
          say(`RETT I PIPA!  ${pakkenavn(brev, sim.s.slipp - 1)} LEVERT`);
          break;
        case "nærLevering":
          l?.tikk(true);
          say(landingTekst(sim.s.sisteMeter), "#00ff8a");
          return;
        case "pakkebom":
          say("PAKKEN HAVNET I SNØEN", "#8aa0c0");
          if (sim.s.sisteHus)
            puff.push({
              p: tilVidda(sim.s.sisteHus.x, sim.s.sisteHus.h, sim.s.sisteHus.z),
              t0: now,
            });
          break;
      }
      radioen(radiolinje(h, radioN), now);
    };

    // The map: the whole vidda from above, north up; the corridor to Bergen runs off the bottom.
    const tegnKart = () => {
      if (!kart) return;
      const W = kart.canvas.width;
      const H = kart.canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const k = (Math.min(W, H) / 2 - 8) / GRENSE;
      const mx = (x: number) => cx + x * k;
      const my = (z: number) => cy + z * k;
      kart.clearRect(0, 0, W, H);
      kart.fillStyle = "rgba(0,0,0,0.6)";
      kart.fillRect(0, 0, W, H);
      kart.strokeStyle = "#00ff8a";
      kart.lineWidth = 1.5;
      kart.setLineDash([3, 3]);
      kart.beginPath();
      const gap = o.bergen ? Math.asin((PORT_BREDDE + 300) / GRENSE) : 0;
      // Canvas angles run clockwise from east; the corridor leaves on bearing BERGEN_KURS.
      const ut = BERGEN_KURS - Math.PI / 2;
      kart.arc(cx, cy, GRENSE * k, ut + gap, ut - gap + Math.PI * 2);
      kart.stroke();
      if (o.bergen) {
        kart.beginPath();
        for (const s of [-1, 1]) {
          const a = fraKorridor(GRENSE, s * (PORT_BREDDE + 300));
          const b = fraKorridor(BERGEN_SLUTT, s * (PORT_BREDDE + 300));
          kart.moveTo(mx(a[0]), my(a[1]));
          kart.lineTo(mx(b[0]), my(b[1]));
        }
        kart.stroke();
      }
      kart.setLineDash([]);
      // Snøfall's round wall with the gate gap to the south, and IQ's wall arc with its gate.
      kart.strokeStyle = "#c0a070";
      kart.lineWidth = 2;
      kart.beginPath();
      kart.arc(
        cx,
        cy,
        Math.max(4, TUN.r * k),
        Math.PI / 2 + 0.5,
        Math.PI / 2 - 0.5 + Math.PI * 2,
      );
      kart.stroke();
      kart.strokeStyle = stedÅpent(
        STEDER.find((s) => s.id === "muren")!,
        o,
      )
        ? "#ffb347"
        : "#5a6b8a";
      kart.lineWidth = 3;
      for (const side of [-1, 1]) {
        kart.beginPath();
        for (let i = 0; i <= 8; i++) {
          const [px, pz] = murPunkt(
            side * (MUR.port + ((MUR.halv - MUR.port) * i) / 8),
          );
          if (i) kart.lineTo(mx(px), my(pz));
          else kart.moveTo(mx(px), my(pz));
        }
        kart.stroke();
      }
      kart.font = "9px monospace";
      kart.fillStyle = "#8aa0c0";
      kart.textAlign = "center";
      for (const f of FJELL) kart.fillText("▲", mx(f.x), my(f.z) + 3);
      const prikker: {
        s: (typeof STEDER)[number];
        x: number;
        y: number;
        åpen: boolean;
      }[] = [];
      const px0 = mx(sim.s.x);
      const py0 = my(sim.s.z);
      for (const s of STEDER) {
        const åpen = stedÅpent(s, o);
        // Bergen's dot sits at the gate: the rest of it is off the bottom of the map.
        const x = s.id === "bergen" ? mx(BERGEN_PORT[0]) : mx(s.x);
        const y = s.id === "bergen" ? my(BERGEN_PORT[1]) : my(s.z);
        kart.fillStyle = åpen ? "#ffd700" : "#5a6b8a";
        kart.fillRect(x - 2, y - 2, 4, 4);
        if (!åpen) {
          kart.strokeStyle = "#9fb0cc";
          kart.lineWidth = 1;
          kart.strokeRect(x - 3, y - 10, 6, 5);
          kart.beginPath();
          kart.arc(x, y - 10, 2, Math.PI, 0);
          kart.stroke();
        }
        prikker.push({ s, x, y, åpen });
      }
      // Labels: only the nearest locked place says when it opens, the rest give
      // their name. Each label takes the first free spot round its dot (right,
      // left, below, above) and is left out if none is free.
      const låste = prikker.filter((p) => !p.åpen);
      const nærmest = låste.reduce<(typeof låste)[number] | null>(
        (b, p) =>
          !b ||
          Math.hypot(p.x - px0, p.y - py0) < Math.hypot(b.x - px0, b.y - py0)
            ? p
            : b,
        null,
      );
      const tatt = prikker.map((p) => ({
        x: p.x - 3,
        y: p.y - 11,
        w: 7,
        h: 14,
      }));
      kart.textAlign = "left";
      for (const p of prikker) {
        const tekst =
          p.åpen || p === nærmest ? stedsnavn(p.s, o, true) : p.s.kort;
        const w = kart.measureText(tekst).width;
        const h = 9;
        const plass = [
          { x: p.x + 6, y: p.y - 4 },
          { x: p.x - 6 - w, y: p.y - 4 },
          { x: p.x - w / 2, y: p.y + 4 },
          { x: p.x - w / 2, y: p.y - 13 - h },
        ].find(
          (q) =>
            q.x >= 1 &&
            q.x + w <= W - 1 &&
            q.y >= 1 &&
            q.y + h <= H - 1 &&
            !tatt.some(
              (t) =>
                q.x < t.x + t.w &&
                q.x + w > t.x &&
                q.y < t.y + t.h &&
                q.y + h > t.y,
            ),
        );
        if (!plass) continue;
        tatt.push({ ...plass, w, h });
        kart.fillStyle = p.åpen ? "#d9e4f5" : "#9fb0cc";
        kart.fillText(tekst, plass.x, plass.y + h - 1);
      }
      kart.fillStyle = "#c0d2ec";
      for (let i = 0; i < FUGLER.length; i++) {
        if (sim.s.tid - sim.s.fanget[i] < FUGL_TILBAKE) continue;
        const f = fuglPos(FUGLER[i], sim.s.tid);
        kart.fillRect(mx(f.x) - 1, my(f.z) - 1, 2, 2);
      }
      const px = mx(sim.s.x);
      const py = my(sim.s.z);
      kart.save();
      kart.translate(px, py);
      kart.rotate(sim.s.kurs);
      kart.fillStyle = "#f0624a";
      kart.beginPath();
      kart.moveTo(0, -6);
      kart.lineTo(-4, 4);
      kart.lineTo(4, 4);
      kart.fill();
      kart.restore();
      kart.fillStyle = "#d9e4f5";
      kart.textAlign = "left";
      kart.fillText("N", 3, 10);
    };

    // The compass: a tape across the top, the heading in the middle, places as marks.
    const tegnKompass = () => {
      if (!kompass) return;
      const W = kompass.canvas.width;
      const H = kompass.canvas.height;
      const SYN = Math.PI / 3;
      kompass.clearRect(0, 0, W, H);
      kompass.fillStyle = "rgba(0,0,0,0.6)";
      kompass.fillRect(0, 0, W, H);
      kompass.font = "11px monospace";
      kompass.textAlign = "center";
      const ved = (retning: number) => {
        const d = vinkelTil(sim.s.kurs, retning);
        return Math.abs(d) <= SYN ? W / 2 + (d / SYN) * (W / 2 - 4) : null;
      };
      for (let i = 0; i < 24; i++) {
        const x = ved((i / 24) * Math.PI * 2);
        if (x == null) continue;
        const bokstav = i % 6 === 0 ? "NØSV"[i / 6] : null;
        kompass.fillStyle = bokstav ? "#d9e4f5" : "#5a6b8a";
        if (bokstav) kompass.fillText(bokstav, x, H - 6);
        else kompass.fillRect(x, H - 7, 1, 4);
      }
      for (const s of STEDER) {
        const x = ved(peiling(sim.s.x, sim.s.z, s.x, s.z));
        if (x == null) continue;
        kompass.fillStyle = stedÅpent(s, o) ? "#ffd700" : "#5a6b8a";
        kompass.beginPath();
        kompass.moveTo(x, 2);
        kompass.lineTo(x - 3, 7);
        kompass.lineTo(x + 3, 7);
        kompass.fill();
      }
      kompass.fillStyle = "#f0624a";
      kompass.fillRect(W / 2 - 1, 0, 2, H);
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (r.tapt) return;
      // Last frame's draw calls, for the dev page.
      if (fps) (window as unknown as { __trekk?: number }).__trekk = r.trekk;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const t = now / 1000;
      const spiller = faseRef.current === "spiller";

      let climb = 0;
      if (spiller) {
        const k = heldRef.current;
        const inn: Styring = {
          steer: Math.max(
            -1,
            Math.min(1, (k.R ? 1 : 0) - (k.L ? 1 : 0) + touchRef.current.steer),
          ),
          climb: Math.max(
            -1,
            Math.min(1, (k.U ? 1 : 0) - (k.D ? 1 : 0) + touchRef.current.climb),
          ),
          sprang: false,
          gass: Math.max(
            -1,
            Math.min(1, (k.G ? 1 : 0) - (k.B ? 1 : 0) + touchRef.current.gass),
          ),
          slipp: slippRef.current,
        };
        climb = inn.climb;
        slippRef.current = false;
        const før = sim.s.poeng;
        for (const h of sim.step(dt, inn)) hendelse(h);
        if (sim.s.poeng > før)
          setPluss({
            tekst: `+${sim.s.poeng - før}`,
            farge: "#ffd700",
            id: ++id,
          });
        lyd.current?.setVind(sim.s.fart / 800, 0);
        gange += dt * (sim.s.fart / 800) * 9;
      }
      shake = Math.max(0, shake - dt);
      hopp = Math.max(0, hopp - dt);
      vink = Math.max(0, vink - dt);
      kast = Math.max(0, kast - dt);
      dukk = Math.max(0, dukk - dt);
      rull = Math.max(0, rull - dt);

      const { x, z, alt, kurs, bank } = sim.s;
      const fx = Math.sin(kurs);
      const fz = -Math.cos(kurs);
      const p = tilVidda(x, alt, z);
      // Chase camera behind the heading, high and a little to the right.
      const ønsket: Vec3 = [
        p[0] - fx * 24 + Math.cos(kurs) * 8,
        p[1] + 14,
        p[2] - fz * 24 + Math.sin(kurs) * 8,
      ];
      const target: Vec3 = [p[0] + fx * 16, p[1] + 1.2, p[2] + fz * 16];
      if (!eye) eye = ønsket;
      const kk = 1 - Math.exp(-8 * dt);
      eye = [
        eye[0] + (ønsket[0] - eye[0]) * kk,
        eye[1] + (ønsket[1] - eye[1]) * kk,
        eye[2] + (ønsket[2] - eye[2]) * kk,
      ];
      const sh = shake * 0.8;
      const kam: Vec3 = sh
        ? [
            eye[0] + (Math.random() - 0.5) * sh,
            eye[1] + (Math.random() - 0.5) * sh,
            eye[2],
          ]
        : eye;

      // Horizon pass: the coarse vidda, the curtain and the gate. One fog for both
      // passes, so the near tiles fade into the horizon mesh instead of ending in a wall of haze.
      r.begynn(
        {
          eye: dev?.friKamera?.eye ?? kam,
          target: dev?.friKamera?.target ?? target,
          fov: (62 * Math.PI) / 180,
          fjern: HORISONT + 200,
        },
        { ...HIMMEL, tåke: [FJERN * 0.5, HORISONT * 0.6] },
        LYS,
        t,
      );
      r.tegn(fjern, IDENT);
      if (murGlød) r.tegn(murGlød, IDENT);
      r.tegn(gardin, IDENT);
      if (!o.bergen) r.grå(0.85);
      r.tegn(
        M.nordlysport,
        transform(portPos, [0, -BERGEN_KURS, Math.sin(t) * 0.05], 2.5),
      );
      r.grå(0);
      // A padlock turns over every locked place (Bergen's at the gate), sized by
      // distance so it reads as a marker from across the vidda.
      for (const s of STEDER) {
        if (stedÅpent(s, o)) continue;
        const lx = s.id === "bergen" ? BERGEN_PORT[0] : s.x;
        const lz = s.id === "bergen" ? BERGEN_PORT[1] : s.z;
        const q = tilVidda(lx, 0, lz);
        const d = Math.hypot(q[0] - p[0], q[2] - p[2]);
        const sk = Math.max(3, Math.min(14, d / 70));
        q[1] = høyde(lx, lz) * SKALA + 12 + sk * 4;
        r.tegn(M.lås, transform(q, [0, t, 0], sk));
      }

      // Near pass: tiles around the sled, drawn over the horizon mesh.
      r.nullstillDybde();
      const i0x = Math.floor((p[0] - FJERN) / RUTE);
      const i1x = Math.floor((p[0] + FJERN) / RUTE);
      const i0z = Math.floor((p[2] - FJERN) / RUTE);
      const i1z = Math.floor((p[2] + FJERN) / RUTE);
      for (const [n, rute] of ruter) {
        const ix = Math.floor(n / 4096) - 2048;
        const iz = (n % 4096) - 2048;
        if (ix < i0x - 1 || ix > i1x + 1 || iz < i0z - 1 || iz > i1z + 1) {
          r.slipp(rute.mesh);
          r.slipp(rute.trær);
          ruter.delete(n);
        }
      }
      // A fast turn uncovers many tiles at once; build a few per frame (the
      // horizon mesh shows under the gaps), all at once only on the first frame.
      let nye = ruter.size ? 3 : Infinity;
      for (let ix = i0x; ix <= i1x; ix++)
        for (let iz = i0z; iz <= i1z; iz++) {
          const cx = (ix + 0.5) * RUTE;
          const cz = (iz + 0.5) * RUTE;
          const dx = cx - p[0];
          const dz = cz - p[2];
          if (dx * dx + dz * dz > (FJERN + RUTE) * (FJERN + RUTE)) continue;
          // Tiles well behind the camera are never on screen.
          if (dx * fx + dz * fz < -RUTE * 1.5) continue;
          const n = nøkkel(ix, iz);
          let rute = ruter.get(n);
          if (!rute) {
            if (nye-- <= 0) continue;
            const grå = STEDER.some(
              (s) =>
                !stedÅpent(s, o) &&
                Math.hypot(cx / SKALA - s.x, cz / SKALA - s.z) < s.r,
            );
            rute = { ...lagRute(ix, iz), grå };
            ruter.set(n, rute);
          }
          if (rute.grå) r.grå(0.85);
          r.tegn(rute.mesh, IDENT);
          if (rute.trær.length) r.tegnMange(M.tre, rute.trær, IDENT);
          if (rute.grå) r.grå(0);
        }

      // Places: antenna, the cave's crack, the wall's gate posts, padlocks over what is locked.
      if (r.synlig(antennePos, FJERN)) r.tegn(M.antenne, transform(antennePos));
      if (day >= grotten.dag && r.synlig(grottePos, FJERN))
        r.tegn(grotte, transform(grottePos, [0, Math.PI / 2, 0]));
      if (murGlød) r.tegn(murGlød, IDENT);
      if (r.synlig(murPos, FJERN))
        r.tegn(
          portMesh,
          transform(
            murPos,
            [0, -MUR.kurs, 0],
            [(MUR.port * SKALA) / (0.4 * SPOR), 1.35, 1],
          ),
        );

      // Snøfall: wall, gate, turrets, clock tower and named houses in one mesh.
      if (Math.hypot(x, z) < FJERN_SIM + TUN.r) {
        r.tegn(snofall, IDENT);
        r.tegnMange(M.tre, PYNTETRÆR, IDENT);
      }

      // Houses (baked), smoke, stars on the ones that got a package.
      r.tegn(husBakt, IDENT);
      let nRøyk = 0;
      for (const h of sim.s.hus) {
        const dx = h.x - x;
        const dz = h.z - z;
        if (dx * dx + dz * dz > FJERN_SIM * FJERN_SIM) continue;
        const pos = tilVidda(h.x, h.h, h.z);
        if (h.treff) {
          pos[1] += 3;
          r.tegn(M.stjerne, transform(pos, [0, t * 2, 0]));
          continue;
        }
        if (h.nær) {
          pos[1] += 3;
          r.tegn(M.merkeNær, transform(pos, [0, t, 0]));
          pos[1] -= 3;
        }
        nRøyk = pipeRøyk(RØYK, nRøyk, pos, t * motion, sim.s.vind);
      }

      // Letter birds on their rounds.
      for (let i = 0; i < FUGLER.length; i++) {
        if (sim.s.tid - sim.s.fanget[i] < FUGL_TILBAKE) continue;
        const f = fuglPos(FUGLER[i], sim.s.tid);
        const q = tilVidda(f.x, f.alt, f.z);
        if (!r.synlig(q, FJERN)) continue;
        r.tegn(
          M.fugl,
          transform(q, [0, -f.kurs, Math.sin(t * 12) * 0.25], 1.3),
        );
      }

      r.tegnRøyk(M.røyk, RØYK, nRøyk, ...RØYK_FADE);
      while (puff.length && t - puff[0].t0 > 1.2) puff.shift();
      let nSky = 0;
      for (const g of puff) nSky = skyRøyk(SKY, nSky, g.p, t - g.t0, 0);
      r.tegnRøyk(M.røyk, SKY, nSky, ...SKY_FADE);

      // The package in the air, or where the next one would land.
      if (sim.s.pakke) {
        const q = sim.s.pakke;
        r.tegn(
          M.pakke,
          transform(tilVidda(q.x, q.alt, q.z), [t * 3, t * 2, 0], 1.6),
        );
      } else if (spiller) {
        const bane = forutsiFri(sim.s);
        for (let i = 3; i < bane.length - 1; i += 2) {
          const q = bane[i];
          r.tegn(M.prikk, transform(tilVidda(q.x, q.alt, q.z)));
        }
        const siste = bane[bane.length - 1];
        if (siste) {
          const m = tilVidda(siste.x, høyde(siste.x, siste.z) + 3, siste.z);
          r.tegn(M.merke, transform(m));
        }
      }

      // The rig, its shadow on the snow, three reindeer with swinging legs.
      const sk = tilVidda(x, høyde(x, z) + 1.5, z);
      r.tegn(M.skygge, transform(sk, [0, -kurs, 0]));
      const base = transform(
        p,
        [
          -climb * 0.12,
          -kurs,
          -bank * 1.1 +
            (rull ? (1 - rull / RULL) * Math.PI * 2 : 0) +
            // A damaged sled wobbles.
            (reduceMotion ? 0 : Math.sin(t * 18) * sim.s.skade * 0.15),
        ],
        1,
      );
      // The sleigh swings out behind the reindeer while a turn builds.
      const sledeM = multiply(
        base,
        transform([0, 0, 0], [0, (sim.s.sving - sim.s.slep) * 0.35, 0]),
      );
      r.tegn(M.slede, sledeM);
      // Julius at the reins and Pil with the packages lean, wave, throw and duck.
      for (const [m, mat] of mannskap(sledeM, {
        t: reduceMotion ? 0 : t,
        lean: -sim.s.sving,
        vink,
        kast,
        krasj: dukk,
      }))
        r.tegn(m, mat);
      r.tegn(M.tømmer, base);
      for (let i = 0; i < 3; i++) {
        const fase = gange + i * 2.1;
        const bob =
          (spiller ? Math.sin(fase * 2) * 0.2 : 0) +
          Math.sin(Math.min(1, hopp / 0.5) * Math.PI) * (1 + i * 0.3);
        const rein = multiply(
          base,
          transform(
            [REIN[i][0], REIN[i][1] + bob, REIN[i][2]],
            [Math.sin(fase * 2) * 0.05, 0, 0],
            REIN_SKALA,
          ),
        );
        r.tegn(M.rein[i === 2 ? 0 : 1], rein);
        for (let j = 0; j < 4; j++) {
          const sving = spiller
            ? Math.sin(fase + (j === 0 || j === 3 ? 0 : Math.PI)) * 0.6
            : 0;
          r.tegn(M.bein, multiply(rein, transform(BEIN[j], [sving, 0, 0])));
        }
      }
      if (!reduceMotion)
        r.snø((30 + Math.abs(sim.s.vind) * 50) / 400, t, sim.s.vind);
      r.avslutt();
      tegnKompass();

      if (dt > 0 && dt < 0.1) {
        tider[nTid % tider.length] = dt * 1000;
        nTid++;
      }
      if (now - målAt > 3000 && nTid >= 60) {
        målAt = now;
        const sorted = Array.from(
          tider.subarray(0, Math.min(nTid, tider.length)),
        ).sort((a, b) => a - b);
        const p50 = sorted[Math.floor(sorted.length * 0.5)];
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        const neste = TRINN[TRINN.indexOf(res) + 1];
        if (!oppløsning && neste && p50 > GRENSE_MS) {
          res = neste;
          r.setOppløsning(OPPLØSNINGER[res][0], OPPLØSNINGER[res][1]);
          nTid = 0;
        }
        setStat({ p50, p95, res });
      }

      if (now - hudAt > 100) {
        hudAt = now;
        tegnKart();
        setHud({
          skade: sim.s.skade,
          treff: sim.s.tid - sim.s.sisteSkade < 0.35,
          alt,
          fart: sim.s.fart,
          poeng: sim.s.poeng,
          pakker: sim.s.pakker,
          fugler: sim.s.fugler,
          neste: pakkenavn(brev, sim.s.slipp),
          sted: nærmesteSted(sim.s, o),
          funnet: sim.s.oppdaget.size,
          åpne,
          gass:
            (heldRef.current.G ? 1 : 0) -
            (heldRef.current.B ? 1 : 0) +
            touchRef.current.gass,
        });
      }
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      lyd.current?.stop();
      r.dispose();
    };
    // Renderer and loop are built once per flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const b = hud;
  const altPct = b ? (b.alt - ALT_MIN) / (ALT_MAX - ALT_MIN) : 0.4;
  const knop = b ? Math.round(b.fart / 12) : 0;
  const panel =
    "border-2 border-(--brass) bg-black/70 text-(--neon-green) px-2 py-1 text-lg leading-tight";
  const knapp =
    "min-h-11 min-w-11 px-3 border-2 text-lg font-bold cursor-pointer";
  const holdKnapp =
    "w-16 h-16 border-4 text-base font-bold cursor-pointer select-none touch-none";

  return (
    <div className="@container relative aspect-video w-full bg-black select-none touch-none overflow-hidden font-retro">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full"
        style={{ imageRendering: "pixelated" }}
      />
      <div
        className="absolute inset-0"
        onPointerDown={onPointer}
        onPointerMove={onPointer}
        onPointerUp={onPointer}
        onPointerCancel={onPointer}
        onLostPointerCapture={onPointer}
        onContextMenu={(e) => e.preventDefault()}
        aria-hidden="true"
      />
      {feil && (
        <div className="absolute inset-0 flex items-center justify-center text-(--christmas-red) text-xl p-4 text-center">
          {feil}
        </div>
      )}
      {touchHint && fase === "spiller" && (
        <div className="absolute bottom-2 left-3 text-(--neon-green)/40 text-base pointer-events-none">
          DRA FOR Å STYRE: SIDELENGS = SVING, OPP/NED = HØYDE
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1 left-1 ${panel}`}>
          <div className="text-(--gold) uppercase">Snøfall-vidda</div>
          <div>FRI FLYGING</div>
          <div className="text-(--cold-blue)">{b?.sted ?? ""}</div>
          <div className="text-base text-(--neon-green)/80">
            STEDER {b?.funnet ?? 0}/{b?.åpne ?? 0} · BREVFUGLER {b?.fugler ?? 0}
          </div>
          <div className="text-(--gold)">
            PAKKER {b?.pakker ?? 0}
            <span className="block text-base text-(--neon-green)/80">
              NESTE: {b?.neste ?? ""}
            </span>
          </div>
        </div>
        <canvas
          ref={kompassRef}
          width={240}
          height={22}
          className="absolute top-1 left-1/2 -translate-x-1/2 w-1/3 border-2 border-(--brass)"
          style={{ imageRendering: "pixelated" }}
          aria-label="Kurs"
        />
        <div className={`absolute top-1 right-14 ${panel} text-right`}>
          <div className="text-(--gold) tabular-nums text-2xl">
            {b?.poeng ?? 0}
          </div>
        </div>
        {b?.treff && (
          <div className="pointer-events-none absolute inset-0 border-8 border-(--christmas-red)/70" />
        )}
        <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
          <div className="text-base text-(--neon-green)/80">SLEDE</div>
          <div
            className="relative w-4 h-12 border-2 border-(--brass) bg-black/60"
            aria-label={`Skade ${Math.round((b?.skade ?? 0) * 100)} prosent`}
          >
            <div
              className="absolute bottom-0 inset-x-0 bg-(--christmas-red)"
              style={{ height: `${(b?.skade ?? 0) * 100}%` }}
            />
          </div>
          <div className="text-base text-(--neon-green)/80">HØYDE</div>
          <div className="relative w-4 h-28 border-2 border-(--brass) bg-black/60">
            <div
              className={`absolute bottom-0 inset-x-0 ${altPct < 0.15 ? "bg-(--christmas-red)" : altPct < 0.35 ? "bg-(--gold)" : "bg-(--neon-green)"}`}
              style={{ height: `${altPct * 100}%` }}
            />
          </div>
          <div className="text-base tabular-nums text-(--neon-green)/80">
            {b ? Math.round(b.alt / 10) : 15} FV
          </div>
        </div>
        <div
          className={`absolute right-1 top-1/2 -translate-y-1/2 ${panel} text-right`}
        >
          <div className="tabular-nums">{knop} KNOP</div>
          {(b?.gass ?? 0) !== 0 && (
            <div className="text-(--cold-blue)">
              {(b?.gass ?? 0) > 0 ? "FULL FART" : "BREMSER"}
            </div>
          )}
        </div>
        <canvas
          ref={kartRef}
          width={184}
          height={184}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 border-2 border-(--brass)"
          style={{ imageRendering: "pixelated" }}
          aria-label="Kart over vidda"
        />
        {melding && (
          <div
            key={melding.id}
            className="absolute inset-x-0 top-[38%] text-center text-3xl"
            style={{
              color: melding.farge,
              textShadow: "0 0 8px #000",
              animation: "rise 1.4s ease-out forwards",
            }}
          >
            {melding.tekst}
          </div>
        )}
        {fase === "spiller" && (
          <RadioBoks kø={radio} onFerdig={() => setRadio((k) => k.slice(1))} />
        )}
        {pluss && fase === "spiller" && (
          <div
            key={pluss.id}
            className="absolute inset-x-0 top-[52%] text-center text-2xl text-(--gold)"
            style={{
              textShadow: "0 0 8px #000",
              animation: "rise 1s ease-out forwards",
            }}
          >
            {pluss.tekst}
          </div>
        )}
        {fps && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 text-base text-(--neon-green) bg-black/70 px-1 tabular-nums pointer-events-none">
            {stat.res}×{OPPLØSNINGER[stat.res][1]} · p50 {stat.p50.toFixed(1)}{" "}
            ms · p95 {stat.p95.toFixed(1)} ms
          </div>
        )}
      </div>

      {fase === "spiller" && (
        <>
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              type="button"
              aria-label="Slipp pakke"
              className={`${holdKnapp} border-(--gold) text-(--gold) bg-black/60`}
              onPointerDown={(e) => {
                e.stopPropagation();
                slippRef.current = true;
              }}
            >
              SLIPP
            </button>
            <button
              type="button"
              aria-label="Brems"
              className={`${holdKnapp} border-(--brass) bg-black/60 text-(--neon-green)/80`}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.setPointerCapture(e.pointerId);
                touchRef.current.gass = -1;
              }}
              onPointerUp={slippGass}
              onPointerCancel={slippGass}
            >
              BREMS
            </button>
            <button
              type="button"
              aria-label="Fart"
              className={`${holdKnapp} rounded-full border-(--brass) bg-black/60 text-(--neon-green)/80`}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.setPointerCapture(e.pointerId);
                touchRef.current.gass = 1;
              }}
              onPointerUp={slippGass}
              onPointerCancel={slippGass}
            >
              FART
            </button>
          </div>
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

      {fase === "pause" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 p-2">
          <div className="border-2 border-(--brass) bg-black/85 p-2 max-w-lg w-full text-(--neon-green) space-y-1.5 text-center">
            <div className="text-(--gold) text-2xl">PAUSE</div>
            <div className="text-base opacity-70">
              Fri flyging over Snøfall-vidda
            </div>
            <div className="text-sm opacity-60 leading-tight">
              PILTASTER / WASD · SHIFT = FART · X = BREMS · MELLOMROM = SLIPP
              PAKKE · ESC = PAUSE
            </div>
            <button
              type="button"
              onClick={() => {
                SoundManager.playSound("click");
                setFase("spiller");
              }}
              className={`${knapp} border-(--gold) text-(--gold) w-full`}
            >
              FORTSETT
            </button>
            <button
              type="button"
              onClick={() => {
                SoundManager.playSound("click");
                onAvslutt();
              }}
              className={`${knapp} border-(--neon-green)/50 w-full`}
            >
              TILBAKE TIL ETAPPENE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
