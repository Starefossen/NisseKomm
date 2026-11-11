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

const VERBS: { id: M.Verb; label: string }[] = [
  { id: "se", label: "SE" },
  { id: "bruk", label: "BRUK" },
  { id: "snakk", label: "SNAKK" },
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
      <RetroWindow title="NISSESPILL" onClose={onClose}>
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl text-(--gold) tracking-wider">
            KLEMENTIN-EKSPRESSEN
          </h2>
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
    ? `Bruk ${kap.gjenstander[holder].navn} på …`
    : verb
      ? `${VERBS.find((x) => x.id === verb)?.label} hva?`
      : scene.navn;

  return (
    <RetroWindow title={`NISSESPILL: KAPITTEL ${kap.n}`} onClose={onClose}>
      <div
        className="h-full flex flex-col select-none"
        style={{
          touchAction: "manipulation",
          WebkitTouchCallout: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Scene: 16:9 still with percent-positioned hotspots */}
        <div className="relative w-full max-w-4xl mx-auto aspect-video max-h-[55%] bg-black overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl(scene.bilde)}
            alt={scene.navn}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
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
                className={`absolute rounded ${visSoner ? "border-2 border-dashed border-(--gold)" : ""} active:bg-white/20`}
                style={{
                  left: `${h.rect.x}%`,
                  top: `${h.rect.y}%`,
                  width: `${h.rect.w}%`,
                  height: `${h.rect.h}%`,
                }}
              />
            ))}
          {(iIntro || iUtro) && (
            <div className="absolute inset-0 bg-black/75 flex items-end p-4">
              <div className="flex items-start gap-3 w-full">
                <Portrett navn="rampenissen" stor />
                <div className="flex-1 space-y-3">
                  <p className="text-2xl leading-tight">
                    {iIntro ? kap.intro[introSteg] : kap.utro}
                  </p>
                  <button
                    type="button"
                    className={`${BTN} border-(--gold) text-(--gold)`}
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
            </div>
          )}
        </div>

        {/* Status line + speech / dialog */}
        <div className="w-full max-w-4xl mx-auto px-3 py-2 flex-1 min-h-0 overflow-auto">
          <div className="text-base text-(--cold-blue) uppercase tracking-wider">
            {status}
          </div>
          {dialog && node && taler ? (
            <div className="mt-1 space-y-2">
              <div className="flex items-start gap-3">
                <Portrett navn={taler.portrett} />
                <div>
                  <p className="text-xl text-(--gold)">{taler.taler}</p>
                  <p className="text-2xl leading-tight">
                    {M.velg(node.tekst, save)}
                  </p>
                </div>
              </div>
              {node.rampenissen && (
                <div className="flex items-start gap-3 pl-6">
                  <Portrett navn="rampenissen" />
                  <div>
                    <p className="text-xl text-(--gold)">
                      Rampenissen (hvisker)
                    </p>
                    <p className="text-2xl leading-tight">{node.rampenissen}</p>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {M.valgSomVises(node, save).map((v) => (
                  <button
                    key={v.tekst}
                    type="button"
                    className={`${BTN} border-(--neon-green) text-left`}
                    onClick={() => tapValg(v)}
                  >
                    › {v.tekst}
                  </button>
                ))}
                {M.valgSomVises(node, save).length === 0 && (
                  <button
                    type="button"
                    className={`${BTN} border-(--gold) text-(--gold)`}
                    onClick={() => setDialog(null)}
                  >
                    Ferdig
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-1 text-2xl leading-tight min-h-14">
              {tekst || "Rampenissen: «Trykk på ting, da vel!»"}
            </p>
          )}
        </div>

        {/* Exits, verbs, inventory, tips */}
        <div className="w-full max-w-4xl mx-auto px-3 pb-3 flex items-center gap-2 flex-wrap">
          {scene.utganger.map((u) => (
            <button
              key={u.til}
              type="button"
              onClick={() => bruk(M.gaa(save, u.til))}
              className={`${BTN} border-(--cold-blue) text-(--cold-blue)`}
            >
              → {u.navn}
            </button>
          ))}
          <div className="flex gap-2">
            {VERBS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setHolder(null);
                  setVerb(verb === v.id ? null : v.id);
                }}
                className={`${BTN} min-w-16 ${verb === v.id ? "bg-(--neon-green) text-black border-(--neon-green)" : "border-(--neon-green)"}`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div className="flex-1 flex gap-2 overflow-x-auto min-h-12 items-center border-2 border-dashed border-(--neon-green)/40 rounded px-2">
            {save.inventory.length === 0 && (
              <span className="text-lg opacity-50">Tomme lommer</span>
            )}
            {save.inventory.map((id) => (
              <button
                key={id}
                type="button"
                aria-label={kap.gjenstander[id].navn}
                title={kap.gjenstander[id].navn}
                onClick={() => tapItem(id)}
                className={`min-w-12 min-h-12 rounded border-2 flex items-center justify-center ${holder === id ? "bg-(--gold) border-(--gold)" : "border-(--gold)"}`}
              >
                <Icon
                  name={kap.gjenstander[id].ikon}
                  size={28}
                  color={holder === id ? "gray" : "gold"}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => bruk(M.tips(kap, save))}
            className={`${BTN} border-(--gold) text-(--gold) animate-pulse`}
          >
            TIPS
          </button>
          <button
            type="button"
            onClick={() => setMeny(true)}
            className="text-sm opacity-60 min-h-11 px-2"
          >
            kapitler
          </button>
          {DEV && (
            <>
              <select
                aria-label="Hopp til scene"
                className="bg-black text-sm opacity-60 min-h-11 border border-(--brass)"
                value={scene.id}
                onChange={(e) => bruk(M.gaa(save, e.target.value))}
              >
                {kap.scener.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.navn}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setVisSoner(!visSoner)}
                className="text-sm opacity-60 min-h-11 px-2"
              >
                {visSoner ? "skjul soner" : "vis soner"}
              </button>
              <button
                type="button"
                onClick={() => startKapittel(kap.n)}
                className="text-sm opacity-60 min-h-11 px-2"
              >
                nullstill
              </button>
            </>
          )}
        </div>
      </div>
    </RetroWindow>
  );
}
