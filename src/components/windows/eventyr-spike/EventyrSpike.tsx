"use client";

import { useEffect, useState } from "react";
import { GameEngine } from "@/lib/game-engine";
import type { EventyrSave } from "@/lib/storage";
import { mediaUrl } from "@/lib/media";
import { ITEMS, VERKSTED, type Hotspot, type Verb } from "./scener";

const SCENE = VERKSTED;
const FRESH: EventyrSave = {
  sceneId: SCENE.id,
  inventory: [],
  flags: [],
  hints: {},
};

const VERBS: { id: Verb; label: string }[] = [
  { id: "se", label: "SE" },
  { id: "bruk", label: "BRUK" },
  { id: "snakk", label: "SNAKK" },
];

const BTN =
  "min-h-14 px-4 rounded border-2 font-retro text-2xl active:scale-95 transition-transform";

export default function EventyrSpike() {
  const [save, setSave] = useState<EventyrSave | null>(null);
  const [verb, setVerb] = useState<Verb | null>(null);
  const [holding, setHolding] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [dialog, setDialog] = useState<{ h: Hotspot; reply?: string } | null>(
    null,
  );
  const [showZones, setShowZones] = useState(false);

  // Storage is browser-only; load after mount and persist every change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load
    setSave(GameEngine.getEventyrSave() ?? FRESH);
  }, []);
  useEffect(() => {
    if (save) GameEngine.saveEventyr(save);
  }, [save]);

  if (!save) return null;

  const has = (flag: string) => save.flags.includes(flag);
  const lit = has(SCENE.lysFlag);
  const patch = (p: Partial<EventyrSave>) => setSave({ ...save, ...p });
  const addFlag = (flags: string[], f: string) =>
    flags.includes(f) ? flags : [...flags, f];

  const tapHotspot = (h: Hotspot) => {
    if (holding) {
      const item = ITEMS[holding];
      const t = h.trenger;
      if (t && t.item === holding && !has(t.flag)) {
        patch({
          flags: addFlag(save.flags, t.flag),
          inventory: t.forbruker
            ? save.inventory.filter((i) => i !== holding)
            : save.inventory,
        });
        setText(t.tekst);
      } else {
        setText(
          `${item.name} på ${h.name.toLowerCase()}? Nei, det gir ikke mening.`,
        );
      }
      setHolding(null);
      return;
    }
    const v = verb ?? h.smart;
    setVerb(null);
    if (v === "se") {
      setText(h.seEtter && has(h.seEtter.flag) ? h.seEtter.tekst : h.se);
    } else if (v === "bruk") {
      const taken = `har_tatt_${h.id}`;
      if (h.gir && !has(taken)) {
        patch({
          flags: addFlag(save.flags, taken),
          inventory: [...save.inventory, h.gir],
        });
        setText(`Du tar ${ITEMS[h.gir].name.toLowerCase()}en.`);
      } else {
        setText(h.bruk ?? "Det skjer ingenting. Absolutt ingenting.");
      }
    } else if (h.snakk) {
      setDialog({ h });
    } else {
      setText(`${h.name} svarer ikke. Forståelig nok.`);
    }
  };

  const tapItem = (id: string) => {
    if (verb === "se") {
      setText(ITEMS[id].se);
      setVerb(null);
      return;
    }
    setVerb(null);
    setHolding(holding === id ? null : id);
  };

  const tapTips = () => {
    const level = save.hints[SCENE.id] ?? 0;
    setText(SCENE.tips[Math.min(level, 2)]);
    if (level < 3) patch({ hints: { ...save.hints, [SCENE.id]: level + 1 } });
  };

  const status = holding
    ? `Bruk ${ITEMS[holding].name} på …`
    : verb
      ? `${VERBS.find((x) => x.id === verb)?.label} hva?`
      : lit
        ? SCENE.name
        : `${SCENE.name} (mørkt)`;

  return (
    <div
      className="min-h-dvh bg-black text-(--neon-green) flex flex-col select-none"
      style={{
        touchAction: "manipulation",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* Scene: 16:9 still with percent-positioned hotspots */}
      <div className="relative w-full max-w-5xl mx-auto aspect-video bg-black overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl(SCENE.bilde)}
          alt={SCENE.name}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover transition-[filter] duration-1000"
          style={{ filter: lit ? "none" : "brightness(0.3) saturate(0.4)" }}
        />
        {/* Overlay: dead-red LED while dark, warm glow and a live needle once powered */}
        <svg
          viewBox="0 0 160 90"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {lit ? (
            <>
              <radialGradient id="glow">
                <stop offset="0" stopColor="#ffd27a" stopOpacity="0.55" />
                <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
              </radialGradient>
              <circle cx="14" cy="38" r="22" fill="url(#glow)" />
              <circle cx="134" cy="40" r="26" fill="url(#glow)" />
              <circle cx="36" cy="10" r="14" fill="url(#glow)" />
              <line
                x1="20"
                y1="43"
                x2="25"
                y2="38"
                stroke="#ffd700"
                strokeWidth="0.6"
                className="origin-[20px_43px] animate-pulse"
              />
            </>
          ) : (
            <circle
              cx="20"
              cy="36"
              r="1.2"
              fill="#ff3030"
              className="animate-pulse"
            />
          )}
        </svg>
        {SCENE.hotspots.map((h) => (
          <button
            key={h.id}
            type="button"
            aria-label={h.name}
            onClick={() => tapHotspot(h)}
            className={`absolute rounded ${showZones ? "border-2 border-dashed border-(--gold)" : ""} ${holding || verb ? "active:bg-white/20" : "active:bg-white/10"}`}
            style={{
              left: `${h.rect.x}%`,
              top: `${h.rect.y}%`,
              width: `${h.rect.w}%`,
              height: `${h.rect.h}%`,
            }}
          />
        ))}
      </div>

      {/* Status line + speech / dialog */}
      <div className="w-full max-w-5xl mx-auto px-3 py-2 font-retro flex-1">
        <div className="text-lg text-(--cold-blue) uppercase tracking-wider">
          {status}
        </div>
        {dialog ? (
          <div className="mt-1 space-y-2">
            <p className="text-2xl text-(--gold)">{dialog.h.snakk!.speaker}</p>
            <p className="text-2xl">
              {dialog.reply ?? dialog.h.snakk!.opening}
            </p>
            {dialog.reply ? (
              <button
                type="button"
                className={`${BTN} border-(--gold) text-(--gold)`}
                onClick={() => setDialog(null)}
              >
                Ferdig
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                {dialog.h.snakk!.choices.map((c) => (
                  <button
                    key={c.text}
                    type="button"
                    className={`${BTN} border-(--neon-green) text-left`}
                    onClick={() => {
                      if (c.setsFlag)
                        patch({ flags: addFlag(save.flags, c.setsFlag) });
                      setDialog({ h: dialog.h, reply: c.reply });
                    }}
                  >
                    › {c.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-1 text-2xl leading-tight min-h-16">
            {text ||
              (lit
                ? "Rampenissen: «Sånn ja, lys! Ka gjør vi no?»"
                : "Rampenissen: «Oi. Det ble mørkt. Trykk på ting, da vel!»")}
          </p>
        )}
      </div>

      {/* Verbs, inventory, tips */}
      <div className="w-full max-w-5xl mx-auto px-3 pb-4 flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {VERBS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setHolding(null);
                setVerb(verb === v.id ? null : v.id);
              }}
              className={`${BTN} min-w-20 ${verb === v.id ? "bg-(--neon-green) text-black border-(--neon-green)" : "border-(--neon-green)"}`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex-1 flex gap-2 overflow-x-auto min-h-14 items-center border-2 border-dashed border-(--neon-green)/40 rounded px-2">
          {save.inventory.length === 0 && (
            <span className="font-retro text-xl opacity-50">Tomme lommer</span>
          )}
          {save.inventory.map((id) => (
            <button
              key={id}
              type="button"
              aria-label={ITEMS[id].name}
              onClick={() => tapItem(id)}
              className={`min-w-14 min-h-14 rounded border-2 flex items-center justify-center ${holding === id ? "bg-(--gold) text-black border-(--gold)" : "border-(--gold) text-(--gold)"}`}
            >
              <svg viewBox="0 0 24 24" className="w-9 h-9" fill="none">
                <path
                  d={ITEMS[id].icon}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={tapTips}
          className={`${BTN} border-(--gold) text-(--gold) animate-pulse`}
        >
          TIPS
        </button>
        <button
          type="button"
          onClick={() => setShowZones(!showZones)}
          className="font-retro text-sm opacity-50 min-h-11 px-2"
        >
          {showZones ? "skjul soner" : "vis soner"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSave(FRESH);
            setHolding(null);
            setDialog(null);
          }}
          className="font-retro text-sm opacity-50 min-h-11 px-2"
        >
          nullstill
        </button>
      </div>
    </div>
  );
}
