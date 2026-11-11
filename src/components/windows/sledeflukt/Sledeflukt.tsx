"use client";
import { NyttIDag } from "@/components/ui/NyttIDag";

import { useEffect, useMemo, useRef, useState } from "react";
import { RetroWindow } from "@/components/ui/RetroWindow";
import { GameEngine } from "@/lib/game-engine";
import { SoundManager } from "@/lib/sounds";
import {
  ALT_MAX,
  ALT_MIN,
  RING_ALT,
  bjelleKrav,
  bjeller,
  createSim,
  dagensUtfordring,
  ETAPPER,
  etapperFor,
  forutsiPakke,
  lagBane,
  leveringsoppdrag,
  landingTekst,
  pakkenavn,
  radiolinje,
  rekkeMult,
  SPILLERE,
  utfordringStatus,
  åpnerTekst,
  type Hendelse,
  type Sim,
  type SledeEtappe,
  type Styring,
} from "../snofall-tv/slede";
import { SledeLyd } from "../snofall-tv/slede-lyd";
import { hex, identity, multiply, transform, type Mat4, type Vec3 } from "./gl";
import {
  GRENSE_MS,
  OPPLØSNINGER,
  Renderer,
  TRINN,
  type Oppløsning,
} from "./renderer";
export type { Oppløsning } from "./renderer";
import { FriFlyging } from "./FriFlyging";
import { RadioBoks } from "./RadioBoks";
import { useKontroller } from "./kontroller";
import {
  bakke,
  BEIN,
  FLIS,
  husPlass,
  husVariant,
  kursYaw,
  lagFlis,
  lagVerden,
  meshes,
  nøkkel,
  REIN,
  REIN_SKALA,
  mannskap,
  SKALA,
  tilVerden,
  type Hus,
  type Verden,
  pipeRøyk,
  RØYK_FADE,
  RØYK_MAKS,
  SKY_FADE,
  skyRøyk,
} from "./verden";

/**
 * SLEDEFLUKT: IQ's sleigh simulator in retro-pixel 3D. The pure sim in
 * snofall-tv/slede.ts flies the course; this file maps it to the valley,
 * drives the renderer, listens to keys and fingers, and keeps IQ's panel.
 */

type Fase = "start" | "nedtelling" | "spiller" | "pause" | "slutt" | "tapt";
const RULL = 0.8;
const NEDTELLING = 3;
/** Draw distance in render units; fog hides the end of it. */
const FJERN = 420;
const FJERN_SIM = FJERN / SKALA;

interface Hud {
  alt: number;
  skade: number;
  /** A hit just now: the screen edge flashes red. */
  treff: boolean;
  fart: number;
  poeng: number;
  varder: number;
  varderTotalt: number;
  liv: number;
  kraft: number;
  sprang: boolean;
  mult: number;
  utf: string;
  vind: number;
  framdrift: number;
  nyser: boolean;
  gass: number;
  /** Seconds left of 3–2–1, 0 when flying. */
  ned: number;
  pakker: number;
  /** Name of the next package to drop; null on stages without houses. */
  neste: string | null;
  /** Altitude of the next ring ahead, null when none is in sight. */
  ring: number | null;
}

const IDENT = identity();
const RØYK = new Float32Array(RØYK_MAKS * 4);
const SKY = new Float32Array(RØYK_MAKS * 4);
const LYS: Vec3 = [0.35, 0.8, 0.5];
const farge = (s: string) => hex(parseInt(s.slice(1), 16));

interface Melding {
  tekst: string;
  farge: string;
  id: number;
}

interface SpillProps {
  day: number;
  /** Dev only: frame-time overlay. */
  fps?: boolean;
  /** Fixed internal resolution; unset = 640 with automatic fallback to 480, then 320. */
  oppløsning?: Oppløsning;
  /** The GL context was lost; the parent remounts with a fresh canvas. */
  onTapt?: () => void;
}

/** The stages, or free flight over the vidda; each mounts its own renderer. */
export function SledefluktSpill(props: SpillProps) {
  const [fri, setFri] = useState(false);
  const [tapt, setTapt] = useState(false);
  const [runde, setRunde] = useState(0);
  if (tapt)
    return (
      <button
        type="button"
        className="w-full h-full min-h-48 flex items-center justify-center bg-black text-(--neon-green) text-2xl p-4"
        onClick={() => {
          setTapt(false);
          setRunde((n) => n + 1);
        }}
      >
        BILDET FORSVANT · TRYKK FOR Å STARTE PÅ NYTT
      </button>
    );
  const p = { ...props, onTapt: () => setTapt(true) };
  return fri ? (
    <FriFlyging key={runde} {...p} onAvslutt={() => setFri(false)} />
  ) : (
    <Etappeflukt key={runde} {...p} onFri={() => setFri(true)} />
  );
}

function Etappeflukt({
  day,
  fps = false,
  oppløsning,
  onTapt,
  onFri,
}: SpillProps & { onFri: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onTaptRef = useRef(onTapt);
  useEffect(() => {
    onTaptRef.current = onTapt;
  });
  const kartRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Sim | null>(null);
  const faseRef = useRef<Fase>("start");
  const lyd = useRef<SledeLyd | null>(null);
  const [resultat, setResultat] = useState({
    poeng: 0,
    bjeller: 0,
    beste: 0,
    varder: 0,
    varderTotalt: 0,
    stjerner: 0,
    fugler: 0,
    besteRekke: 0,
    nære: 0,
    tidsbonus: 0,
    krasj: 0,
    utfordringKlart: false,
    pakker: 0,
    pakkebom: 0,
    leveringKlart: false,
    nyRekord: false,
    nyFamilierekord: false,
  });
  const [rekorder, setRekorder] = useState(false);
  // Set when START is pressed with nobody chosen; the choice then starts the run.
  const [spørHvem, setSpørHvem] = useState(false);

  const åpne = etapperFor(day);
  const [etappe, setEtappe] = useState<SledeEtappe>(
    åpne[åpne.length - 1] ?? ETAPPER[0],
  );
  const etappeRef = useRef(etappe);
  const [assist, setAssist] = useState(true);
  const [fase, setFaseState] = useState<Fase>("start");
  const [hud, setHud] = useState<Hud | null>(null);
  const [alle, setAlle] = useState(() => GameEngine.getSledeResultater());
  // Who is flying: their own bells and best show on the start and result screens.
  const [spiller, setSpillerState] = useState<string | null>(() => {
    const s = GameEngine.getSledeSpiller();
    return s && (SPILLERE as readonly string[]).includes(s) ? s : null;
  });
  const spillerRef = useRef(spiller);
  const setSpiller = (n: string) => {
    SoundManager.playSound("click");
    spillerRef.current = n;
    setSpillerState(n);
    GameEngine.setSledeSpiller(n);
    if (spørHvem) startRef.current();
  };
  const beste = useMemo(
    () => (spiller ? GameEngine.getSledeResultaterFor(spiller) : alle),
    [spiller, alle],
  );
  const [melding, setMelding] = useState<Melding | null>(null);
  const [pluss, setPluss] = useState<Melding | null>(null);
  const [radio, setRadio] = useState<Melding[]>([]);
  const [feil, setFeil] = useState<string | null>(null);
  const [stat, setStat] = useState({
    p50: 0,
    p95: 0,
    res: (oppløsning ?? 640) as Oppløsning,
  });
  const reduceMotion = useRef(false);
  const krav = useMemo(
    () => bjelleKrav(lagBane(etappe).filter((t) => t.type === "varde").length),
    [etappe],
  );
  const utfordring = useMemo(
    () => dagensUtfordring(day, etappe),
    [day, etappe],
  );
  const utfordringRef = useRef(utfordring);
  useEffect(() => {
    utfordringRef.current = utfordring;
  }, [utfordring]);
  const levering = useMemo(() => leveringsoppdrag(day, etappe), [day, etappe]);
  const leveringRef = useRef(levering);
  useEffect(() => {
    leveringRef.current = levering;
  }, [levering]);
  // From day 14 every stage has chimneys; a stage without a target pays them as a bonus.
  const harHus = useMemo(
    () => lagBane(etappe, day).some((t) => t.type === "hus"),
    [etappe, day],
  );
  const harHusRef = useRef(harHus);
  useEffect(() => {
    harHusRef.current = harHus;
  }, [harHus]);
  // The kids' letters name the packages; read when a run starts.
  const brev = useRef<{ from?: string }[]>([]);

  const nedtelling = useRef(-1);

  const setFase = (f: Fase) => {
    if (f !== "spiller") lyd.current?.stop();
    if (f !== "spiller" && f !== "nedtelling") nedtelling.current = -1;
    if (f === "start")
      simRef.current = createSim(etappeRef.current, {
        assist: true,
        reduceMotion: true,
        dag: day,
      });
    faseRef.current = f;
    setFaseState(f);
  };
  // A pause remembers where it came from, so a countdown resumes as a countdown.
  const pauseFra = useRef<Fase>("spiller");
  const pauser = () => {
    if (faseRef.current !== "spiller" && faseRef.current !== "nedtelling")
      return;
    pauseFra.current = faseRef.current;
    setFase("pause");
  };
  const fortsett = () => {
    if (pauseFra.current === "nedtelling") nedtelling.current = NEDTELLING;
    setFase(pauseFra.current);
  };

  const start = () => {
    SoundManager.playSound("click");
    if (!spillerRef.current) {
      setSpørHvem(true);
      setFase("start");
      return;
    }
    setSpørHvem(false);
    brev.current = GameEngine.getSantaLetters();
    simRef.current = createSim(etappe, {
      assist,
      reduceMotion: reduceMotion.current,
      utfordring,
      levering: levering ?? undefined,
      dag: day,
    });
    nedtelling.current = NEDTELLING;
    setFase("nedtelling");
  };
  const startRef = useRef(start);
  useEffect(() => {
    startRef.current = start;
  });
  const {
    held: heldRef,
    touch: touchRef,
    slipp: slippRef,
    sprang: sprangRef,
    touchHint,
    onPointer,
    slippGass,
  } = useKontroller(
    () => faseRef.current === "spiller",
    (e) => {
      const f = faseRef.current;
      if (e.key === "Escape" || e.key === "p") {
        if (f === "pause") fortsett();
        else pauser();
      } else if (e.key === "Enter" && f !== "spiller") {
        if (f === "pause") fortsett();
        else if (f !== "nedtelling") startRef.current();
      }
    },
    pauser,
  );

  useEffect(() => {
    etappeRef.current = etappe;
    simRef.current = createSim(etappe, {
      assist: true,
      reduceMotion: true,
      dag: day,
    });
  }, [etappe, day]);

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
    reduceMotion.current =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    const motion = reduceMotion.current ? 0.35 : 1;
    lyd.current = new SledeLyd();
    const M = meshes();
    let verden: Verden = lagVerden(etappeRef.current, day);
    const fliser = new Map<number, Float32Array>();
    const husM = new Map<Hus, Mat4>();
    const kart = kartRef.current?.getContext("2d") ?? null;

    let last = 0;
    let hudAt = 0;
    let raf = 0;
    let shake = 0;
    let nyser = 0;
    let gange = 0;
    let id = 0;
    let eye: Vec3 | null = null;
    let sistDist = 0;
    // Gold sparks from the last rings flown through, and smoke a chimney puffs back: where and when.
    const gnister: { p: Vec3; t0: number }[] = [];
    const puff: { p: Vec3; t0: number }[] = [];
    // Reindeer reaction (a hop) and Rampenissen's radio: seconds left, and lines said.
    let hopp = 0;
    // Crew animations (verden.mannskap): seconds left.
    let vink = 0;
    let kast = 0;
    let dukk = 0;
    // Crash tumble: a full barrel roll of the sled over RULL seconds.
    let rull = 0;
    let radioTil = 0;
    let radioN = 0;

    const say = (tekst: string, farge = "#ffd700") =>
      setMelding({ tekst, farge, id: ++id });

    /** Rampenissen cuts in at most every six seconds; near misses only now and then. */
    const radioen = (h: Hendelse, now: number) => {
      if (now < radioTil) return;
      if (h === "nesten" && radioN % 3) return;
      const l = radiolinje(h, radioN);
      if (!l) return;
      radioN++;
      radioTil = now + 4;
      setRadio((k) =>
        [...k, { tekst: l, farge: "#ffb347", id: ++id }].slice(-3),
      );
    };
    // Frame-time ring for the auto resolution and the dev overlay.
    const tider = new Float32Array(180);
    let nTid = 0;
    let målAt = 0;

    const hendelse = (h: Hendelse, sim: Sim) => {
      if (h === "krasj") dukk = 1;
      if (h === "slipp") kast = 0.6;
      if (h === "bjelle" && sim.s.rekke >= 3) vink = 1.5;
      const l = lyd.current;
      radioen(h, performance.now() / 1000);
      switch (h) {
        case "bjelle":
          l?.bjelle(rekkeMult(sim.s.rekke));
          gnister.push({
            p: tilVerden(sim.s.px, sim.s.alt, sim.s.dist),
            t0: performance.now() / 1000,
          });
          if (sim.s.rekke % 3 === 0 && sim.s.rekke > 0)
            say(`REKKE x${rekkeMult(sim.s.rekke)}`, "#00ff8a");
          break;
        case "nesten":
          l?.tikk(false);
          hopp = 0.5;
          say("NESTEN!", "#8aa0c0");
          break;
        case "fugl":
          l?.stjerne();
          hopp = 0.5;
          say("BREVFUGL FANGET  +80", "#c0d2ec");
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
          say("PORTEN STÅR ÅPEN  +500");
          break;
        case "grotte":
          l?.port();
          say("LYS NED I GROTTEN  +150");
          break;
        case "sprang":
          l?.sprang();
          say("SPRANG!", "#ff8a5a");
          break;
        case "skrape":
          l?.krasj();
          hopp = 0.4;
          gnister.push({
            p: tilVerden(sim.s.px, sim.s.alt, sim.s.dist),
            t0: performance.now() / 1000,
          });
          say("AU! SLEDEN TOK SKADE", "#f0624a");
          break;
        case "krasj":
          l?.krasj();
          nyser = 1.5;
          hopp = 0.7;
          if (!reduceMotion.current) {
            shake = 0.45;
            rull = RULL;
          }
          say(
            sim.s.tapt ? "IQ KOBLER INN NØDBREMSEN" : "KLONK! SNØ I ANSIKTET",
            "#f0624a",
          );
          break;
        case "utfordring":
          l?.port();
          say(`UTFORDRING KLART  +${utfordringRef.current.bonus}`);
          break;
        case "slipp":
          l?.tikk(false);
          break;
        case "levering":
          l?.stjerne();
          say(
            `RETT I PIPA!  ${pakkenavn(brev.current, sim.s.slipp - 1)} LEVERT`,
          );
          break;
        case "nærLevering":
          l?.tikk(true);
          say(landingTekst(sim.s.sisteMeter), "#00ff8a");
          break;
        case "pakkebom":
          say("PAKKEN HAVNET I SNØEN", "#8aa0c0");
          l?.tikk(false);
          // A puff of snow where it landed; a missed chimney puffs a cloud back at you too.
          if (sim.s.landing)
            puff.push({
              p: tilVerden(sim.s.landing.x, 0, sim.s.landing.z),
              t0: performance.now() / 1000,
            });
          if (sim.s.sisteHus)
            puff.push({
              p: tilVerden(
                sim.s.sisteHus.x,
                sim.s.sisteHus.h,
                sim.s.sisteHus.z,
              ),
              t0: performance.now() / 1000,
            });
          break;
        case "leveringKlart":
          l?.port();
          say(`LEVERING KLART  +${leveringRef.current?.bonus ?? 0}`);
          break;
        case "mål":
          l?.fanfare();
          break;
      }
    };

    const tegnKart = (sim: Sim) => {
      if (!kart) return;
      const W = kart.canvas.width;
      const H = kart.canvas.height;
      kart.clearRect(0, 0, W, H);
      kart.fillStyle = "rgba(0,0,0,0.55)";
      kart.fillRect(0, 0, W, H);
      const sx = (x: number) => W / 2 + (x / 1.4) * (W / 2 - 4);
      const sy = (z: number) => H - 10 - ((z - sim.s.dist) / 1500) * (H - 16);
      for (let i = Math.max(0, sim.s.first - 1); i < sim.s.ting.length; i++) {
        const t = sim.s.ting[i];
        if (t.z > sim.s.dist + 1500) break;
        if (t.treff || t.type === "vind") continue;
        kart.fillStyle = t.låst
          ? "#5a6b8a"
          : t.type === "varde"
            ? "#ffb347"
            : t.type === "fugl"
              ? "#c0d2ec"
              : t.type === "stjerne"
                ? "#ffd700"
                : t.type === "mur"
                  ? "#9fb0cc"
                  : t.type === "band"
                    ? "#00ff8a"
                    : t.type === "hus"
                      ? "#d9e4f5"
                      : "#2e7a4f";
        const y = sy(t.z);
        if (t.type === "mur") {
          kart.fillRect(2, y - 1, W - 4, 2);
          kart.fillStyle = "#ffd700";
          kart.fillRect(sx(t.port ?? 0) - 5, y - 1, 10, 2);
        } else kart.fillRect(sx(t.x) - 1.5, y - 1.5, 3, 3);
      }
      kart.fillStyle = "#f0624a";
      const px = sx(sim.s.px);
      kart.beginPath();
      kart.moveTo(px, H - 14);
      kart.lineTo(px - 4, H - 6);
      kart.lineTo(px + 4, H - 6);
      kart.fill();
      kart.fillStyle = "#d9e4f5";
      kart.font = "10px monospace";
      kart.fillText("N", W / 2 - 3, 10);
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (r.tapt) return;
      // Last frame's draw calls, for the dev page.
      if (fps) (window as unknown as { __trekk?: number }).__trekk = r.trekk;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const sim = simRef.current;
      if (!sim) return;
      // The dev page (fps) exposes the live sim to browser tests.
      if (fps) (window as unknown as { __slede?: Sim["s"] }).__slede = sim.s;
      const e = etappeRef.current;
      if (verden.etappe !== e) {
        verden = lagVerden(e, day);
        husM.clear();
        eye = null;
      }
      const t = now / 1000;
      const spiller = faseRef.current === "spiller";

      if (faseRef.current === "nedtelling") {
        const før = Math.ceil(nedtelling.current);
        nedtelling.current -= dt;
        const nå = Math.ceil(nedtelling.current);
        if (nå < før) lyd.current?.tikk(nå <= 0);
        if (nedtelling.current <= 0) {
          lyd.current?.startVind();
          setFase("spiller");
        }
      }

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
          sprang: k.S || sprangRef.current,
          gass: Math.max(
            -1,
            Math.min(1, (k.G ? 1 : 0) - (k.B ? 1 : 0) + touchRef.current.gass),
          ),
          slipp: slippRef.current,
        };
        climb = inn.climb;
        sprangRef.current = false;
        slippRef.current = false;
        const før = sim.s.poeng;
        for (const h of sim.step(dt, inn)) hendelse(h, sim);
        if (sim.s.poeng > før)
          setPluss({
            tekst: `+${sim.s.poeng - før}`,
            farge: "#ffd700",
            id: ++id,
          });
        lyd.current?.setVind(sim.s.fart / e.fart, sim.s.vind);
        if (sim.s.ferdig || sim.s.tapt) {
          const b = sim.s.ferdig
            ? bjeller(sim.s.varder, sim.s.varderTotalt, sim.s.krasj)
            : 0;
          const før = GameEngine.getSledeResultater();
          const bedre = (p?: { poeng: number; bjeller: number }) =>
            !p || b > p.bjeller || (b === p.bjeller && sim.s.poeng > p.poeng);
          const saved = GameEngine.recordSledeResultat(
            e.id,
            sim.s.poeng,
            b,
            spillerRef.current,
            sim.s.utfordringKlart ? day : undefined,
          );
          setResultat({
            poeng: sim.s.poeng,
            bjeller: b,
            beste: saved.poeng,
            varder: sim.s.varder,
            varderTotalt: sim.s.varderTotalt,
            stjerner: sim.s.stjerner,
            fugler: sim.s.fugler,
            besteRekke: sim.s.besteRekke,
            nære: sim.s.nære,
            tidsbonus: sim.s.tidsbonus,
            krasj: sim.s.krasj,
            utfordringKlart: sim.s.utfordringKlart,
            pakker: sim.s.pakker,
            pakkebom: sim.s.pakkebom,
            leveringKlart: sim.s.leveringKlart,
            nyRekord:
              !!spillerRef.current &&
              bedre(før[`${spillerRef.current}/${e.id}`]),
            nyFamilierekord: bedre(før[e.id]),
          });
          setAlle(GameEngine.getSledeResultater());
          setFase(sim.s.ferdig ? "slutt" : "tapt");
        }
      } else if (faseRef.current === "start") {
        sim.s.dist += 160 * dt * motion;
        sim.s.px = Math.sin(t * 0.3) * 0.4;
        sim.s.bank = Math.cos(t * 0.3) * 0.12;
        while (
          sim.s.first < sim.s.ting.length &&
          sim.s.ting[sim.s.first].z <= sim.s.dist
        )
          sim.s.first++;
      }

      shake = Math.max(0, shake - dt);
      nyser = Math.max(0, nyser - dt);
      hopp = Math.max(0, hopp - dt);
      vink = Math.max(0, vink - dt);
      kast = Math.max(0, kast - dt);
      dukk = Math.max(0, dukk - dt);
      rull = Math.max(0, rull - dt);
      const { px, alt, bank, dist } = sim.s;
      if (spiller) gange += dt * (sim.s.fart / e.fart) * 9;

      // Chase camera: behind along the course, looking a little ahead; attract mode orbits.
      const p = tilVerden(px, alt, dist);
      let ønsket: Vec3;
      let target: Vec3;
      if (faseRef.current === "start") {
        const a = t * 0.18 * motion;
        ønsket = [p[0] + Math.sin(a) * 24, p[1] + 7, p[2] + Math.cos(a) * 24];
        target = [p[0], p[1] + 1, p[2]];
      } else {
        // High and a little to the right: a dropped package and its landing
        // mark stay visible below and beside the rig instead of behind it.
        const bak = tilVerden(px, alt, dist - 240);
        ønsket = [bak[0] + 8, p[1] + 14, bak[2]];
        const fram = tilVerden(px, alt, dist + 160);
        target = [fram[0], p[1] + 1.2, fram[2]];
      }
      if (sistDist - dist > 5000) eye = null;
      sistDist = dist;
      if (!eye) eye = ønsket;
      const k = 1 - Math.exp(-8 * dt);
      eye = [
        eye[0] + (ønsket[0] - eye[0]) * k,
        eye[1] + (ønsket[1] - eye[1]) * k,
        eye[2] + (ønsket[2] - eye[2]) * k,
      ];
      const sh = shake * 0.8;
      const kam: Vec3 = sh
        ? [
            eye[0] + (Math.random() - 0.5) * sh,
            eye[1] + (Math.random() - 0.5) * sh,
            eye[2],
          ]
        : eye;

      r.begynn(
        { eye: kam, target, fov: (62 * Math.PI) / 180 },
        {
          topp: farge(e.himmel[0]),
          horisont: farge(e.himmel[1]),
          dis: farge(e.dis),
          nordlys: e.nordlys,
          tåke: e.tåke ? [30, 140] : [150, FJERN],
        },
        LYS,
        t,
      );

      // Valley tiles around the sleigh; tiles behind are freed.
      const zr = dist * SKALA;
      const i0 = Math.floor((zr - 60) / FLIS);
      const i1 = Math.floor((zr + FJERN) / FLIS);
      for (const [i, f] of fliser)
        if (i < i0 - 1 || i > i1 + 1) {
          r.slipp(f);
          fliser.delete(i);
        }
      for (let i = i0; i <= i1; i++) {
        let f = fliser.get(i);
        if (!f) {
          f = lagFlis(i);
          fliser.set(i, f);
        }
        r.tegn(f, IDENT);
      }
      r.tegnMange(M.tre, verden.trær, IDENT);
      for (const h of verden.hus) {
        if (Math.abs(h.zSim - dist) > FJERN_SIM + 300) continue;
        let m = husM.get(h);
        if (!m) {
          m = transform(h.pos, [0, h.rot, 0]);
          husM.set(h, m);
        }
        r.tegn(M.hus[h.variant].mesh, m);
      }

      const ting = sim.s.ting;
      let nRøyk = 0;
      for (let i = Math.max(0, sim.s.first - 4); i < ting.length; i++) {
        const o = ting[i];
        if (o.z > dist + FJERN_SIM) break;
        if (
          o.type === "tre" ||
          o.type === "vind" ||
          (o.treff &&
            o.type !== "varde" &&
            o.type !== "mur" &&
            o.type !== "hus")
        )
          continue;
        // Airborne things the sled has passed would sit between it and the
        // camera: drawn huge across the bottom of the screen, or through the rig.
        if (
          o.z < dist &&
          (o.type === "varde" ||
            o.type === "stjerne" ||
            o.type === "fugl" ||
            o.type === "band")
        )
          continue;
        const pos = tilVerden(o.x, 0, o.z);
        // Locked places are drawn stone grey with a padlock turning above them.
        if (o.låst) {
          r.grå(0.85);
          const topp = tilVerden(o.x, 0, o.z);
          topp[1] = bakke(topp[0], o.z) + 30;
          r.grå(0);
          r.tegn(M.lås, transform(topp, [0, t, 0], 1.6));
          r.grå(0.85);
        }
        if (o.type === "hus") {
          r.tegn(M.hus[husVariant(o.h)].mesh, husPlass(o));
          pos[1] = o.h * SKALA;
          if (o.treff) {
            pos[1] += 3;
            r.tegn(M.stjerne, transform(pos, [0, t * 2, 0]));
          } else {
            if (o.nær) {
              pos[1] += 3;
              r.tegn(M.merkeNær, transform(pos, [0, t, 0]));
              pos[1] -= 3;
            }
            nRøyk = pipeRøyk(RØYK, nRøyk, pos, t * motion, sim.s.vind);
          }
          continue;
        }
        if (o.type === "stjerne") {
          pos[1] = o.h * SKALA;
          r.tegn(M.stjerne, transform(pos, [0, t * 2, 0]));
          continue;
        }
        if (o.type === "fugl") {
          // Hovers and flaps in place; the sim's hit box is where it hangs.
          pos[1] = o.h * SKALA + Math.sin(t * 3 + o.z) * 0.6;
          r.tegn(M.fugl, transform(pos, [0, 0, Math.sin(t * 12) * 0.25]));
          continue;
        }
        if (o.type === "band") {
          pos[1] = o.h * SKALA;
          r.tegn(M.band, transform(pos, [0, 0, Math.sin(t) * 0.1]));
          continue;
        }
        if (o.type === "varde") {
          // Rings hang still in the air, facing the course where it bends; the shadow below reads their height.
          pos[1] = bakke(pos[0], o.z) + 0.15;
          r.tegn(M.ringSkygge, transform(pos));
          pos[1] = o.h * SKALA;
          r.tegn(M.ring, transform(pos, [0, -kursYaw(o.z), 0]));
          continue;
        }
        pos[1] = bakke(pos[0], o.z) - 0.2;
        if (o.type === "topp") r.tegn(M.topp, transform(pos));
        else {
          const s = verden.spesial.get(nøkkel(o));
          if (s) r.tegn(s, transform(pos));
        }
        if (o.låst) r.grå(0);
      }

      // A badly damaged sled throws sparks now and then.
      if (sim.s.skade >= 0.5 && Math.random() < dt * 5)
        gnister.push({ p: tilVerden(px, alt, dist), t0: t });
      // Sparks fan out from a ring for half a second, then are forgotten.
      while (gnister.length && t - gnister[0].t0 > 0.5) gnister.shift();
      for (const g of gnister) {
        const alder = t - g.t0;
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2 + g.t0;
          r.tegn(
            M.prikk,
            transform(
              [
                g.p[0] + Math.cos(a) * alder * 40,
                g.p[1] + Math.sin(a) * alder * 40 - alder * alder * 30,
                g.p[2] - alder * 12,
              ],
              [0, 0, a],
              0.8 * (1 - alder),
            ),
          );
        }
      }

      // A missed chimney answers with a fat grey cloud rising for a second.
      r.tegnRøyk(M.røyk, RØYK, nRøyk, ...RØYK_FADE);
      while (puff.length && t - puff[0].t0 > 1.2) puff.shift();
      let nSky = 0;
      for (const g of puff) nSky = skyRøyk(SKY, nSky, g.p, t - g.t0, 10);
      r.tegnRøyk(M.røyk, SKY, nSky, ...SKY_FADE);

      // Packages: the one in the air, and where the next would land.
      if (sim.s.pakke) {
        const q = sim.s.pakke;
        r.tegn(
          M.pakke,
          transform(tilVerden(q.x, q.alt, q.z), [t * 3, t * 2, 0], 1.6),
        );
      } else if (spiller && harHusRef.current) {
        const bane = forutsiPakke(sim.s, sim.s.gust);
        for (let i = 3; i < bane.length - 1; i += 2) {
          const q = bane[i];
          r.tegn(M.prikk, transform(tilVerden(q.x, q.alt, q.z)));
        }
        const siste = bane[bane.length - 1];
        if (siste) {
          const m = tilVerden(siste.x, 0, siste.z);
          m[1] = bakke(m[0], siste.z) + 0.3;
          r.tegn(M.merke, transform(m));
        }
      }

      // The rig: sleigh, reins and three reindeer with swinging legs.
      const yaw = kursYaw(dist);
      const sk = tilVerden(px, 0, dist);
      sk[1] = bakke(sk[0], dist) + 0.15;
      r.tegn(M.skygge, transform(sk, [0, -yaw, 0]));
      const base = transform(
        p,
        [
          -climb * 0.12,
          -yaw - sim.s.vx * 0.12,
          -bank * 1.1 +
            (rull ? (1 - rull / RULL) * Math.PI * 2 : 0) +
            // A damaged sled wobbles.
            (reduceMotion.current ? 0 : Math.sin(t * 18) * sim.s.skade * 0.15),
        ],
        1,
      );
      // The sleigh swings out behind the reindeer while a turn builds.
      const sledeM = multiply(
        base,
        transform([0, 0, 0], [0, (sim.s.vx - sim.s.slep) * 0.35, 0]),
      );
      r.tegn(M.slede, sledeM);
      // Julius at the reins and Pil with the packages lean, wave, throw and duck.
      for (const [m, mat] of mannskap(sledeM, {
        t: reduceMotion.current ? 0 : t,
        lean: -sim.s.vx,
        vink,
        kast,
        krasj: dukk,
      }))
        r.tegn(m, mat);
      r.tegn(M.tømmer, base);
      for (let i = 0; i < 3; i++) {
        const fase = gange + i * 2.1;
        // Reindeer hop when startled: a near miss, a bird, a crash.
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
        r.tegn(M.rein, rein);
        for (let j = 0; j < 4; j++) {
          const sving = spiller
            ? Math.sin(fase + (j === 0 || j === 3 ? 0 : Math.PI)) * 0.6
            : 0;
          r.tegn(M.bein, multiply(rein, transform(BEIN[j], [sving, 0, 0])));
        }
      }
      // Snowfall as the stage sets it; reduced motion flies in still air.
      if (!reduceMotion.current) r.snø(e.snøfall / 400, t, sim.s.vind);
      r.avslutt();

      // Frame statistics: auto fallback after three seconds over the limit.
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
        tegnKart(sim);
        let ring: number | null = null;
        for (let i = sim.s.first; i < sim.s.ting.length; i++) {
          const o = sim.s.ting[i];
          if (o.z > dist + 1500) break;
          if (o.type === "varde" && !o.låst && !o.treff) {
            ring = o.h;
            break;
          }
        }
        setHud({
          skade: sim.s.skade,
          treff: sim.s.tid - sim.s.sisteSkade < 0.35,
          ring,
          alt,
          fart: sim.s.fart,
          poeng: sim.s.poeng,
          varder: sim.s.varder,
          varderTotalt: sim.s.varderTotalt,
          liv: sim.s.liv,
          kraft: sim.s.kraft,
          sprang: sim.s.tid < sim.s.sprangTil,
          mult: rekkeMult(sim.s.rekke),
          utf: utfordringStatus(utfordringRef.current, sim.s),
          vind: sim.s.vind,
          framdrift: Math.min(1, dist / e.lengde),
          nyser: nyser > 0,
          ned: Math.max(0, Math.ceil(nedtelling.current)),
          pakker: sim.s.pakker,
          neste: harHusRef.current
            ? pakkenavn(brev.current, sim.s.slipp)
            : null,
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
    // Renderer and loop are built once; stage changes are read through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const velg = (e: SledeEtappe) => {
    SoundManager.playSound("click");
    setEtappe(e);
  };

  const b = hud;
  const altPct = b ? (b.alt - ALT_MIN) / (ALT_MAX - ALT_MIN) : 0.4;
  const ringPct =
    b?.ring != null ? (b.ring - ALT_MIN) / (ALT_MAX - ALT_MIN) : null;
  const ringRetning =
    b?.ring == null || Math.abs(b.ring - b.alt) < RING_ALT * 0.6
      ? null
      : b.ring > b.alt
        ? "OPP"
        : "NED";
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
          DRA FOR Å STYRE: SIDELENGS = KURS, OPP/NED = HØYDE
        </div>
      )}

      {/* IQ's panel */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1 left-1 ${panel}`}>
          <div className="text-(--gold) uppercase">{etappe.navn}</div>
          <div>
            RINGER {b?.varder ?? 0}/{b?.varderTotalt ?? 0}
          </div>
          <div className="text-(--cold-blue)">UTFORDRING {b?.utf ?? ""}</div>
          {levering && (
            <div className="text-(--gold)">
              PAKKER {b?.pakker ?? 0}/{levering.mål}
              {b?.neste && fase === "spiller" && (
                <span className="block text-base text-(--neon-green)/80">
                  NESTE: {b.neste}
                </span>
              )}
              {b?.neste && fase === "spiller" && (
                <span className="block text-base text-(--cold-blue)">
                  BREMS = MER TID TIL Å SIKTE
                </span>
              )}
            </div>
          )}
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
              KASTEVIND {(b?.vind ?? 0) < 0 ? "<<" : ">>"}
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
              className="tracking-widest"
              aria-label={`${b?.liv ?? 3} forsøk igjen`}
            >
              LIV {"●".repeat(Math.max(0, Math.min(3, b?.liv ?? 3)))}
              <span className="opacity-30">
                {"●".repeat(3 - Math.max(0, Math.min(3, b?.liv ?? 3)))}
              </span>
            </div>
          )}
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
            {ringPct != null && (
              <div
                className="absolute -inset-x-2 h-1 bg-(--gold)"
                style={{ bottom: `calc(${ringPct * 100}% - 2px)` }}
                aria-hidden
              />
            )}
          </div>
          <div
            className={`text-base h-5 text-(--gold) ${ringRetning ? "animate-pulse" : "invisible"}`}
          >
            {ringRetning === "NED" ? "▼ NED" : "▲ OPP"}
          </div>
          <div className="text-base tabular-nums text-(--neon-green)/80">
            {b ? Math.round(b.alt / 10) : 12} FV
          </div>
        </div>
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
            TRIXTER: {b?.nyser ? "NYSER" : b?.sprang ? "GLØDER" : "I FORM"}
          </div>
          {(b?.gass ?? 0) !== 0 && (
            <div className="text-(--cold-blue)">
              {(b?.gass ?? 0) > 0 ? "FULL FART" : "BREMSER"}
            </div>
          )}
        </div>
        {/* Minimap: the next stretch of course from above, north up */}
        <canvas
          ref={kartRef}
          width={72}
          height={96}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 border-2 border-(--brass)"
          style={{ imageRendering: "pixelated" }}
          aria-label="Kart over løypa"
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
        {(fase === "spiller" || fase === "slutt") && (
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
        {fase === "nedtelling" && (
          <div className="absolute inset-0 flex items-center justify-center text-(--gold) text-7xl">
            {Math.max(1, b?.ned ?? NEDTELLING)}
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
            {
              <button
                type="button"
                aria-label="Slipp pakke"
                className={`${holdKnapp} ${b?.neste ? "border-(--gold) text-(--gold)" : "border-(--brass) text-(--neon-green)/50"} bg-black/60`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  slippRef.current = true;
                }}
              >
                SLIPP
              </button>
            }
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
              aria-label="Fart, og sprang når måleren er full"
              className={`${holdKnapp} rounded-full ${
                (b?.kraft ?? 0) >= 1
                  ? "border-(--gold) bg-(--gold) text-black animate-pulse"
                  : "border-(--brass) bg-black/60 text-(--neon-green)/80"
              }`}
              style={{
                backgroundImage:
                  (b?.kraft ?? 0) < 1
                    ? `conic-gradient(var(--brass) ${(b?.kraft ?? 0) * 360}deg, transparent 0)`
                    : undefined,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.setPointerCapture(e.pointerId);
                touchRef.current.gass = 1;
                sprangRef.current = true;
              }}
              onPointerUp={slippGass}
              onPointerCancel={slippGass}
            >
              {(b?.kraft ?? 0) >= 1 ? "SPRANG" : "FART"}
            </button>
          </div>
          <button
            type="button"
            aria-label="Pause"
            className={`absolute top-1 right-1 ${knapp} border-(--brass) bg-black/70 text-(--neon-green)`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={pauser}
          >
            II
          </button>
        </>
      )}

      {fase !== "spiller" && fase !== "nedtelling" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 p-2 overflow-y-auto">
          <div className="border-2 border-(--brass) bg-black/85 p-2 max-w-lg w-full max-h-full overflow-y-auto text-(--neon-green) space-y-1.5 text-center">
            {fase === "start" && rekorder && (
              <>
                <div className="text-(--gold) text-xl leading-none">
                  REKORDER
                </div>
                <table className="mx-auto text-base leading-tight tabular-nums text-left">
                  <thead>
                    <tr className="opacity-70">
                      <th className="pr-3 font-normal">ETAPPE</th>
                      {[...SPILLERE, "FAMILIEN"].map((n) => (
                        <th key={n} className="px-2 font-normal text-right">
                          {n.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {åpne.map((e) => (
                      <tr key={e.id}>
                        <td className="pr-3">{e.navn}</td>
                        {[...SPILLERE.map((n) => `${n}/${e.id}`), e.id].map(
                          (k) => (
                            <td key={k} className="px-2 text-right">
                              {alle[k] ? (
                                <>
                                  {alle[k].poeng}{" "}
                                  <span className="text-sm">
                                    {bjelletegn(alle[k].bjeller)}
                                  </span>
                                </>
                              ) : (
                                "–"
                              )}
                            </td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={() => setRekorder(false)}
                  className={`${knapp} border-(--gold) text-(--gold) w-full`}
                >
                  TILBAKE
                </button>
              </>
            )}
            {fase === "start" && !rekorder && (
              <>
                <div className="text-(--gold) text-xl leading-none">
                  SLEDEFLUKT
                </div>
                <div className="text-sm opacity-70 leading-none">
                  IQs sledesimulator
                </div>
                <NyttIDag vindu="sledeflukt" />
                <div
                  className={`flex gap-1 justify-center items-center text-lg border-2 p-1 ${spiller ? "border-transparent" : "border-(--gold) animate-pulse"}`}
                >
                  <span className={spiller ? "opacity-70" : "text-(--gold)"}>
                    {spørHvem ? "VELG HVEM SOM FLYR:" : "HVEM FLYR?"}
                  </span>
                  {SPILLERE.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSpiller(n)}
                      className={`min-h-11 min-w-11 px-3 border-2 leading-none cursor-pointer ${n === spiller ? "border-(--gold) bg-(--gold) text-black" : "border-(--neon-green)/50"}`}
                    >
                      {n.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 justify-center">
                  {åpne.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => velg(e)}
                      className={`min-h-11 min-w-11 px-2 border-2 text-base leading-none cursor-pointer ${e.id === etappe.id ? "border-(--gold) bg-(--gold) text-black" : "border-(--neon-green)/50"}`}
                    >
                      {e.navn}
                      {/* Never flown by anyone in the family: new since last time. */}
                      {!alle[e.id] && (
                        <span
                          className={`ml-1 text-sm font-bold ${e.id === etappe.id ? "" : "text-(--gold)"}`}
                        >
                          NY
                        </span>
                      )}
                      <span className="block text-sm tracking-widest">
                        {bjelletegn(beste[e.id]?.bjeller ?? 0)}
                      </span>
                    </button>
                  ))}
                  {/* What is coming, without its name; julenatt stays a surprise. */}
                  {ETAPPER.filter((e) => e.dag > day && e.dag < 24).map((e) => (
                    <span
                      key={e.id}
                      className="min-h-11 px-2 border-2 border-dashed border-(--neon-green)/30 text-(--neon-green)/50 text-base leading-none flex flex-col justify-center"
                    >
                      LÅST
                      <span className="block text-sm">{åpnerTekst(e.dag)}</span>
                    </span>
                  ))}
                </div>
                <div className="text-base leading-tight">«{etappe.intro}»</div>
                <div className="text-sm opacity-80 tabular-nums leading-tight">
                  {SPILLERE.map((n) => {
                    const r = GameEngine.getSledeResultaterFor(n)[etappe.id];
                    return (
                      <span key={n} className="mx-1">
                        {n.toUpperCase()} {r ? r.poeng : "–"}{" "}
                        {bjelletegn(r?.bjeller ?? 0)}
                        {r?.utfordringDag === day ? " ✓ UTFORDRING" : ""}
                      </span>
                    );
                  })}
                </div>
                <div className="text-sm opacity-70 tabular-nums leading-tight">
                  ● {krav[0]} ringer · ●● {krav[1]} · ●●● {krav[2]} og ingen
                  krasj
                </div>
                <div className="border border-(--cold-blue)/60 px-2 py-0.5 text-base leading-tight">
                  <span className="text-(--cold-blue)">
                    DAGENS UTFORDRING:{" "}
                  </span>
                  {utfordring.tekst}
                  <span className="opacity-70">
                    {" "}
                    · +{utfordring.bonus} poeng
                  </span>
                </div>
                {levering && (
                  <div className="border border-(--gold)/60 px-2 py-0.5 text-base leading-tight">
                    <span className="text-(--gold)">LEVERING: </span>
                    {levering.tekst}
                    <span className="opacity-70">
                      {" "}
                      · +{levering.bonus} poeng
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      SoundManager.playSound("click");
                      setAssist((a) => !a);
                    }}
                    title={
                      assist
                        ? "Sleden holder høyden selv og krasjer aldri."
                        : "Tre forsøk, full kastevind."
                    }
                    className={`${knapp} ${assist ? "border-(--cold-blue) text-(--cold-blue)" : "border-(--christmas-red) text-(--christmas-red)"}`}
                  >
                    IQ-ASSISTENT: {assist ? "PÅ" : "AV"}
                  </button>
                  <button
                    type="button"
                    onClick={start}
                    className={`${knapp} border-(--gold) text-(--gold) flex-1`}
                  >
                    START
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      SoundManager.playSound("click");
                      setRekorder(true);
                    }}
                    className={`${knapp} border-(--neon-green)/50`}
                  >
                    REKORDER
                  </button>
                  <button
                    type="button"
                    onClick={onFri}
                    title="Fly fritt over vidda rundt Snøfall, uten mål og klokke."
                    className={`${knapp} border-(--neon-green)/50`}
                  >
                    FRI FLYGING
                  </button>
                </div>
                <div className="text-sm opacity-60 leading-tight">
                  {assist
                    ? "Assistenten holder høyden og krasjer aldri."
                    : "Tre forsøk, full kastevind."}{" "}
                  · PILTASTER / WASD · SHIFT = FART · X = BREMS · E = SPRANG ·
                  MELLOMROM = SLIPP PAKKE
                  {harHus ? " · BREMS GIR TID TIL Å SIKTE" : ""} · ESC = PAUSE
                </div>
              </>
            )}
            {fase === "pause" && (
              <>
                <div className="text-(--gold) text-2xl">PAUSE</div>
                <button
                  type="button"
                  onClick={fortsett}
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
                <div className="text-(--gold) text-xl leading-none">
                  {fase === "slutt"
                    ? `GODKJENT AV IQ!  ${bjelletegn(resultat.bjeller)}`
                    : "IQ KOBLER INN NØDBREMSEN"}
                </div>
                <div className="text-lg tabular-nums leading-tight">
                  POENG {resultat.poeng} ·{" "}
                  {spiller ? `${spiller.toUpperCase()}S ` : ""}BESTE{" "}
                  {resultat.beste}
                </div>
                {(resultat.nyRekord || resultat.nyFamilierekord) && (
                  <div className="text-(--gold) text-2xl leading-none animate-pulse">
                    {resultat.nyFamilierekord
                      ? "NY REKORD! BESTE I FAMILIEN!"
                      : "NY REKORD!"}
                  </div>
                )}
                <Rekordliste
                  etappe={etappe}
                  alle={alle}
                  spiller={spiller}
                  tur={resultat}
                />
                <dl className="grid grid-cols-[auto_auto_auto_auto] gap-x-3 gap-y-0 text-left text-base leading-tight tabular-nums mx-auto w-fit">
                  {(
                    [
                      ["RINGER", `${resultat.varder}/${resultat.varderTotalt}`],
                      ["STJERNER", resultat.stjerner],
                      ["BREVFUGLER", resultat.fugler],
                      [
                        "BESTE REKKE",
                        `${resultat.besteRekke} (x${rekkeMult(resultat.besteRekke)})`,
                      ],
                      ["NÆRE PÅ", resultat.nære],
                      ["TIDSBONUS", `+${resultat.tidsbonus}`],
                      ["KRASJ", resultat.krasj],
                      ...(levering
                        ? ([
                            ["PAKKER", `${resultat.pakker}/${levering.mål}`],
                            ["I SNØEN", resultat.pakkebom],
                          ] as const)
                        : []),
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="opacity-70">{k}</dt>
                      <dd className="text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div
                  className={`text-base leading-tight ${resultat.utfordringKlart ? "text-(--gold)" : "opacity-70"}`}
                >
                  UTFORDRING:{" "}
                  {resultat.utfordringKlart
                    ? `KLART  +${utfordring.bonus}`
                    : fase === "slutt"
                      ? "ikke denne gangen"
                      : "-"}
                </div>
                {levering && (
                  <div
                    className={`text-base leading-tight ${resultat.leveringKlart ? "text-(--gold)" : "opacity-70"}`}
                  >
                    LEVERING:{" "}
                    {resultat.leveringKlart
                      ? `KLART  +${levering.bonus}`
                      : fase === "slutt"
                        ? `${resultat.pakker} av ${levering.mål} pakker`
                        : "-"}
                  </div>
                )}
                <div className="text-base text-(--cold-blue) leading-tight">
                  {fase === "tapt"
                    ? "Trixter trenger en pause og et nytt forsøk."
                    : etappe.id === "julenatt" && resultat.bjeller >= 3
                      ? "Ruten er klar. God jul fra IQ og Trixter!"
                      : nesteBjelle(resultat, krav)}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={start}
                    className={`${knapp} border-(--gold) text-(--gold) flex-1`}
                  >
                    EN GANG TIL
                  </button>
                  <button
                    type="button"
                    onClick={onFri}
                    className={`${knapp} border-(--neon-green)/50`}
                  >
                    FRI FLYGING
                  </button>
                  <button
                    type="button"
                    onClick={() => setFase("start")}
                    className={`${knapp} border-(--neon-green)/50`}
                  >
                    VELG ETAPPE
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const bjelletegn = (n: number) => "●".repeat(n) + "○".repeat(3 - n);

/** The stage's list after a run: each player's best, the family best and this run. */
function Rekordliste({
  etappe,
  alle,
  spiller,
  tur,
}: {
  etappe: SledeEtappe;
  alle: Record<string, { poeng: number; bjeller: number }>;
  spiller: string | null;
  tur: { poeng: number; bjeller: number };
}) {
  const rader: [
    string,
    { poeng: number; bjeller: number } | undefined,
    boolean,
  ][] = [
    ...SPILLERE.map(
      (
        n,
      ): [string, { poeng: number; bjeller: number } | undefined, boolean] => [
        n.toUpperCase(),
        alle[`${n}/${etappe.id}`],
        false,
      ],
    ),
    ["FAMILIEN", alle[etappe.id], false],
    [`DENNE TUREN${spiller ? ` (${spiller.toUpperCase()})` : ""}`, tur, true],
  ];
  return (
    <div className="mx-auto w-fit text-base leading-tight tabular-nums text-left">
      <div className="text-sm opacity-70 text-center">
        REKORDER · {etappe.navn.toUpperCase()}
      </div>
      {rader.map(([navn, r, denne]) => (
        <div
          key={navn}
          className={`flex gap-3 justify-between px-1 ${denne ? "bg-(--gold) text-black" : ""}`}
        >
          <span>{navn}</span>
          <span>{r ? `${r.poeng} ${bjelletegn(r.bjeller)}` : "–"}</span>
        </div>
      ))}
    </div>
  );
}

function nesteBjelle(
  r: { bjeller: number; varder: number; krasj: number },
  krav: number[],
) {
  if (r.bjeller >= 3) return "Alle tre bjeller. IQ bukker!";
  const mangler = krav[r.bjeller] - r.varder;
  if (mangler > 0)
    return `${mangler} ${mangler === 1 ? "ring" : "ringer"} til neste bjelle.`;
  return "Fly uten krasj, så henger den tredje bjellen.";
}

/** The desktop module: IQ's simulator in its own large window from day 8. */
export function Sledeflukt({
  day,
  onClose,
}: {
  day: number;
  onClose: () => void;
}) {
  return (
    <RetroWindow title="SLEDEFLUKT: IQs SLEDESIMULATOR" onClose={onClose} stor>
      <SledefluktSpill day={day} />
    </RetroWindow>
  );
}
