"use client";

import { useState, useEffect, useRef } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { GameEngine } from "@/lib/game-engine";
import { LEDIndicator } from "../ui/LEDIndicator";
import { useSounds } from "@/lib/sounds";
import { getCurrentDate } from "@/lib/date-utils";
import { TIDBITS, visible } from "@/lib/tidbits";
import { KAPITLER } from "./nissespill/kapitler";
import { ETAPPER } from "./snofall-tv/slede";

interface NisseStatsProps {
  onClose: () => void;
  currentDay: number;
}

type MetricType = {
  navn: string;
  verdi: number;
  maks: number;
  displayType:
    | "counter"
    | "bar"
    | "percentage"
    | "waveform"
    | "radar"
    | "gauge"
    | "binary"
    | "hexgrid";
  unit: string;
  description: string;
  status: "normal" | "advarsel" | "kritisk";
  inCrisis: boolean;
  crisisType?:
    | "glitch"
    | "oscillate"
    | "drain"
    | "stuck"
    | "negative"
    | "warning"
    | "dimming"
    | "lost";
  crisisText?: string;
  crisisValues?: number[];
};

type UrgencyLevel = "calm" | "approaching" | "urgent" | "critical" | "today";

interface UrgencyStyles {
  borderColor: string;
  textColor: string;
  animation: string;
}

const URGENCY_STYLES: Record<UrgencyLevel, UrgencyStyles> = {
  calm: {
    borderColor: "border-(--neon-green)",
    textColor: "text-(--neon-green)",
    animation: "animate-pulse",
  },
  approaching: {
    borderColor: "border-(--cold-blue)",
    textColor: "text-(--cold-blue)",
    animation: "animate-pulse",
  },
  urgent: {
    borderColor: "border-(--gold)",
    textColor: "text-(--gold)",
    animation: "animate-pulse",
  },
  critical: {
    borderColor: "border-(--christmas-red)",
    textColor: "text-(--christmas-red)",
    animation: "animate-crt-shake",
  },
  today: {
    borderColor: "border-(--gold)",
    textColor: "text-(--gold)",
    animation: "animate-[gold-flash_1s_ease-in-out_infinite]",
  },
};

const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  critical: "SNART JUL!",
  urgent: "FÅ DAGER IGJEN",
  approaching: "HALVVEIS",
  calm: "FORBEREDELSER I GANG",
  today: "I DAG!",
};

const CRISIS_ANIMATION_CLASSES: Record<
  NonNullable<MetricType["crisisType"]>,
  string
> = {
  glitch: "animate-[glitch_0.3s_infinite]",
  oscillate: "animate-pulse",
  warning: "animate-[gold-flash_2s_ease-in-out_infinite]",
  drain: "animate-[red-shake_0.5s_ease-in-out]",
  stuck: "animate-[red-shake_0.5s_ease-in-out]",
  negative: "animate-[red-shake_0.5s_ease-in-out]",
  dimming: "animate-[red-shake_0.5s_ease-in-out]",
  lost: "animate-[red-shake_0.5s_ease-in-out]",
};

/**
 * Generate dynamic feed items based on current metrics and crisis status
 */
function generateFeedItems(
  metrics: MetricType[],
  currentDay: number,
): string[] {
  const staticItems = [
    "Elf_042: Pakking av lego-sett fullført",
    "Elf_137: Kvalitetskontroll av teddybjørner OK",
    "IQ: Turbo-reinsdyr forer testet - liten brann",
    "Winter: Organisert 1,247 brevfugler i dag",
    "Rudolf: Oppvarmingsrunde nr. 4 - perfekt!",
    "Vedlikehold: Verksted temperatur stabil",
  ];

  const dynamicItems: string[] = [];

  // Add metric updates
  const metricUpdates = [
    {
      key: "GAVEPRODUKSJON",
      template: (m: MetricType) =>
        `Gaveproduksjon: ${m.verdi.toLocaleString("no-NO")} pakker klare!`,
    },
    {
      key: "NISSEKRAFT",
      template: (m: MetricType) => `Nissekraft: ${m.verdi}% energi stabil`,
    },
    {
      key: "BREVFUGL-SVERM",
      template: (m: MetricType) => `${m.verdi} brevfugler aktive i luften`,
    },
  ];

  metricUpdates.forEach(({ key, template }) => {
    const metric = metrics.find((m) => m.navn === key);
    if (metric && !metric.inCrisis) {
      dynamicItems.push(template(metric));
    }
  });

  // Add crisis alerts
  const crisisStatus = GameEngine.getCrisisStatus();

  // Day 11: Antenna crisis
  if (currentDay >= 11 && !crisisStatus.antenna) {
    dynamicItems.unshift(
      "KRITISK: RUDOLF NES-SIGNAL TAPT - TELEMETRI OFFLINE",
      "IQ: Antennen er HELT ødelagt! Trenger AKUTT reparasjon!",
      "SYSTEMFEIL: SUNOS-8000-8N - MULTIPLE SENSOR FAILURES",
    );
  }

  // Day 16: Inventory crisis
  if (currentDay >= 16 && !crisisStatus.inventory) {
    dynamicItems.unshift(
      "KRITISK: INVENTAR-SYSTEM KRASJET - DATABASE LOOP",
      "Winter: 'Alt har sin plass!' - men systemet vet ikke hvor!",
      "NISSEKRAFT: ENERGI-DRAIN - Prøver å fikse database...",
    );
  }

  // Day 7: Mørket warning
  if (currentDay >= 7 && currentDay < 14) {
    dynamicItems.unshift(
      "ORAKELET: MØRKET DETEKTERT - POLARNATTEN NÆRMER SEG",
      "JULESTJERNE: Lysstyrke demper... Trenger magisk styrke",
    );
  }

  // Add resolution messages
  if (currentDay >= 12 && crisisStatus.antenna) {
    dynamicItems.push(
      "ANTENNE-REPARASJON FULLFØRT! SIGNAL: 100%",
      "RUDOLF: NESEN MIN LYSER IGJEN! Jeg ser ALT!",
    );
  }

  if (currentDay >= 17 && crisisStatus.inventory) {
    dynamicItems.push(
      "INVENTAR SYNKRONISERT! Produksjon: 100% - Flott arbeid!",
      "NISSEKRAFT: Systemer normalisert. Database gjenopprettet!",
    );
  }

  return [...dynamicItems, ...staticItems].slice(0, 9);
}

export function NisseStats({ onClose, currentDay }: NisseStatsProps) {
  const { playSound } = useSounds();
  const snofallStats = visible(TIDBITS.stats, currentDay);
  const hasPlayedChristmasSound = useRef(false);
  const [glitchFrame, setGlitchFrame] = useState(0);

  // Countdown state
  const [countdown, setCountdown] = useState(() =>
    GameEngine.getChristmasCountdown(),
  );

  // Production metrics state
  const [metrics, setMetrics] = useState<MetricType[]>(() => {
    const completedQuestCount = GameEngine.getCompletedQuestCount();
    return GameEngine.getGlobalProductionMetrics(
      currentDay,
      completedQuestCount,
    );
  });

  // Feed state
  const [feedItems, setFeedItems] = useState<string[]>([]);
  const [tab, setTab] = useState<"malere" | "live" | "snofall">("malere");

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdown = GameEngine.getChristmasCountdown();
      setCountdown(newCountdown);

      if (newCountdown.isChristmas && !hasPlayedChristmasSound.current) {
        playSound("success");
        hasPlayedChristmasSound.current = true;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [playSound]);

  // Update metrics every 2 seconds (glitch/oscillate animations happen faster)
  useEffect(() => {
    const interval = setInterval(() => {
      const completedQuestCount = GameEngine.getCompletedQuestCount();
      const newMetrics = GameEngine.getGlobalProductionMetrics(
        currentDay,
        completedQuestCount,
      );
      setMetrics(newMetrics);
      setGlitchFrame((prev) => (prev + 1) % 1000);
    }, 2000);

    return () => clearInterval(interval);
  }, [currentDay]);

  // Generate feed items
  useEffect(() => {
    const updateFeed = () => {
      setFeedItems(generateFeedItems(metrics, currentDay));
    };

    updateFeed();
    const interval = setInterval(updateFeed, 3000);
    return () => clearInterval(interval);
  }, [metrics, currentDay]);

  const urgencyStyles = URGENCY_STYLES[countdown.urgencyLevel];
  const urgencyLabel = URGENCY_LABELS[countdown.urgencyLevel];
  const questProgress = GameEngine.getCompletedQuestCount();
  const completedDays = GameEngine.getCompletedDays();
  const save = GameEngine.getEventyrSave();
  const fjaerTotal = KAPITLER.reduce(
    (n, k) => n + k.scener.filter((sc) => sc.fjaer).length,
    0,
  );
  const slede = GameEngine.getSledeResultater();
  const etapper = ETAPPER.filter((e) => e.dag <= currentDay);
  const sledeMaks = Math.max(1, ...etapper.map((e) => slede[e.id]?.poeng ?? 0));
  const sledeBest = Math.max(0, ...etapper.map((e) => slede[e.id]?.poeng ?? 0));

  const tabs: { id: typeof tab; label: string }[] = [
    { id: "malere", label: "MÅLERE" },
    { id: "live", label: "LIVE" },
    ...(snofallStats.length > 0
      ? [{ id: "snofall" as const, label: "SNØFALL" }]
      : []),
  ];

  return (
    <RetroWindow title="NISSESTATS - SANNTIDSDATA" onClose={onClose}>
      <div className="p-3 lg:p-4 h-full overflow-y-auto flex flex-col gap-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Countdown */}
          <div
            className={`relative p-3 border-4 ${urgencyStyles.borderColor} bg-black/30 ${urgencyStyles.animation} text-center`}
          >
            <div className={`text-base ${urgencyStyles.textColor}`}>
              JULAFTEN OM
            </div>
            {countdown.isChristmas ? (
              <div className="text-3xl font-bold text-(--gold) animate-[gold-flash_1s_ease-in-out_infinite]">
                GOD JUL!
              </div>
            ) : (
              <>
                <div
                  className={`text-3xl font-bold ${urgencyStyles.textColor} tracking-wider`}
                >
                  {countdown.days}d {String(countdown.hours).padStart(2, "0")}:
                  {String(countdown.minutes).padStart(2, "0")}:
                  {String(countdown.seconds).padStart(2, "0")}
                </div>
                <div className={`text-base ${urgencyStyles.textColor}/70`}>
                  {urgencyLabel}
                </div>
              </>
            )}
          </div>

          <Tile label="OPPDRAG" value={`${questProgress}/24`}>
            <div className="grid grid-cols-12 gap-0.5">
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 ${completedDays.has(i + 1) ? "bg-(--gold)" : i + 1 <= currentDay ? "bg-(--neon-green)/40" : "bg-(--neon-green)/10"}`}
                />
              ))}
            </div>
          </Tile>

          <Tile
            label="UGLEPOSTEN"
            value={`${save?.fjaer?.length ?? 0}/${fjaerTotal}`}
            unit="fjær"
          >
            <div className="text-base opacity-70">
              {save
                ? `Kapittel ${save.kapittel}/${KAPITLER.length}`
                : "Ikke startet"}
            </div>
          </Tile>

          <Tile
            label="SLEDEFLUKT"
            value={sledeBest.toLocaleString("no-NO")}
            unit="beste"
          >
            <div className="flex items-end gap-0.5 h-6">
              {etapper.map((e) => {
                const p = slede[e.id]?.poeng ?? 0;
                return (
                  <div
                    key={e.id}
                    title={`${e.navn}: ${p}`}
                    className={`flex-1 ${p ? "bg-(--gold)" : "bg-(--neon-green)/15"}`}
                    style={{
                      height: `${Math.max(12, (p / sledeMaks) * 100)}%`,
                    }}
                  />
                );
              })}
            </div>
          </Tile>
        </div>

        <div role="tablist" className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                playSound("click");
                setTab(t.id);
              }}
              className={`min-h-11 px-4 border-2 text-base tracking-wider transition-colors ${tab === t.id ? "border-(--gold) bg-(--gold) text-black" : "border-(--neon-green)/50 text-(--neon-green) hover:bg-(--neon-green)/10"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "malere" && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {metrics.map((metric) => (
              <MetricCard
                key={metric.navn}
                metric={metric}
                glitchFrame={glitchFrame}
              />
            ))}
            {etapper.some((e) => slede[e.id]) && (
              <div className="col-span-full p-2 border-2 border-dashed border-(--neon-green)/50 bg-(--neon-green)/5">
                <div className="text-base opacity-70 mb-1">
                  SLEDEFLUKT - BESTE PER ETAPPE
                </div>
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 text-base">
                  {etapper.map((e) => (
                    <div key={e.id} className="flex justify-between gap-2">
                      <dt className="opacity-70 truncate">{e.navn}</dt>
                      <dd className="text-(--gold) tabular-nums">
                        {slede[e.id]
                          ? `${slede[e.id].poeng.toLocaleString("no-NO")} · ${slede[e.id].bjeller} bj.`
                          : "-"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        )}

        {tab === "live" && (
          <div className="border-2 border-(--neon-green)/30 divide-y divide-(--neon-green)/10">
            {feedItems.map((item, i) => (
              <div key={i} className="p-2 text-base text-(--neon-green)/70">
                [{getCurrentDate().toLocaleTimeString("no-NO")}] {item}
              </div>
            ))}
          </div>
        )}

        {tab === "snofall" && (
          <dl className="p-3 border-2 border-dashed border-(--cold-blue)/60 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-base">
            {snofallStats.map((s) => (
              <div key={s.navn} className="flex justify-between gap-3">
                <dt className="opacity-70">{s.navn}</dt>
                <dd className="text-(--gold) tabular-nums">{s.verdi}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </RetroWindow>
  );
}

function Tile({
  label,
  value,
  unit,
  children,
}: {
  label: string;
  value: string;
  unit?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-3 border-2 border-(--neon-green)/50 bg-(--neon-green)/5 flex flex-col gap-1">
      <div className="text-base opacity-70">{label}</div>
      <div className="text-3xl font-bold text-(--gold) tabular-nums">
        {value}
        {unit && <span className="text-base opacity-70"> {unit}</span>}
      </div>
      <div className="mt-auto">{children}</div>
    </div>
  );
}

/**
 * Render functions for different display types
 */
const DisplayRenderers = {
  bar: (value: number, max: number) => {
    const percentage = Math.round((value / max) * 100);
    const filledChars = Math.round(percentage / 10);
    const emptyChars = 10 - filledChars;
    return `[${Array.from({ length: filledChars }).fill("█").join("")}${Array.from({ length: emptyChars }).fill("░").join("")}] ${percentage}%`;
  },

  waveform: (value: number, max: number) => {
    const percent = (value / max) * 100;
    const bars = Math.round(percent / 10);
    const heights = [2, 4, 6, 8, 10, 8, 6, 4, 2, 1];
    return heights
      .slice(0, 10)
      .map((h, i) => (i < bars ? "│".repeat(h) : "·"))
      .join(" ");
  },

  radar: (value: number, max: number, glitchFrame: number) => {
    const percent = Math.round((value / max) * 100);
    const sweep = glitchFrame % 8;
    const positions = ["◜", "◝", "◞", "◟", "◜", "◝", "◞", "◟"];
    return `${positions[sweep]} SWEEP ${percent}% [${value}/${max}]`;
  },

  gauge: (value: number, max: number) => {
    const percent = Math.round((value / max) * 100);
    const needlePos = Math.round(percent / 10);
    const gauge = Array.from({ length: 11 }, (_, i) =>
      i === needlePos ? "▲" : "─",
    ).join("");
    return `${gauge} ${percent}%`;
  },

  binary: (value: number, glitchFrame: number) => {
    const binary = value.toString(2).padStart(8, "0");
    const flickering =
      glitchFrame % 2 === 0 ? binary : binary.replace(/1/g, "█");
    return `${flickering} [${value}%]`;
  },

  hexgrid: (value: number, max: number) => {
    const percent = (value / max) * 100;
    const filled = Math.round(percent / 10);
    const hexes = Array.from({ length: 10 }, (_, i) =>
      i < filled ? "⬢" : "⬡",
    ).join(" ");
    return hexes;
  },

  percentage: (value: number, max: number) => Math.round((value / max) * 100),
};

/**
 * Crisis display components
 */
interface CrisisDisplayProps {
  displayValue: number;
  glitchFrame: number;
  statusColor: string;
  unit: string;
  crisisText?: string;
}

function CrisisDisplay({
  metric,
  displayValue,
  glitchFrame,
  statusColor,
}: CrisisDisplayProps & { metric: MetricType }) {
  const crisisRenderers: Record<
    NonNullable<MetricType["crisisType"]>,
    () => React.ReactNode
  > = {
    glitch: () => (
      <div className={`text-xl font-bold font-retro ${statusColor}`}>
        {displayValue < 0
          ? `ERR:${displayValue}`
          : `${displayValue}█${glitchFrame % 2 === 0 ? "▓" : "░"}??`}
      </div>
    ),
    oscillate: () => (
      <div className={`text-2xl font-bold ${statusColor}`}>
        {displayValue.toLocaleString("no-NO")}
      </div>
    ),
    stuck: () => (
      <div className={`text-2xl font-bold ${statusColor}`}>
        {displayValue.toLocaleString("no-NO")} [LOOP]
      </div>
    ),
    negative: () => (
      <div className={`text-2xl font-bold ${statusColor}`}>
        {displayValue} {metric.unit} [UNDERFLOW]
      </div>
    ),
    lost: () => (
      <div className={`text-2xl font-bold ${statusColor}`}>
        {glitchFrame % 2 === 0 ? "???" : "▓▓▓"} LOST
      </div>
    ),
    warning: () => (
      <div className={`text-2xl font-bold ${statusColor}`}>{displayValue}%</div>
    ),
    dimming: () => (
      <div className={`text-2xl font-bold ${statusColor}`}>{displayValue}%</div>
    ),
    drain: () => (
      <div className={`text-2xl font-bold ${statusColor}`}>
        {displayValue}% ↓↓↓
      </div>
    ),
  };

  const renderer = metric.crisisType
    ? crisisRenderers[metric.crisisType]
    : null;

  return (
    <div className="space-y-1">
      {renderer && renderer()}
      <div className="text-base text-(--christmas-red)/80">
        {metric.crisisText}
      </div>
    </div>
  );
}

/**
 * Normal display component
 */
interface NormalDisplayProps {
  metric: MetricType;
  liveCount: number;
  statusColor: string;
  glitchFrame: number;
}

function NormalDisplay({
  metric,
  liveCount,
  statusColor,
  glitchFrame,
}: NormalDisplayProps) {
  const percent = DisplayRenderers.percentage(metric.verdi, metric.maks);

  const displayComponents: Record<
    MetricType["displayType"],
    () => React.ReactNode
  > = {
    counter: () => (
      <div
        className={`text-xl lg:text-2xl font-bold ${statusColor} transition-all`}
      >
        {liveCount.toLocaleString("no-NO")}
      </div>
    ),
    bar: () => (
      <div className={`text-base font-retro ${statusColor}`}>
        {DisplayRenderers.bar(metric.verdi, metric.maks)}
      </div>
    ),
    percentage: () => (
      <div className={`text-xl font-bold ${statusColor}`}>{percent}%</div>
    ),
    waveform: () => (
      <div>
        <div className={`text-xl font-bold ${statusColor} mb-1`}>
          {metric.verdi}%
        </div>
        <div
          className={`text-base font-retro ${statusColor}/50 whitespace-nowrap overflow-hidden`}
        >
          {DisplayRenderers.waveform(metric.verdi, metric.maks)}
        </div>
      </div>
    ),
    radar: () => (
      <div className={`text-base font-retro ${statusColor}`}>
        {DisplayRenderers.radar(metric.verdi, metric.maks, glitchFrame)}
      </div>
    ),
    gauge: () => (
      <div>
        <div className={`text-xl font-bold ${statusColor} mb-1`}>
          {percent}%
        </div>
        <div
          className={`text-base font-retro ${statusColor}/50 whitespace-nowrap overflow-hidden`}
        >
          {DisplayRenderers.gauge(metric.verdi, metric.maks)}
        </div>
      </div>
    ),
    binary: () => (
      <div className={`text-base font-retro ${statusColor}`}>
        {DisplayRenderers.binary(percent, glitchFrame)}
      </div>
    ),
    hexgrid: () => (
      <div>
        <div className={`text-xl font-bold ${statusColor} mb-1`}>
          {metric.verdi.toLocaleString("no-NO")}
        </div>
        <div
          className={`text-base ${statusColor}/50 whitespace-nowrap overflow-hidden`}
        >
          {DisplayRenderers.hexgrid(metric.verdi, metric.maks)}
        </div>
      </div>
    ),
  };

  return (
    <div className="flex-1 flex flex-col justify-center">
      {displayComponents[metric.displayType]()}
      <div
        className="text-base opacity-60 mt-auto pt-1 truncate"
        title={metric.description}
      >
        {metric.description}
      </div>
    </div>
  );
}

// Metric Card Component with all display types and crisis animations
interface MetricCardProps {
  metric: MetricType;
  glitchFrame: number;
}

function MetricCard({ metric, glitchFrame }: MetricCardProps) {
  const targetRef = useRef(metric.verdi);

  // Determine if this metric should animate
  const shouldAnimate =
    !metric.inCrisis &&
    metric.navn !== "BARN I VERDEN" &&
    metric.displayType === "counter";

  // Initialize animated count with lazy initializer to avoid setState in effect
  const getInitialCount = () => {
    if (!shouldAnimate) return metric.verdi;
    return Math.max(metric.verdi * 0.95, metric.verdi - 10000);
  };

  const [animatedCount, setAnimatedCount] = useState(getInitialCount);

  // Update target ref when metric value changes
  useEffect(() => {
    targetRef.current = metric.verdi;
  }, [metric.verdi]);

  // Animate counters for production metrics
  useEffect(() => {
    if (!shouldAnimate) {
      return; // Non-animated metrics will use metric.verdi directly
    }

    // Increment slowly to simulate live production
    const increment = Math.max(1, Math.floor(metric.maks / 100000));
    const interval = setInterval(() => {
      setAnimatedCount((prev) => {
        const next = prev + increment;
        return next > targetRef.current ? targetRef.current : next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [metric.verdi, metric.maks, shouldAnimate]);

  // Use animated count for animated metrics, actual value for others
  const displayCount = shouldAnimate ? animatedCount : metric.verdi;

  // Determine styling based on crisis and status
  const getStatusColor = () => {
    if (metric.inCrisis) return "text-(--christmas-red)";
    if (metric.status === "kritisk") return "text-(--christmas-red)";
    if (metric.status === "advarsel") return "text-(--gold)";
    return "text-(--neon-green)";
  };

  const statusColor = getStatusColor();

  // Get animated crisis value for glitch/oscillate types
  const displayValue =
    metric.inCrisis && metric.crisisValues
      ? metric.crisisValues[glitchFrame % metric.crisisValues.length]
      : metric.verdi;

  // Get crisis animation class
  const crisisAnimation =
    metric.inCrisis && metric.crisisType
      ? CRISIS_ANIMATION_CLASSES[metric.crisisType]
      : "";

  const borderClass = metric.inCrisis
    ? "border-(--christmas-red) bg-(--christmas-red)/10"
    : "border-(--neon-green)/50 bg-(--neon-green)/5";

  const ledColor = metric.inCrisis
    ? "red"
    : metric.status === "kritisk"
      ? "red"
      : metric.status === "advarsel"
        ? "gold"
        : "green";

  return (
    <div
      className={`p-2 border-2 border-dashed transition-all will-change-transform flex flex-col ${crisisAnimation} ${borderClass}`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="text-base opacity-70">{metric.navn}</div>
          <LEDIndicator color={ledColor} />
        </div>

        {/* Value Display */}
        {metric.inCrisis ? (
          <CrisisDisplay
            metric={metric}
            displayValue={displayValue}
            glitchFrame={glitchFrame}
            statusColor={statusColor}
            unit={metric.unit}
            crisisText={metric.crisisText}
          />
        ) : (
          <NormalDisplay
            metric={metric}
            liveCount={displayCount}
            statusColor={statusColor}
            glitchFrame={glitchFrame}
          />
        )}
      </div>
    </div>
  );
}
