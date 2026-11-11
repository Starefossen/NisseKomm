"use client";

import { useEffect, useRef, useState } from "react";
import { RetroWindow } from "@/components/ui/RetroWindow";
import { Icon } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";
import { GameEngine } from "@/lib/game-engine";
import type { EventyrSave } from "@/lib/storage";
import { mediaUrl } from "@/lib/media";
import { KAPITLER, kapittel, erLaastOpp, spilldag } from "./kapitler";
import * as M from "./motor";
import { Puslespill } from "./Puslespill";

const DEV =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_TEST_MODE === "true";

// Icons make the verbs readable at a glance.
// Old scene images stay as fallback until the new spill/ stills are generated.
const GAMLE_BILDER: Record<string, string> = {
  "spill/iq-verksted.jpg": "feed/iq-verksted.png",
  "spill/julius-kontor.jpg": "feed/julius-kontor.jpg",
  "spill/antenne-tarn.jpg": "feed/antenne-tarn.png",
  "spill/kulde-grotte.jpg": "feed/kulde-grotte.png",
};

const VERBS: { id: M.Verb; label: string; ikon: string }[] = [
  { id: "se", label: "SE", ikon: "eye" },
  { id: "bruk", label: "BRUK", ikon: "hand" },
  { id: "snakk", label: "SNAKK", ikon: "message" },
];

const BTN =
  "min-h-12 px-3 rounded border-2 text-xl active:scale-95 transition-transform";

/** Brass-framed pixel portrait; the name's initial until the file exists. */
function Portrett({ navn, stor }: { navn: string; stor?: boolean }) {
  const [mangler, setMangler] = useState(false);
  const size = stor ? "w-20 h-20" : "w-12 h-12";
  return (
    <div
      className={`${size} shrink-0 border-2 border-(--brass) bg-black flex items-center justify-center overflow-hidden`}
    >
      {mangler ? (
        <span className="text-3xl text-(--gold)">{navn[0].toUpperCase()}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(`spill/portrett-${navn}.png`)}
          alt={navn}
          draggable={false}
          className="w-full h-full pixelated"
          onError={() => setMangler(true)}
        />
      )}
    </div>
  );
}

/**
 * Typewriter line; a tap finishes it. The untyped rest stays in the DOM, invisible,
 * so the box never jumps and the full text is there for screen readers and tests.
 */
function Skriv({ tekst }: { tekst: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= tekst.length) return;
    const t = setTimeout(() => setN(n + 2), 22);
    return () => clearTimeout(t);
  }, [n, tekst]);
  return (
    <span
      onClick={(e) => {
        if (n < tekst.length) {
          e.stopPropagation();
          setN(tekst.length);
        }
      }}
    >
      {tekst.slice(0, n)}
      <span className="invisible">{tekst.slice(n)}</span>
    </span>
  );
}

// Outdoor stills get snow; indoor ones a warm lamp flicker.
const UTE = [
  "spill/torget.jpg",
  "spill/antenne-tarn.jpg",
  "feed/antenne-tarn.png",
  "spill/port-aapen.jpg",
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
  const [emne, setEmne] = useState<{ navn: string; ikon?: string } | null>(
    null,
  );
  const [dialog, setDialog] = useState<{ id: string; node: string } | null>(
    null,
  );
  const [puslespill, setPuslespill] = useState<string | null>(null);
  const [notat, setNotat] = useState(false);
  const [introSteg, setIntroSteg] = useState(0);
  const [visSoner, setVisSoner] = useState(false);
  const [valg, setValg] = useState(false);
  // A tap on empty scene briefly outlines the hotspots (no pixel-hunting on iPad).
  const [hint, setHint] = useState(false);
  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(false), 1500);
    return () => clearTimeout(t);
  }, [hint]);
  const sceneRef = useRef<HTMLDivElement>(null);
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

  // Storage is browser-only: load after mount, persist every change.
  useEffect(() => {
    const s = GameEngine.getEventyrSave();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load
    setSave(s);
    if (s && !s.flags.includes(kapittel(s.kapittel).slutt)) setMeny(false);
  }, []);
  useEffect(() => {
    if (save) GameEngine.saveEventyr(save);
  }, [save]);

  const dag = spilldag();

  const bruk = (u: M.Utfall, om?: { navn: string; ikon?: string }) => {
    if (save) {
      const ny = u.save.inventory.find((i) => !save.inventory.includes(i));
      // After render: the new slot flies down from the scene into the pocket
      if (ny)
        setTimeout(() =>
          animer(
            lommeRef.current?.querySelector(`[data-gjenstand="${ny}"]`),
            [
              { transform: "translateY(-45vh) scale(2.5)", opacity: 0 },
              { transform: "translateY(0) scale(1)", opacity: 1 },
            ],
            600,
          ),
        );
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
    setVerb(null);
    setHolder(null);
  };

  const startKapittel = (n: number) => {
    SoundManager.playSound("open");
    setSave(M.nyttKapittel(kapittel(n), save));
    setTekst("");
    setDialog(null);
    setIntroSteg(0);
    setMeny(false);
  };

  if (meny || !save) {
    return (
      <RetroWindow title="UGLEPOSTEN" onClose={onClose}>
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl text-(--gold) tracking-wider">UGLEPOSTEN</h2>
          <p className="text-xl leading-tight">
            Rampenissen har glemt noe i Snøfall. Styr Knerten, ull-ugla hans,
            gjennom IQs kameraer og hjelp ham, ett kapittel om gangen. Trykk på
            ting for å SE, BRUK og SNAKK.
          </p>
          <ul className="space-y-2">
            {KAPITLER.map((k) => {
              const aapen = erLaastOpp(k, dag) && k.klar;
              const ferdig = save?.flags.includes(k.slutt);
              const paagaar = save?.kapittel === k.n && !ferdig;
              return (
                <li
                  key={k.n}
                  className="flex items-center gap-3 border-2 border-(--brass) px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl truncate">
                      Kapittel {k.n}: {k.tittel}
                    </div>
                    <div className="text-base text-(--cold-blue)">
                      {ferdig && save
                        ? `Fullført · ${M.oppsummering(k, save).kort}`
                        : !erLaastOpp(k, dag)
                          ? `Låses opp ${k.dag}. desember`
                          : !k.klar
                            ? "Under arbeid i Snøfall"
                            : paagaar
                              ? "Påbegynt"
                              : "Klar"}
                    </div>
                  </div>
                  {aapen && (
                    <button
                      type="button"
                      className={`${BTN} border-(--gold) text-(--gold)`}
                      onClick={() =>
                        paagaar ? setMeny(false) : startKapittel(k.n)
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
  const introFlagg = `k${kap.n}_intro`;
  const utroFlagg = `k${kap.n}_utro`;
  const iIntro = !M.has(save, introFlagg);
  const iUtro = M.has(save, kap.slutt) && !M.has(save, utroFlagg);
  const node = dialog ? kap.dialoger[dialog.id].noder[dialog.node] : null;
  const taler = dialog ? kap.dialoger[dialog.id] : null;

  const tapItem = (id: string) => {
    const g = kap.gjenstander[id];
    if (verb === "se") {
      setTekst(g.se);
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
    setSave(M.velgSvar(save, v, dialog?.id));
    setDialog(v.neste && dialog ? { id: dialog.id, node: v.neste } : null);
  };

  const status = holder
    ? `BRUK ${kap.gjenstander[holder]?.navn ?? holder} på …`
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
                )
                  setHint(true);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={scene.bilde}
                style={{ animation: "fadeIn 0.5s ease-out" }}
                src={[
                  mediaUrl(scene.bilde),
                  ...(GAMLE_BILDER[scene.bilde]
                    ? [mediaUrl(GAMLE_BILDER[scene.bilde])]
                    : []),
                  "/village-day.jpg",
                ].find((u) => !bildeFeil.includes(u))}
                alt={scene.navn}
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) =>
                  setBildeFeil((f) => [
                    ...f,
                    e.currentTarget.getAttribute("src") ?? "",
                  ])
                }
              />
              <Stemning bilde={scene.bilde} />
              {!iIntro &&
                !iUtro &&
                !dialog &&
                hotspots.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    aria-label={h.navn}
                    onClick={() => {
                      setRing({
                        n: (ring?.n ?? 0) + 1,
                        x: h.rect.x + h.rect.w / 2,
                        y: h.rect.y + h.rect.h / 2,
                      });
                      bruk(M.trykk(kap, save, h, verb, holder), h);
                    }}
                    className={`group absolute rounded min-w-11 min-h-11 ${visSoner || hint ? "border-2 border-dashed border-(--gold)" : ""} active:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--gold) focus-visible:bg-white/20`}
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
              {!iIntro &&
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

              <div
                className={`absolute top-2 left-2 px-2 bg-black/70 text-base tracking-wider pointer-events-none ${verb || holder ? "text-(--gold) border border-(--gold) animate-pulse" : "text-(--cold-blue) uppercase"}`}
              >
                {status}
              </div>

              {!iIntro && !iUtro && !dialog && (
                <div className="absolute top-2 right-2 flex flex-col items-end gap-2">
                  {scene.utganger.map((u) => (
                    <button
                      key={u.til}
                      type="button"
                      onClick={() => bruk(M.gaa(save, u.til))}
                      className={`${LITEN} bg-black/70 border-(--cold-blue) text-(--cold-blue)`}
                    >
                      → {u.navn}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                  const u = M.tips(kap, save);
                  setSave(u.save);
                  SoundManager.playSound("click");
                  return u.tekst ?? "";
                }}
              />
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
            {(iIntro || iUtro) && (
              <div className={`${PANEL} flex items-start gap-3`}>
                <Portrett navn="rampenissen" />
                <div className="flex-1 min-w-0">
                  <p className="text-lg text-(--gold)">Rampenissen</p>
                  <p className="text-xl leading-tight">
                    <Skriv
                      key={iIntro ? kap.intro[introSteg] : kap.utro}
                      tekst={iIntro ? kap.intro[introSteg] : kap.utro}
                    />
                  </p>
                  {iUtro && (
                    <div className="mt-2 border-2 border-(--gold) px-3 py-2 space-y-1">
                      <p className="text-2xl text-(--gold) tracking-wider">
                        KAPITTEL {kap.n} FULLFØRT
                      </p>
                      <p className="text-lg text-(--cold-blue)">
                        {M.oppsummering(kap, save).kort}
                      </p>
                      <p className="text-lg">
                        {M.oppsummering(kap, save).linje}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    className={`${MENYPUNKT} text-(--gold)`}
                    onClick={() => {
                      SoundManager.playSound("click");
                      if (iUtro) {
                        setSave(M.medFlagg(save, utroFlagg));
                        setMeny(true);
                      } else if (introSteg + 1 < kap.intro.length) {
                        setIntroSteg(introSteg + 1);
                      } else {
                        setSave(M.medFlagg(save, introFlagg));
                      }
                    }}
                  >
                    {iUtro ? "TIL KAPITLENE" : "VIDERE"}
                  </button>
                </div>
              </div>
            )}

            {dialog && node && taler && (
              <div className={`${PANEL} space-y-2`}>
                <div className="flex items-start gap-3">
                  <Portrett key={taler.portrett} navn={taler.portrett} />
                  <div className="min-w-0">
                    <p className="text-lg text-(--gold)">{taler.taler}</p>
                    <p className="text-xl leading-tight">
                      <Skriv
                        key={dialog.node}
                        tekst={M.velg(node.tekst, save)}
                      />
                    </p>
                  </div>
                </div>
                {node.rampenissen && (
                  <div className="flex items-start gap-3">
                    <Portrett navn="rampenissen" />
                    <div className="min-w-0">
                      <p className="text-lg text-(--gold)">
                        Rampenissen (hvisker)
                      </p>
                      <p className="text-xl leading-tight">
                        {node.rampenissen}
                      </p>
                    </div>
                  </div>
                )}
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

            {!dialog && !iIntro && !iUtro && tekst && (
              <button
                type="button"
                aria-label="Lukk tekst"
                onClick={() => setTekst("")}
                className={`${PANEL} text-left text-xl leading-tight`}
              >
                {emne && (
                  <span className="flex items-center gap-1 text-base text-(--gold) uppercase tracking-wider">
                    {emne.ikon && (
                      <Icon name={emne.ikon} size={16} color="gold" />
                    )}
                    {emne.navn}
                  </span>
                )}
                <Skriv key={tekst} tekst={tekst} />
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
                    SoundManager.playSound("click");
                    tapItem(id);
                  }}
                  className={`shrink-0 w-11 h-11 border-2 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--gold) ${holder === id ? "bg-(--gold) border-(--gold)" : "border-(--brass)"}`}
                >
                  <Icon
                    name={kap.gjenstander[id].ikon}
                    size={26}
                    color={holder === id ? "gray" : "gold"}
                  />
                </button>
              ))}
            {Array.from({
              length: Math.max(0, 4 - save.inventory.length),
            }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-11 h-11 border-2 border-(--brass)/30"
              />
            ))}
          </div>
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
            onClick={() => bruk(M.tips(kap, save))}
            className={`${LITEN} border-(--gold) text-(--gold)`}
          >
            TIPS
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
                    Fjær {M.fjaerTelling(kap, save).join("/")}
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
                    startKapittel(kap.n);
                  }}
                >
                  Start kapittelet på nytt
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
