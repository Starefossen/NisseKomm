"use client";

import { useEffect, useState } from "react";
import { RetroWindow } from "@/components/ui/RetroWindow";
import { Icon } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";
import { GameEngine } from "@/lib/game-engine";
import type { EventyrSave } from "@/lib/storage";
import { mediaUrl } from "@/lib/media";
import { KAPITLER, kapittel, erLaastOpp, spilldag } from "./kapitler";
import * as M from "./motor";

const DEV =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_TEST_MODE === "true";

// Icons so Hanna (5) can tell the verbs apart without reading.
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

export function Nissespill({ onClose }: { onClose: () => void }) {
  const [save, setSave] = useState<EventyrSave | null>(null);
  const [meny, setMeny] = useState(true);
  const [verb, setVerb] = useState<M.Verb | null>(null);
  const [holder, setHolder] = useState<string | null>(null);
  const [tekst, setTekst] = useState("");
  const [dialog, setDialog] = useState<{ id: string; node: string } | null>(
    null,
  );
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
  const [bildeFeil, setBildeFeil] = useState<string | null>(null);

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

  const bruk = (u: M.Utfall) => {
    setSave(u.save);
    if (u.tekst !== undefined) setTekst(u.tekst);
    if (u.dialog) setDialog({ id: u.dialog, node: "start" });
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
                      {ferdig
                        ? "Fullført"
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
    if (verb === "se") {
      setTekst(kap.gjenstander[id].se);
      setVerb(null);
      return;
    }
    setVerb(null);
    if (holder && holder !== id) bruk(M.kombiner(kap, save, holder, id));
    else setHolder(holder === id ? null : id);
  };

  const tapValg = (v: M.Valg) => {
    SoundManager.playSound("click");
    setSave(M.velgSvar(save, v));
    setDialog(v.neste && dialog ? { id: dialog.id, node: v.neste } : null);
  };

  const status = holder
    ? `Bruk ${kap.gjenstander[holder]?.navn ?? holder} på …`
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
                src={
                  bildeFeil === scene.bilde
                    ? "/village-day.jpg"
                    : mediaUrl(scene.bilde)
                }
                alt={scene.navn}
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover"
                onError={() => setBildeFeil(scene.bilde)}
              />
              {!iIntro &&
                !iUtro &&
                !dialog &&
                hotspots.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    aria-label={h.navn}
                    onClick={() => bruk(M.trykk(kap, save, h, verb, holder))}
                    className={`absolute rounded min-w-11 min-h-11 ${visSoner || hint ? "border-2 border-dashed border-(--gold)" : ""} active:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--gold) focus-visible:bg-white/20`}
                    style={{
                      left: `${h.rect.x}%`,
                      top: `${h.rect.y}%`,
                      width: `${h.rect.w}%`,
                      height: `${h.rect.h}%`,
                    }}
                  />
                ))}

              <div className="absolute top-2 left-2 px-2 bg-black/70 text-base text-(--cold-blue) uppercase tracking-wider pointer-events-none">
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
            {(iIntro || iUtro) && (
              <div className={`${PANEL} flex items-start gap-3`}>
                <Portrett navn="rampenissen" />
                <div className="flex-1 min-w-0">
                  <p className="text-lg text-(--gold)">Rampenissen</p>
                  <p className="text-xl leading-tight">
                    {iIntro ? kap.intro[introSteg] : kap.utro}
                  </p>
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
                      {M.velg(node.tekst, save)}
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
                      className={MENYPUNKT}
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
                {tekst}
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
            className="flex-1 min-w-0 flex gap-1 overflow-x-auto"
            aria-label="Lommene"
          >
            {save.inventory
              .filter((id) => kap.gjenstander[id])
              .map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-label={kap.gjenstander[id].navn}
                  title={kap.gjenstander[id].navn}
                  onClick={() => tapItem(id)}
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
