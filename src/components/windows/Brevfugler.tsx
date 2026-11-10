"use client";

import { mediaUrl } from "@/lib/media";
import { useEffect, useState, type CSSProperties } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icon } from "@/lib/icons";
import { GameEngine } from "@/lib/game-engine";
import { getCurrentDay } from "@/lib/date-utils";

const TINT_BREV = [
  "Takk for lyset.",
  "Jeg hadde glemt farger.",
  "Krystallet smelter ikke.",
  "Det er fra meg.",
];

/** One family: the name buttons are fixed, each with a symbol Hanna (5) knows without reading. */
export const SKRIVERE = [
  { navn: "Kristian", ikon: "zap" },
  { navn: "Håkon", ikon: "star" },
  { navn: "Hanna", ikon: "heart" },
] as const;

const BLA_FUGL_FRA_DAG = 14;
const TINT_MS = 9000;

// M6 Tøvær: Kulde's letter thaws as the reward for solving day 24's code.
export function erBrevetFrossent(day: number, dag24Lost: boolean): boolean {
  return day < 24 || !dag24Lost;
}

/**
 * Stores a letter where the parent guide reads it, with the writer's name so Julius
 * knows who wrote what. A second letter from the same child the same day is appended.
 * Returns false (and the caller keeps the draft) outside days 1-24.
 */
export function sendBrev(dag: number, utkast: string, fra: string): boolean {
  const tekst = utkast.trim();
  if (!tekst || !fra || dag < 1 || dag > 24) return false;
  const forrige = GameEngine.getSantaLetters().find(
    (l) => l.day === dag && l.from === fra,
  );
  GameEngine.addSantaLetter(
    dag,
    forrige ? `${forrige.content}\n\n${tekst}` : tekst,
    fra,
  );
  return true;
}

/** The thaw plays once, the first time the window opens after day 24 is solved. */
export function skalTineSpilles(frossent: boolean): boolean {
  return !frossent && !GameEngine.isIntroSeen("brev-tint");
}

function PikselFugl({
  farge,
  bokstav,
  is = false,
}: {
  farge: string;
  bokstav?: string;
  is?: boolean;
}) {
  const vinge = (delay: string): CSSProperties => ({
    animation: `bf-wing 0.5s steps(1) ${delay} infinite`,
  });
  return (
    <svg
      viewBox="0 0 16 12"
      width={48}
      height={36}
      shapeRendering="crispEdges"
      aria-hidden
      style={{ color: farge }}
    >
      <g fill="currentColor">
        {/* body and head */}
        <rect x="5" y="5" width="7" height="3" />
        <rect x="11" y="4" width="3" height="3" />
        <rect x="14" y="5" width="2" height="1" />
        <rect x="2" y="5" width="3" height="2" />
        {/* wings up */}
        <g style={vinge("0s")}>
          <rect x="6" y="1" width="2" height="4" />
          <rect x="8" y="2" width="2" height="3" />
          <rect x="4" y="0" width="2" height="2" />
        </g>
        {/* wings down */}
        <g style={vinge("-0.25s")}>
          <rect x="6" y="8" width="2" height="3" />
          <rect x="8" y="8" width="2" height="2" />
          <rect x="4" y="10" width="2" height="2" />
        </g>
      </g>
      <rect x="12" y="4" width="1" height="1" fill="black" />
      {is && (
        <rect x="6" y="5" width="3" height="2" fill="white" opacity={0.9} />
      )}
      {bokstav && (
        <text
          x="8.5"
          y="7.6"
          fontSize="4.2"
          textAnchor="middle"
          fill="black"
          className="font-retro"
        >
          {bokstav}
        </text>
      )}
    </svg>
  );
}

interface BrevfuglerProps {
  onClose: () => void;
}

export function Brevfugler({ onClose }: BrevfuglerProps) {
  const [dag] = useState(() => getCurrentDay());
  const [letters, setLetters] = useState(() => GameEngine.getSantaLetters());
  const [utkast, setUtkast] = useState("");
  const [skriver, setSkriver] = useState<string | null>(null);
  const [nySendt, setNySendt] = useState<string | null>(null);
  const [kollbotte, setKollbotte] = useState<Record<string, number>>({});
  // Once per open; a code can only be sent with this window closed.
  const [frossent] = useState(() =>
    erBrevetFrossent(dag, GameEngine.isQuestCompleted(24)),
  );
  const [tiner, setTiner] = useState(
    () =>
      skalTineSpilles(frossent) &&
      !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (!frossent) GameEngine.markIntroSeen("brev-tint");
  }, [frossent]);

  useEffect(() => {
    if (!tiner) return;
    const t = setTimeout(() => setTiner(false), TINT_MS);
    return () => clearTimeout(t);
  }, [tiner]);

  const send = () => {
    if (!skriver || !sendBrev(dag, utkast, skriver)) return;
    setLetters(GameEngine.getSantaLetters());
    setNySendt(skriver);
    setUtkast("");
  };

  const dagensFugler = letters.filter((l) => l.day === dag && l.from);
  const perSkriver = SKRIVERE.map(({ navn }) => ({
    navn,
    antall: letters.filter((l) => l.from === navn).length,
  })).filter((s) => s.antall > 0);
  const blaFugl = frossent && dag >= BLA_FUGL_FRA_DAG;

  return (
    <RetroWindow title="BREVFUGLER" onClose={onClose}>
      <div className="h-full flex flex-col bg-(--dark-crt) overflow-hidden">
        {/* The sky over Snøfall */}
        <div
          className="relative flex-[1.15] min-h-0 overflow-hidden border-b-2 border-(--brass) bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(10,6,4,0.35), rgba(10,6,4,0.75)), url("${mediaUrl("feed/landsby-rolig.jpg")}"), url("/village-day.jpg")`,
          }}
          onClick={() => tiner && setTiner(false)}
          data-testid="brevfugler-himmel"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 3px)",
            }}
          />

          {blaFugl && (
            <div className="absolute left-[64%] top-[22%]">
              <div
                className="motion-reduce:animate-none"
                style={{ animation: "bf-enter-right 4s ease-out 1s backwards" }}
              >
                <div
                  className="motion-reduce:animate-none"
                  style={{ animation: "bf-circle 9s linear infinite" }}
                >
                  <PikselFugl farge="var(--bird-blue)" is />
                </div>
              </div>
            </div>
          )}

          {tiner && (
            <div
              className="absolute"
              style={{ animation: `bf-home ${TINT_MS}ms ease-in-out forwards` }}
            >
              <PikselFugl farge="var(--bird-blue)" />
            </div>
          )}

          {dagensFugler.map((l, i) => {
            const n = kollbotte[l.from!] ?? 0;
            return (
              <button
                key={l.from}
                type="button"
                aria-label={`Brevfuglen til ${l.from}`}
                onClick={() =>
                  setKollbotte((k) => ({ ...k, [l.from!]: n + 1 }))
                }
                className="absolute min-w-12 min-h-12 flex items-center justify-center cursor-pointer"
                style={{ left: `${8 + i * 17}%`, top: `${14 + (i % 2) * 22}%` }}
              >
                <span
                  key={n}
                  className="block motion-reduce:animate-none"
                  style={{
                    animation:
                      n > 0
                        ? "bf-flip 0.7s ease-in-out"
                        : nySendt === l.from
                          ? "bf-fly-up 2.4s ease-out"
                          : undefined,
                  }}
                >
                  <PikselFugl farge="var(--gold)" bokstav={l.from![0]} />
                </span>
              </button>
            );
          })}

          {!frossent && (
            <div
              className="absolute left-1/2 top-[8%] -translate-x-1/2 w-[min(26rem,80%)] p-3 bg-(--neon-green) text-black border-2 border-(--gold) shadow-[0_0_30px_var(--gold)] font-retro"
              data-testid="tint-brev"
            >
              {TINT_BREV.map((linje, i) => (
                <div
                  key={linje}
                  className="text-xl leading-tight"
                  style={
                    tiner
                      ? {
                          animation: `bf-line-in 0.8s ease-out ${2 + i * 1.2}s both`,
                        }
                      : undefined
                  }
                >
                  {linje}
                </div>
              ))}
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 p-2 bg-black/70 text-base text-(--neon-green) space-y-0.5">
            {blaFugl && (
              <div className="text-(--cold-blue)">
                En fugl ingen har sendt. Den har et brev frosset fast på vingen.
              </div>
            )}
            {!frossent && (
              <div className="text-(--gold)">
                Fra Vintervokteren, Krystallgrotten
              </div>
            )}
            <div>
              {dagensFugler.length === 0
                ? "Ingen brev er sendt i dag ennå."
                : dagensFugler.length === 1
                  ? "1 brev er på vei til Julius."
                  : `${dagensFugler.length} brev er på vei til Julius.`}
              {perSkriver.length > 0 &&
                `  Sendt i desember: ${perSkriver.map((s) => `${s.navn} ${s.antall}`).join(", ")}`}
            </div>
          </div>
        </div>

        {/* The writing desk */}
        <div className="flex-1 min-h-0 grid grid-cols-[1fr_12rem] gap-3 p-3">
          <div className="flex flex-col gap-2 min-h-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold">HVEM SKRIVER?</span>
              {SKRIVERE.map(({ navn, ikon }) => (
                <button
                  key={navn}
                  type="button"
                  onClick={() => setSkriver(navn)}
                  aria-pressed={skriver === navn}
                  className={`min-h-12 px-3 flex items-center gap-2 border-2 text-lg font-bold cursor-pointer transition-colors ${
                    skriver === navn
                      ? "border-(--gold) bg-(--gold) text-black"
                      : "border-(--neon-green)/60 text-(--neon-green) hover:bg-(--neon-green)/15"
                  }`}
                >
                  <Icon
                    name={ikon}
                    size={24}
                    color={skriver === navn ? "gray" : "gold"}
                  />
                  {navn.toUpperCase()}
                </button>
              ))}
            </div>
            <label htmlFor="brev-til-julius" className="text-base opacity-70">
              Skriv på papir først. Så skriver dere det av her.
            </label>
            <textarea
              id="brev-til-julius"
              value={utkast}
              onChange={(e) => setUtkast(e.target.value)}
              placeholder="Kjære Julius ..."
              className="flex-1 min-h-16 w-full p-2 bg-black/40 border-2 border-(--neon-green) text-(--neon-green) text-lg font-retro resize-none"
            />
            <button
              type="button"
              onClick={send}
              disabled={!utkast.trim() || !skriver}
              className="min-h-12 px-4 flex items-center justify-center gap-2 border-2 border-(--gold) bg-(--gold)/20 hover:bg-(--gold)/30 disabled:opacity-30 disabled:cursor-not-allowed text-(--gold) text-lg font-bold transition-colors cursor-pointer"
            >
              <Icon name="send" size={24} color="gold" />
              SEND BREVFUGLEN
            </button>
          </div>

          {frossent ? (
            <div className="relative p-3 border-2 border-(--cold-blue) bg-(--cold-blue)/10 flex flex-col gap-2 shadow-[inset_0_0_24px_var(--cold-blue)]">
              <div className="flex items-center gap-2 text-base font-bold text-(--cold-blue)">
                <Icon name="snowflake" size={24} color="blue" />
                FRYST BREV
              </div>
              <div className="text-base text-(--cold-blue)/80">
                {blaFugl
                  ? "Brevet sitter fast på vingen til den blå fuglen. Det tiner når linjen er varm."
                  : "Ingen frosne brev ennå."}
              </div>
            </div>
          ) : (
            <div className="relative p-3 border-2 border-(--gold) bg-(--gold)/10 flex flex-col gap-2 overflow-hidden">
              {tiner && (
                <div
                  aria-hidden
                  className="absolute inset-0 bg-(--cold-blue)/40 frost-thaw"
                />
              )}
              <div className="text-base font-bold text-(--gold)">
                BREVET HAR TINT
              </div>
              <div className="text-base text-(--neon-green)">
                Fra Vintervokteren, Krystallgrotten
              </div>
            </div>
          )}
        </div>
      </div>
    </RetroWindow>
  );
}
