"use client";

import { useEffect, useRef, useState } from "react";
import { RetroWindow } from "@/components/ui/RetroWindow";
import { Icon } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";
import { GameEngine } from "@/lib/game-engine";
import type { EventyrSave } from "@/lib/storage";
import { mediaUrl } from "@/lib/media";
import { SoneEditor } from "./SoneEditor";
import { KAPITLER, kapittel, erLaastOpp, spilldag } from "./kapitler";
import { NyttIDag } from "@/components/ui/NyttIDag";
import * as M from "./motor";
import { Puslespill } from "./Puslespill";
import { Portrett, Skriv, UgleIntro } from "./UgleIntro";
import { Kartplate } from "./Kartplate";
import { Tekst } from "./kobling";
import { getISOString } from "@/lib/date-utils";
import { SPILLERE } from "../snofall-tv/slede";

const DEV =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_TEST_MODE === "true";

// Icons make the verbs readable at a glance.
// Old scene images stay as fallback until the new spill/ stills are generated.
// Hotspots in scenes still showing these fallbacks were checked against the
// fallback; recheck with «Vis soner (dev)» when the new still lands.
const GAMLE_BILDER: Record<string, string> = {
  "spill/iq-verksted.jpg": "feed/iq-verksted.png",
  "spill/julius-kontor.jpg": "feed/julius-kontor.jpg",
  "spill/antenne-tarn.jpg": "feed/antenne-tarn.png",
  "spill/kulde-grotte.jpg": "feed/kulde-grotte.png",
};
// Ugleposten is pixel art (medier.json spill-piksel/*), the photo is the fallback.
const piksel = (bilde: string) =>
  bilde.replace(/^spill\/(.+)\.\w+$/, "spill/piksel/$1.png");

const VERBS: { id: M.Verb; label: string; ikon: string }[] = [
  { id: "se", label: "SE", ikon: "eye" },
  { id: "bruk", label: "BRUK", ikon: "hand" },
  { id: "snakk", label: "SNAKK", ikon: "message" },
];

const BTN =
  "min-h-12 px-3 rounded border-2 text-xl active:scale-95 transition-transform";

// Outdoor stills get snow; indoor ones a warm lamp flicker.
const UTE = [
  "spill/torget.jpg",
  "spill/antenne-tarn.jpg",
  "feed/antenne-tarn.png",
  "spill/port-aapen.jpg",
  "spill/julebodene.jpg",
  "spill/klokketarnet.jpg",
];
const FNUGG = Array.from({ length: 28 }, (_, i) => i);

function Stemning({ bilde }: { bilde: string }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden motion-reduce:hidden"
    >
      {UTE.includes(bilde) ? (
        FNUGG.map((i) => (
          <span
            key={i}
            className="absolute -top-2 rounded-full bg-white/80"
            style={
              {
                left: `${(i * 37) % 100}%`,
                width: 2 + (i % 3),
                height: 2 + (i % 3),
                "--x-mid": `${(i % 2 ? 1 : -1) * 12}px`,
                "--x-end": `${(i % 2 ? -1 : 1) * 8}px`,
                animation: `snowfall ${7 + (i % 5)}s linear ${-i * 0.8}s infinite`,
              } as React.CSSProperties
            }
          />
        ))
      ) : (
        <div
          className="absolute inset-0 mix-blend-screen"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(255,180,80,0.18), transparent 60%)",
            animation: "flicker 2.5s ease-in-out infinite alternate",
          }}
        />
      )}
    </div>
  );
}

/** Item icon: 32×32 pixel PNG (spill/piksel/ikon/<id>.png), pixelarticons glyph until it exists. */
function GjenstandIkon({
  g,
  size,
  dempet,
}: {
  g: M.Gjenstand;
  size: number;
  dempet?: boolean;
}) {
  const [mangler, setMangler] = useState(false);
  if (mangler)
    return <Icon name={g.ikon} size={size} color={dempet ? "gray" : "gold"} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl(`spill/piksel/ikon/${g.id}.png`)}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className="pixelated pointer-events-none"
      onError={() => setMangler(true)}
    />
  );
}

// Blocky stand-in (8×8) for a sprite that is not drawn yet: visible, clearly a placeholder.
const SILHUETT = [
  "..XXXX..",
  ".XXXXXX.",
  ".XXXXXX.",
  "..XXXX..",
  ".XXXXXX.",
  "XXXXXXXX",
  "XXXXXXXX",
  ".XX..XX.",
];

/** A person or thing the still lacks, drawn in its hotspot's rect, feet on the bottom edge. */
function Figur({ id, rect }: { id: string; rect: M.Rect }) {
  const [mangler, setMangler] = useState(false);
  return (
    <div
      aria-hidden
      data-figur={id}
      className="absolute pointer-events-none flex items-end justify-center"
      style={{
        left: `${rect.x}%`,
        top: `${rect.y}%`,
        width: `${rect.w}%`,
        height: `${rect.h}%`,
      }}
    >
      {mangler ? (
        <svg
          viewBox="0 0 8 8"
          className="h-full max-w-full opacity-70"
          shapeRendering="crispEdges"
        >
          {SILHUETT.flatMap((rad, y) =>
            [...rad].map((c, x) =>
              c === "X" ? (
                <rect
                  key={`${x}-${y}`}
                  x={x}
                  y={y}
                  width={1}
                  height={1}
                  fill="#1b2433"
                  stroke="#c9a227"
                  strokeWidth={0.06}
                />
              ) : null,
            ),
          )}
        </svg>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(`spill/piksel/figur/${id}.png`)}
          alt=""
          draggable={false}
          className="max-w-full max-h-full object-contain object-bottom pixelated"
          onError={() => setMangler(true)}
        />
      )}
    </div>
  );
}

// The soft lock shows for this long after the other screen's last action.
const LAAS_MS = 2 * 60_000;

/** Cheap feedback on iPad: transform/opacity only, via the Web Animations API. */
function animer(el: Element | null | undefined, frames: Keyframe[], ms = 350) {
  el?.animate?.(frames, { duration: ms, easing: "ease-out" });
}

export function Nissespill({ onClose }: { onClose: () => void }) {
  const [save, setSave] = useState<EventyrSave | null>(null);
  const [meny, setMeny] = useState(true);
  const [verb, setVerb] = useState<M.Verb | null>(null);
  const [holder, setHolder] = useState<string | null>(null);
  const [tekst, setTekst] = useState("");
  // Caption over the text: what was tapped (iPad has no hover label)
  const [emne, setEmne] = useState<{
    navn: string;
    ikon?: string;
    id?: string;
  } | null>(null);
  // `sagt` is the line the kids just chose, shown above the answer
  const [dialog, setDialog] = useState<{
    id: string;
    node: string;
    sagt?: string;
  } | null>(null);
  const [puslespill, setPuslespill] = useState<string | null>(null);
  const [notat, setNotat] = useState(false);
  // MENY «Se introen igjen» replays the chapter opener
  const [introIgjen, setIntroIgjen] = useState(false);
  const [visSoner, setVisSoner] = useState(false);
  const [valg, setValg] = useState(false);
  // A tap on empty scene briefly outlines the hotspots (no pixel-hunting on iPad).
  const [hint, setHint] = useState(false);
  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(false), 1500);
    return () => clearTimeout(t);
  }, [hint]);
  // Autosave is silent; a short «LAGRET» after progress tells the kids it stuck
  const [lagret, setLagret] = useState(false);
  useEffect(() => {
    if (!lagret) return;
    const t = setTimeout(() => setLagret(false), 1200);
    return () => clearTimeout(t);
  }, [lagret]);
  const sceneRef = useRef<HTMLDivElement>(null);
  // Set when a pocket item was dropped on a hotspot, so the slot's click does not also fire
  const dratt = useRef(false);
  const lommeRef = useRef<HTMLDivElement>(null);
  const [ring, setRing] = useState<{ n: number; x: number; y: number } | null>(
    null,
  );
  const [glimt, setGlimt] = useState<{
    n: number;
    x: number;
    y: number;
  } | null>(null);
  const [bildeFeil, setBildeFeil] = useState<string[]>([]);

  // The pickup card shows first; the slot flies in once it is dismissed.
  const [plukk, setPlukk] = useState<string | null>(null);
  // Rampenissen's panel: what he said on opening, plus the hint asked for there.
  const [rp, setRp] = useState<{
    nytt: string[];
    tips?: string;
    igjen?: boolean;
  } | null>(null);
  // One shared story save (decision 2026-11-11). `lastet` is the object read from
  // storage, so loading or adopting it never writes back and never takes the lock.
  const lastet = useRef<EventyrSave | null>(null);
  const skrevet = useRef("");
  const idag = getISOString().slice(0, 10);
  const [nyDag, setNyDag] = useState(false);
  // «<navn> spiller nå»: another screen acted within LAAS_MS
  const [annen, setAnnen] = useState<string | null>(null);
  const [spiller, setSpiller] = useState<string | null>(null);
  const [bekreft, setBekreft] = useState<number | null>(null);
  const annenSkjerm = (s: EventyrSave | null) =>
    s?.skjerm &&
    s.skjerm.id !== GameEngine.getSkjermId() &&
    // Wall clock on purpose: the lock compares real time across screens, not the mocked day
    Date.now() - s.skjerm.tid < LAAS_MS
      ? s.skjerm.navn
      : null;

  // Storage is browser-only: load after mount, persist every change.
  useEffect(() => {
    const s = GameEngine.getEventyrSave();
    lastet.current = s;
    skrevet.current = JSON.stringify(s);
    /* eslint-disable react-hooks/set-state-in-effect -- initial load */
    setSave(s);
    setSpiller(GameEngine.getSledeSpiller());
    setAnnen(annenSkjerm(s));
    if (s && !s.flags.includes(kapittel(s.kapittel).slutt)) {
      setMeny(false);
      const kap = kapittel(s.kapittel);
      // Coming back on another day: a recap from Rampenissen, and an overnight hint ready
      if (s.sist && s.sist !== idag && s.flags.includes(`k${kap.n}_intro`)) {
        setNyDag(true);
        setRp({ nytt: [M.gjenoppta(kap, s)], igjen: true });
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once on mount
  }, []);
  useEffect(() => {
    if (!save || save === lastet.current) return;
    const ut = {
      ...save,
      sist: idag,
      skjerm: {
        id: GameEngine.getSkjermId(),
        navn: spiller ?? "",
        tid: Date.now(),
      },
    };
    skrevet.current = JSON.stringify(ut);
    GameEngine.saveEventyr(ut);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- write on save changes only
  }, [save]);

  const dag = spilldag();

  // Adopt what the other screen saved (sync pulls land in storage every 30 s),
  // but never in the middle of a dialog, puzzle or pickup card.
  const opptatt = !!(dialog || puslespill || plukk);
  useEffect(() => {
    const sjekk = () => {
      if (opptatt) return;
      const s = GameEngine.getEventyrSave();
      const json = JSON.stringify(s);
      if (!s || json === skrevet.current) return;
      skrevet.current = json;
      if (s.skjerm?.id === GameEngine.getSkjermId()) return;
      lastet.current = s;
      setSave(s);
      setTekst("");
      setHolder(null);
      setAnnen(annenSkjerm(s));
    };
    const t = setInterval(sjekk, 3000);
    document.addEventListener("visibilitychange", sjekk);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", sjekk);
    };
  }, [opptatt]);
  const flyInn = (id: string) =>
    setTimeout(() =>
      animer(
        lommeRef.current?.querySelector(`[data-gjenstand="${id}"]`),
        [
          { transform: "translateY(-45vh) scale(2.5)", opacity: 0 },
          { transform: "translateY(0) scale(1)", opacity: 1 },
        ],
        600,
      ),
    );
  const lukkPlukk = () => {
    if (plukk) flyInn(plukk);
    setPlukk(null);
  };
  /** Marks new items and opens the card for the first one. */
  const medNye = (foer: EventyrSave, etter: EventyrSave) => {
    const { save: s, nye } = M.merkNye(foer, etter);
    if (nye[0] && kapittel(etter.kapittel).gjenstander[nye[0]]) {
      setPlukk(nye[0]);
      [0, 120, 240].forEach((ms, i) =>
        setTimeout(
          () => SoundManager.playSound(i === 2 ? "success" : "type"),
          ms,
        ),
      );
    }
    return s;
  };

  const bruk = (u: M.Utfall, om?: { navn: string; ikon?: string }) => {
    if (save) {
      let s = medNye(save, u.save);
      if (holder) s = M.sett(s, holder);
      if (u.dialog)
        s = M.merkReplikk(kapittel(s.kapittel), s, u.dialog, "start");
      if (u.lyd === "error") s = M.medFeil(kapittel(s.kapittel), s);
      // A new room starts with a clean panel, not the last room's line
      if (s.sceneId !== save.sceneId) {
        setTekst("");
        setEmne(null);
      }
      u = { ...u, save: s };
    }
    if (u.lyd === "error")
      animer(sceneRef.current, [
        { transform: "translateX(0)" },
        { transform: "translateX(-8px)" },
        { transform: "translateX(8px)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(0)" },
      ]);
    setSave(u.save);
    if (u.tekst !== undefined) {
      setTekst(u.tekst);
      setEmne(om ?? null);
    }
    if (u.dialog) setDialog({ id: u.dialog, node: "start" });
    if (u.puslespill) setPuslespill(u.puslespill);
    if (u.lyd) SoundManager.playSound(u.lyd);
    if (u.lyd === "success") setLagret(true);
    setVerb(null);
    setHolder(null);
  };

  /** Switch (parks the chapter in play) or, with `paaNytt`, restart from scratch. */
  const startKapittel = (n: number, paaNytt = false) => {
    SoundManager.playSound("open");
    const k = kapittel(n);
    const ny =
      paaNytt || !save ? M.nyttKapittel(k, save) : M.byttKapittel(k, save);
    // The opener plays once per chapter; a replay goes straight to the scene
    setSave(
      GameEngine.isIntroSeen(`ugle-k${n}`) ? M.medFlagg(ny, `k${n}_intro`) : ny,
    );
    setTekst("");
    setDialog(null);
    setHolder(null);
    setBekreft(null);
    setMeny(false);
  };

  const bekreftBoks = bekreft !== null && (
    <div
      role="alertdialog"
      aria-label="Starte på nytt?"
      className="absolute inset-0 z-40 bg-black/85 flex items-center justify-center p-3"
    >
      <div className="max-w-md border-4 border-(--gold) bg-black p-4 space-y-3 text-center">
        <p className="text-2xl text-(--gold)">
          Starte kapittel {bekreft} på nytt?
        </p>
        <p className="text-xl">
          Alt i dette kapittelet nullstilles: lomma, stedene og det dere har
          gjort. Uglefjærene beholder dere.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            className={`${BTN} border-(--gold) text-(--gold)`}
            onClick={() => startKapittel(bekreft, true)}
          >
            Ja, på nytt
          </button>
          <button
            type="button"
            className={`${BTN} border-(--brass)`}
            onClick={() => setBekreft(null)}
          >
            Nei
          </button>
        </div>
      </div>
    </div>
  );

  if (meny || !save) {
    return (
      <RetroWindow title="UGLEPOSTEN" onClose={onClose}>
        <div className="relative p-4 md:p-6 max-w-2xl mx-auto space-y-4">
          {bekreftBoks}
          <h2 className="text-3xl text-(--gold) tracking-wider">UGLEPOSTEN</h2>
          <p className="text-xl leading-tight">
            Rampenissen har glemt noe i Snøfall. Styr Floke, ull-ugla hans,
            gjennom IQs kameraer og hjelp ham, ett kapittel om gangen. Trykk på
            ting for å SE, BRUK og SNAKK.
          </p>
          <NyttIDag vindu="nissespill" />
          {/* Per screen, shared with SLEDEFLUKT: the other screen sees who is playing */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">Hvem spiller her?</span>
            {SPILLERE.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={spiller === n}
                className={`${BTN} ${spiller === n ? "bg-(--gold) text-black border-(--gold)" : "border-(--brass)"}`}
                onClick={() => {
                  GameEngine.setSledeSpiller(n);
                  setSpiller(n);
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <Kartplate dag={dag} save={save} />
          <ul className="space-y-2">
            {KAPITLER.map((k) => {
              const laast = !erLaastOpp(k, dag);
              const aapen = !laast && k.klar;
              const ferdig = M.erFullfort(save, k);
              const paagaar = M.erPaabegynt(save, k);
              const iSpill = paagaar && save?.kapittel === k.n;
              return (
                <li
                  key={k.n}
                  className={`flex items-center gap-3 border-2 px-3 py-2 ${laast ? "border-(--brass)/40 text-gray-400" : "border-(--brass)"}`}
                >
                  {laast && <Icon name="lock" size={28} color="gray" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl truncate">
                      Kapittel {k.n}: {k.tittel}
                    </div>
                    <div
                      className={`text-base ${laast ? "text-gray-500" : "text-(--cold-blue)"}`}
                    >
                      {ferdig && save
                        ? `Fullført · ${M.oppsummering(k, save).kort}`
                        : laast
                          ? `ÅPNER DAG ${k.dag}`
                          : !k.klar
                            ? "Under arbeid i Snøfall"
                            : paagaar
                              ? iSpill
                                ? "Påbegynt"
                                : "Påbegynt · på pause"
                              : "Klar"}
                    </div>
                    {laast && (
                      <div className="text-lg italic text-gray-400 leading-tight">
                        {k.teaser}
                      </div>
                    )}
                  </div>
                  {aapen && (
                    <button
                      type="button"
                      className={`${BTN} border-(--gold) text-(--gold)`}
                      onClick={() =>
                        iSpill
                          ? setMeny(false)
                          : ferdig
                            ? setBekreft(k.n)
                            : startKapittel(k.n)
                      }
                    >
                      {paagaar ? "FORTSETT" : ferdig ? "SPILL IGJEN" : "SPILL"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </RetroWindow>
    );
  }

  const kap = kapittel(save.kapittel);
  const scene = M.scene(kap, save);
  const hotspots = M.synlige(scene, save);
  const bildeSrc = [
    mediaUrl(piksel(scene.bilde)),
    mediaUrl(scene.bilde),
    ...(GAMLE_BILDER[scene.bilde] ? [mediaUrl(GAMLE_BILDER[scene.bilde])] : []),
    "/village-day.jpg",
  ].find((u) => !bildeFeil.includes(u));
  const introFlagg = `k${kap.n}_intro`;
  const utroFlagg = `k${kap.n}_utro`;
  const iIntro = !M.has(save, introFlagg);
  const iUtro = M.has(save, kap.slutt) && !M.has(save, utroFlagg);
  const node = dialog ? kap.dialoger[dialog.id].noder[dialog.node] : null;
  const taler = dialog ? kap.dialoger[dialog.id] : null;

  const tapItem = (id: string) => {
    const g = kap.gjenstander[id];
    if (verb === "se") {
      setSave(M.sett(save, id));
      setTekst(g.se);
      setEmne(g);
      setVerb(null);
      return;
    }
    if (verb === "snakk") {
      setTekst(`Du snakker til ${g.navn.toLowerCase()}. Den svarer ikke.`);
      setEmne(g);
      setVerb(null);
      return;
    }
    setVerb(null);
    if (holder && holder !== id)
      bruk(M.kombiner(kap, save, holder, id), {
        navn: `${kap.gjenstander[holder].navn} + ${g.navn}`,
      });
    else setHolder(holder === id ? null : id);
  };

  const tapValg = (v: M.Valg) => {
    SoundManager.playSound("click");
    let s = medNye(save, M.velgSvar(save, v, dialog?.id));
    if (v.neste && dialog) s = M.merkReplikk(kap, s, dialog.id, v.neste);
    setSave(s);
    setDialog(
      v.neste && dialog
        ? { id: dialog.id, node: v.neste, sagt: v.tekst }
        : null,
    );
  };

  const holdt = holder ? kap.gjenstander[holder] : null;
  // Outlines stay on while an item is held, so the kids see what it can go on
  const visKanter = hint || !!holder;
  const status = holder
    ? `BRUK ${holdt?.navn ?? holder} PÅ …`
    : verb
      ? `${VERBS.find((x) => x.id === verb)?.label} hva?`
      : scene.navn;

  const valgListe = node ? M.valgSomVises(node, save) : [];
  const PANEL =
    "w-full overflow-y-auto border-t-2 border-(--brass) px-3 py-2 landscape:absolute landscape:inset-x-0 landscape:bottom-0 landscape:max-h-[45%] landscape:bg-black/70 portrait:bg-black portrait:max-h-[35dvh]";
  const LITEN =
    "min-h-11 px-2 rounded border-2 text-lg active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--gold)";
  const MENYPUNKT =
    "min-h-11 px-3 text-left text-lg hover:text-(--gold) focus-visible:text-(--gold) focus-visible:outline-none";

  return (
    <RetroWindow title={`UGLEPOSTEN: KAPITTEL ${kap.n}`} onClose={onClose} stor>
      <div
        className="h-full flex flex-col select-none"
        style={{
          touchAction: "manipulation",
          WebkitTouchCallout: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Size container: the 16:9 stage is as large as fits, so percent hotspots stay on the image */}
        <div className="bg-black">
          {/* Landscape: panels overlay the lower part of the scene. Portrait: they sit below it */}
          <div className="relative w-full">
            <div
              ref={sceneRef}
              className="relative aspect-video w-full shrink-0 overflow-hidden"
              onClick={(e) => {
                if (
                  e.target === e.currentTarget ||
                  e.target instanceof HTMLImageElement
                ) {
                  setHint(true);
                  if (holdt) {
                    setTekst(
                      `Trykk på noe i bildet, eller ✕ for å legge ${holdt.navn.toLowerCase()} tilbake.`,
                    );
                    setEmne(null);
                  }
                }
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={scene.bilde}
                style={{ animation: "fadeIn 0.5s ease-out" }}
                src={bildeSrc}
                alt={scene.navn}
                draggable={false}
                // Fill, not cover: hotspot percents are of the image, so the image
                // must span the 16:9 stage exactly (stills are 16:9 ±1 %).
                className={`absolute inset-0 w-full h-full object-fill ${bildeSrc === mediaUrl(piksel(scene.bilde)) ? "pixelated" : ""}`}
                onError={(e) => {
                  // Read src now: React clears currentTarget before the updater runs
                  const src = e.currentTarget.getAttribute("src") ?? "";
                  setBildeFeil((f) => [...f, src]);
                }}
              />
              <Stemning bilde={scene.bilde} />
              {!visSoner &&
                hotspots.map(
                  (h) =>
                    h.figur && <Figur key={h.id} id={h.figur} rect={h.rect} />,
                )}
              {visSoner && <SoneEditor key={scene.id} scene={scene} />}
              {!visSoner &&
                !iIntro &&
                !iUtro &&
                !dialog &&
                hotspots.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    data-hotspot={h.id}
                    aria-label={h.navn}
                    onClick={() => {
                      setRing({
                        n: (ring?.n ?? 0) + 1,
                        x: h.rect.x + h.rect.w / 2,
                        y: h.rect.y + h.rect.h / 2,
                      });
                      bruk(M.trykk(kap, save, h, verb, holder), h);
                    }}
                    className={`group absolute rounded min-w-11 min-h-11 ${visKanter ? "border-2 border-dashed border-(--gold)" : "hover:border-2 hover:border-dashed hover:border-(--gold)/60"} active:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--gold) focus-visible:bg-white/20`}
                    style={{
                      left: `${h.rect.x}%`,
                      top: `${h.rect.y}%`,
                      width: `${h.rect.w}%`,
                      height: `${h.rect.h}%`,
                    }}
                  >
                    <span className="absolute left-1/2 -top-8 -translate-x-1/2 whitespace-nowrap px-2 bg-black/80 text-base text-(--neon-green) opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {h.navn}
                    </span>
                  </button>
                ))}
              {!visSoner &&
                !iIntro &&
                !iUtro &&
                !dialog &&
                scene.fjaer &&
                !M.harFjaer(kap, save, scene.id) && (
                  <button
                    type="button"
                    aria-label="Noe lite"
                    onClick={() => {
                      const f = scene.fjaer!;
                      const u = M.taFjaer(kap, save, scene.id, verb);
                      if (u.lyd === "success")
                        setGlimt({
                          n: (glimt?.n ?? 0) + 1,
                          x: f.x + f.w / 2,
                          y: f.y + f.h / 2,
                        });
                      bruk(u);
                    }}
                    className="absolute min-w-11 min-h-11 -translate-x-1/2 -translate-y-1/2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--gold)"
                    style={{
                      left: `${scene.fjaer.x + scene.fjaer.w / 2}%`,
                      top: `${scene.fjaer.y + scene.fjaer.h / 2}%`,
                      width: `${scene.fjaer.w}%`,
                      height: `${scene.fjaer.h}%`,
                    }}
                  />
                )}
              {glimt && (
                <span
                  key={`g${glimt.n}`}
                  aria-hidden
                  className="absolute w-8 h-8 -ml-4 -mt-4 rotate-45 border-2 border-(--gold) pointer-events-none motion-reduce:hidden"
                  style={{
                    left: `${glimt.x}%`,
                    top: `${glimt.y}%`,
                    animation: "ug-ring 0.8s ease-out forwards",
                  }}
                />
              )}
              {lagret && (
                <span
                  className="absolute bottom-2 right-2 px-2 bg-black/70 border border-(--neon-green) text-base text-(--neon-green) tracking-wider pointer-events-none"
                  style={{ animation: "fadeIn 0.3s ease-out" }}
                >
                  LAGRET
                </span>
              )}
              {ring && (
                <span
                  key={ring.n}
                  className="absolute w-20 h-20 -ml-10 -mt-10 rounded-full border-4 border-(--gold) pointer-events-none"
                  style={{
                    left: `${ring.x}%`,
                    top: `${ring.y}%`,
                    animation: "ug-ring 0.5s ease-out forwards",
                  }}
                />
              )}

              {holdt ? (
                <div className="absolute top-2 left-2 z-10 flex items-center gap-2 pl-2 bg-black/85 border-2 border-(--gold) text-xl text-(--gold) tracking-wider">
                  <GjenstandIkon g={holdt} size={32} />
                  <span className="motion-safe:animate-pulse">{status}</span>
                  <button
                    type="button"
                    aria-label={`Legg ${holdt.navn.toLowerCase()} tilbake`}
                    onClick={() => setHolder(null)}
                    className="min-w-11 min-h-11 border-l-2 border-(--gold) text-2xl"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  className={`absolute top-2 left-2 px-2 bg-black/70 text-base tracking-wider pointer-events-none ${verb ? "text-(--gold) border border-(--gold) animate-pulse" : "text-(--cold-blue) uppercase"}`}
                >
                  {status}
                </div>
              )}

              {!visSoner &&
                !iIntro &&
                !iUtro &&
                !dialog &&
                scene.utganger.map((u) =>
                  u.rect ? (
                    <button
                      key={u.til}
                      type="button"
                      aria-label={u.navn}
                      onClick={() => bruk(M.gaa(save, u.til))}
                      className={`group absolute rounded min-w-11 min-h-11 cursor-alias ${visKanter ? "border-2 border-dashed border-(--cold-blue)" : "hover:border-2 hover:border-dashed hover:border-(--cold-blue)/70"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--cold-blue)`}
                      style={{
                        left: `${u.rect.x}%`,
                        top: `${u.rect.y}%`,
                        width: `${u.rect.w}%`,
                        height: `${u.rect.h}%`,
                      }}
                    >
                      <span
                        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap px-2 bg-black/80 border border-(--cold-blue) text-base text-(--cold-blue) pointer-events-none transition-opacity ${visKanter ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}
                      >
                        → {u.navn}
                      </span>
                    </button>
                  ) : (
                    <button
                      key={u.til}
                      type="button"
                      onClick={() => bruk(M.gaa(save, u.til))}
                      className={`${LITEN} absolute top-2 right-2 bg-black/70 border-(--cold-blue) text-(--cold-blue)`}
                    >
                      → {u.navn}
                    </button>
                  ),
                )}
            </div>
            {bekreftBoks}
            {annen !== null && (
              <div
                role="alertdialog"
                aria-label="Spiller på en annen skjerm"
                className="absolute inset-0 z-40 bg-black/85 flex items-center justify-center p-3"
              >
                <div className="max-w-md border-4 border-(--cold-blue) bg-black p-4 space-y-3 text-center">
                  <p className="text-2xl text-(--cold-blue)">
                    {annen ? `${annen} spiller nå` : "Noen spiller nå"}
                  </p>
                  <p className="text-xl">
                    På en annen skjerm. Bli med der, eller ta over her. Dere
                    deler samme eventyr.
                  </p>
                  <button
                    type="button"
                    className={`${BTN} border-(--gold) text-(--gold)`}
                    onClick={() => setAnnen(null)}
                  >
                    TA OVER
                  </button>
                </div>
              </div>
            )}
            {puslespill && kap.puslespill?.[puslespill] && (
              <Puslespill
                key={puslespill}
                p={kap.puslespill[puslespill]}
                onAvbryt={() => setPuslespill(null)}
                onLost={() => {
                  setPuslespill(null);
                  bruk(M.losPuslespill(kap, save, puslespill));
                }}
                onTips={() => {
                  const u = M.tips(
                    kap,
                    save,
                    kap.puslespill?.[puslespill]?.flagg,
                  );
                  setSave(u.save);
                  SoundManager.playSound("click");
                  return { tekst: u.tekst ?? "", siste: u.siste };
                }}
              />
            )}
            {plukk && kap.gjenstander[plukk] && (
              <div
                role="dialog"
                aria-label={`Funnet: ${kap.gjenstander[plukk].navn}`}
                tabIndex={-1}
                autoFocus
                onClick={lukkPlukk}
                onKeyDown={(e) => {
                  if (["Enter", " ", "Escape"].includes(e.key)) {
                    e.preventDefault();
                    lukkPlukk();
                  }
                }}
                className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-3 cursor-pointer focus:outline-none"
                style={{ animation: "fadeIn 0.2s ease-out" }}
              >
                <div className="max-w-md w-full border-4 border-(--gold) bg-black p-4 flex flex-col items-center gap-2 text-center [image-rendering:pixelated]">
                  <p className="text-lg text-(--cold-blue) tracking-widest">
                    FUNNET!
                  </p>
                  <div className="w-28 h-28 border-2 border-(--brass) flex items-center justify-center motion-safe:animate-pulse">
                    <GjenstandIkon g={kap.gjenstander[plukk]} size={96} />
                  </div>
                  <h3 className="text-3xl text-(--gold) tracking-wider">
                    {kap.gjenstander[plukk].navn}
                  </h3>
                  <p className="text-xl text-(--neon-green) leading-tight">
                    {M.funnetTekst(kap.gjenstander[plukk])}
                  </p>
                  {M.visBrukHint(save) && (
                    <p className="text-xl text-(--cold-blue) leading-tight">
                      Trykk på den i lomma, så på det du vil bruke den på.
                    </p>
                  )}
                  <button
                    type="button"
                    className={`${LITEN} border-(--gold) text-(--gold)`}
                  >
                    Legg i lomma
                  </button>
                </div>
              </div>
            )}
            {rp && (
              <div
                role="dialog"
                aria-label="Rampenissen"
                className={`${PANEL} z-20 flex items-start gap-3`}
              >
                <Portrett navn="rampenissen" />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-lg text-(--gold)">
                    Rampenissen (hvisker fra hylla)
                  </p>
                  {rp.nytt.map((t) => (
                    <p key={t} className="text-xl leading-tight">
                      {t}
                    </p>
                  ))}
                  {rp.nytt.length === 0 && !rp.tips && (
                    <p className="text-xl leading-tight">
                      «Æ e her. Treng du et tips, bare spør.»
                    </p>
                  )}
                  {rp.tips && (
                    <p className="text-xl leading-tight text-(--cold-blue)">
                      {rp.tips}
                    </p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className={`${LITEN} border-(--gold) text-(--gold)`}
                      onClick={() => {
                        const u = M.tips(kap, save);
                        SoundManager.playSound("click");
                        setSave(u.save);
                        setRp({ nytt: [], tips: u.tekst });
                      }}
                    >
                      TIPS
                    </button>
                    {rp.igjen && (
                      <button
                        type="button"
                        className={`${LITEN} border-(--cold-blue) text-(--cold-blue)`}
                        onClick={() => {
                          setRp(null);
                          setIntroIgjen(true);
                        }}
                      >
                        Se introen igjen
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${LITEN} border-(--brass)`}
                      onClick={() => setRp(null)}
                    >
                      Lukk
                    </button>
                  </div>
                </div>
              </div>
            )}
            {notat && (
              <div
                role="dialog"
                aria-label="Notatbok"
                className="absolute inset-0 z-20 bg-black/90 overflow-y-auto p-3 flex flex-col gap-2"
                style={{ animation: "fadeIn 0.3s ease-out" }}
              >
                <div className="flex items-center gap-2 border-b-2 border-(--brass) pb-2">
                  <h3 className="flex-1 text-2xl text-(--gold) tracking-wider uppercase">
                    Hva gjør vi nå?
                  </h3>
                  <button
                    type="button"
                    aria-label="Lukk notatboka"
                    className={`${LITEN} border-(--brass)`}
                    onClick={() => setNotat(false)}
                  >
                    Lukk
                  </button>
                </div>
                <ul className="flex-1 space-y-1 text-xl leading-tight">
                  {M.notater(kap, save).map((n) => (
                    <li
                      key={n.tekst}
                      className={
                        n.gjort
                          ? "line-through opacity-60"
                          : "text-(--neon-green)"
                      }
                    >
                      {n.gjort ? "✓ " : "› "}
                      {n.tekst}
                    </li>
                  ))}
                  {save.inventory.some((i) => M.erNy(save, i)) && (
                    <li className="text-(--cold-blue)">
                      Kanskje nyttig:{" "}
                      {save.inventory
                        .filter((i) => M.erNy(save, i) && kap.gjenstander[i])
                        .map((i) => kap.gjenstander[i].navn)
                        .join(", ")}
                    </li>
                  )}
                  {M.has(save, kap.slutt) && (
                    <li className="text-(--gold)">Kapittelet er ferdig.</li>
                  )}
                </ul>
                {M.fjaerTelling(kap, save)[1] > 0 && (
                  <p className="text-lg text-(--cold-blue)">
                    Uglefjær funnet: {M.fjaerTelling(kap, save).join("/")}
                  </p>
                )}
              </div>
            )}
            {(iIntro || introIgjen) && (
              <UgleIntro
                key={`${kap.n}-${introIgjen}`}
                kap={kap}
                bilde={bildeSrc}
                sceneNavn={scene.navn}
                onDone={() => {
                  GameEngine.markIntroSeen(`ugle-k${kap.n}`);
                  setIntroIgjen(false);
                  if (iIntro) setSave(M.medFlagg(save, introFlagg));
                }}
              />
            )}
            {iUtro && (
              <div className={`${PANEL} flex items-start gap-3`}>
                <Portrett navn="rampenissen" />
                <div className="flex-1 min-w-0">
                  <p className="text-lg text-(--gold)">Rampenissen</p>
                  <p className="text-xl leading-tight">
                    <Skriv key={kap.utro} tekst={kap.utro} />
                  </p>
                  <div className="mt-2 border-2 border-(--gold) px-3 py-2 space-y-1">
                    <p className="text-2xl text-(--gold) tracking-wider">
                      KAPITTEL {kap.n} FULLFØRT
                    </p>
                    <p className="text-lg text-(--cold-blue)">
                      {M.oppsummering(kap, save).kort}
                    </p>
                    <p className="text-lg">{M.oppsummering(kap, save).linje}</p>
                  </div>
                  <button
                    type="button"
                    className={`${MENYPUNKT} text-(--gold)`}
                    onClick={() => {
                      SoundManager.playSound("click");
                      setSave(M.medFlagg(save, utroFlagg));
                      setMeny(true);
                    }}
                  >
                    TIL KAPITLENE
                  </button>
                </div>
              </div>
            )}

            {dialog && node && taler && (
              <div className={`${PANEL} space-y-2`}>
                {dialog.sagt && (
                  <div className="flex items-start gap-3">
                    <Portrett navn="floke" />
                    <div className="min-w-0">
                      <p className="text-lg text-(--cold-blue)">
                        Dere (gjennom Floke)
                      </p>
                      <p className="text-xl leading-tight">«{dialog.sagt}»</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Portrett key={taler.portrett} navn={taler.portrett} />
                  <div className="min-w-0">
                    <p className="text-lg text-(--gold)">{taler.taler}</p>
                    <p className="text-xl leading-tight">
                      <Tekst
                        key={dialog.node}
                        tekst={M.velg(node.tekst, save)}
                      />
                    </p>
                  </div>
                </div>
                <div className="grid landscape:grid-cols-2 gap-x-4 border-t border-(--brass)/50 pt-1">
                  {valgListe.map((v) => (
                    <button
                      key={v.tekst}
                      type="button"
                      className={`${MENYPUNKT} ${M.erSpurt(save, dialog.id, v) ? "opacity-50" : ""}`}
                      onClick={() => tapValg(v)}
                    >
                      › {v.tekst}
                    </button>
                  ))}
                  {valgListe.length === 0 && (
                    <button
                      type="button"
                      className={`${MENYPUNKT} text-(--gold)`}
                      onClick={() => setDialog(null)}
                    >
                      Ferdig
                    </button>
                  )}
                </div>
              </div>
            )}

            {!dialog && !rp && !iIntro && !iUtro && tekst && (
              <button
                type="button"
                aria-label="Lukk tekst"
                onClick={() => setTekst("")}
                className={`${PANEL} text-left text-xl leading-tight`}
              >
                {emne && (
                  <span className="flex items-center gap-1 text-base text-(--gold) uppercase tracking-wider">
                    {emne.ikon && emne.id && kap.gjenstander[emne.id] && (
                      <GjenstandIkon g={kap.gjenstander[emne.id]} size={16} />
                    )}
                    {emne.navn}
                  </span>
                )}
                <Tekst key={tekst} tekst={tekst} />
              </button>
            )}
          </div>
        </div>

        {/* Verb bar, inventory slots, tips and the menu */}
        <div className="flex items-center gap-2 px-2 py-1 border-t-2 border-(--brass)">
          {VERBS.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={verb === v.id}
              onClick={() => {
                setHolder(null);
                SoundManager.playSound("click");
                setVerb(verb === v.id ? null : v.id);
              }}
              className={`${LITEN} flex items-center gap-1 ${verb === v.id ? "bg-(--neon-green) text-black border-(--neon-green)" : "border-(--neon-green)/60"}`}
            >
              <Icon
                name={v.ikon}
                size={18}
                color={verb === v.id ? "gray" : "green"}
              />
              {v.label}
            </button>
          ))}
          <div
            ref={lommeRef}
            className="flex-1 min-w-0 flex gap-1 overflow-x-auto"
            aria-label="Lommene"
          >
            {save.inventory
              .filter((id) => kap.gjenstander[id])
              .map((id) => (
                <button
                  key={id}
                  data-gjenstand={id}
                  type="button"
                  aria-label={kap.gjenstander[id].navn}
                  title={kap.gjenstander[id].navn}
                  onClick={() => {
                    if (dratt.current) {
                      dratt.current = false;
                      return;
                    }
                    SoundManager.playSound("click");
                    tapItem(id);
                  }}
                  // Drag from the pocket onto the scene: what the 12-year-old tries first on iPad
                  onPointerUp={(e) => {
                    const mål = document
                      .elementFromPoint(e.clientX, e.clientY)
                      ?.closest("[data-hotspot]");
                    const h = hotspots.find(
                      (x) => x.id === mål?.getAttribute("data-hotspot"),
                    );
                    if (!h) return;
                    dratt.current = true;
                    // Touch releases outside the slot fire no click; clear the guard next tick
                    setTimeout(() => (dratt.current = false), 50);
                    bruk(M.trykk(kap, save, h, null, id), h);
                  }}
                  className={`relative shrink-0 w-12 h-12 border-2 flex items-center justify-center touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--gold) transition-transform ${holder === id ? "scale-110 border-(--gold) bg-(--gold)/25 shadow-[0_0_12px_var(--gold)]" : M.erNy(save, id) ? "border-(--gold) motion-safe:animate-pulse" : "border-(--brass)"}`}
                >
                  {M.erNy(save, id) && (
                    <span className="absolute -top-1 -right-1 px-0.5 bg-(--gold) text-black text-xs leading-none">
                      NY
                    </span>
                  )}
                  <GjenstandIkon g={kap.gjenstander[id]} size={32} />
                </button>
              ))}
            {Array.from({
              length: Math.max(0, 4 - save.inventory.length),
            }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-12 h-12 border-2 border-(--brass)/30"
              />
            ))}
          </div>
          {scene.utganger.some((u) => u.rect) && !iIntro && !iUtro && (
            <select
              aria-label="Steder"
              value=""
              disabled={!!dialog}
              onChange={(e) =>
                e.target.value && bruk(M.gaa(save, e.target.value))
              }
              className={`${LITEN} bg-black border-(--cold-blue) text-(--cold-blue)`}
            >
              <option value="">STEDER</option>
              {scene.utganger.map((u) => (
                <option key={u.til} value={u.til}>
                  {u.navn}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            aria-expanded={notat}
            onClick={() => {
              SoundManager.playSound("click");
              setNotat(!notat);
            }}
            className={`${LITEN} border-(--cold-blue) text-(--cold-blue)`}
          >
            NOTAT
          </button>
          <button
            type="button"
            aria-expanded={!!rp}
            onClick={() => {
              SoundManager.playSound("click");
              if (rp) return setRp(null);
              const nytt = M.rampenissenNytt(kap, save);
              let s = M.hoer(save, nytt);
              // Stuck overnight or after many wrong tries: the next hint comes unasked
              const grunn = M.dyttGrunn(kap, s, nyDag);
              let tips: string | undefined;
              if (grunn) {
                const u = M.tips(kap, s);
                s = u.save;
                tips = `${M.DYTT[grunn]} ${u.tekst ?? ""}`;
                setNyDag(false);
              }
              setSave(s);
              setRp({ nytt: nytt.map((n) => n.tekst), tips });
            }}
            className={`${LITEN} relative flex items-center gap-1 border-(--gold) text-(--gold)`}
          >
            <span className="w-7 h-7 [&>div]:w-7 [&>div]:h-7 [&>div]:border">
              <Portrett navn="rampenissen" />
            </span>
            RAMPENISSEN
            {(M.rampenissenNytt(kap, save).length > 0 ||
              !!M.dyttGrunn(kap, save, nyDag)) && (
              <span
                aria-label="Nytt fra Rampenissen"
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-(--gold) motion-safe:animate-pulse"
              />
            )}
          </button>
          <div className="relative">
            <button
              type="button"
              aria-expanded={valg}
              onClick={() => setValg(!valg)}
              className={`${LITEN} border-(--brass)`}
            >
              MENY
            </button>
            {valg && (
              <div className="absolute bottom-full right-0 mb-1 z-10 w-64 flex flex-col bg-black border-2 border-(--brass) py-1">
                {M.fjaerTelling(kap, save)[1] > 0 && (
                  <p className="px-3 min-h-11 flex items-center text-lg text-(--gold)">
                    Uglefjær {M.fjaerTelling(kap, save).join("/")}
                  </p>
                )}
                <button
                  type="button"
                  className={MENYPUNKT}
                  onClick={() => {
                    setValg(false);
                    setMeny(true);
                  }}
                >
                  Kapitler
                </button>
                <button
                  type="button"
                  className={MENYPUNKT}
                  onClick={() => {
                    setValg(false);
                    setBekreft(kap.n);
                  }}
                >
                  Start kapittelet på nytt
                </button>
                <button
                  type="button"
                  className={MENYPUNKT}
                  onClick={() => {
                    setValg(false);
                    setIntroIgjen(true);
                  }}
                >
                  Se introen igjen
                </button>
                {DEV && (
                  <>
                    <button
                      type="button"
                      className={`${MENYPUNKT} opacity-60`}
                      onClick={() => setVisSoner(!visSoner)}
                    >
                      {visSoner ? "Skjul soner (dev)" : "Vis soner (dev)"}
                    </button>
                    <select
                      aria-label="Hopp til scene"
                      className="mx-3 my-1 bg-black text-base opacity-60 min-h-11 border border-(--brass)"
                      value={scene.id}
                      onChange={(e) => {
                        setValg(false);
                        bruk(M.gaa(save, e.target.value));
                      }}
                    >
                      {kap.scener.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.navn}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </RetroWindow>
  );
}
