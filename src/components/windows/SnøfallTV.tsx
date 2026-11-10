"use client";

import { useEffect, useState } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { JuliusVideo } from "../modules/JuliusVideo";
import { SoundManager } from "@/lib/sounds";
import { GameEngine } from "@/lib/game-engine";
import { getCurrentDay, getCurrentDate } from "@/lib/date-utils";
import { LiveCam } from "./snofall-tv/LiveCam";
import { MiniGames } from "./snofall-tv/MiniGames";
import {
  CHANNELS,
  FREQ_HOME,
  FREQ_KULDE,
  FREQ_MAX,
  FREQ_MIN,
  channelEffects,
  channelFallback,
  channelSource,
  latestIntercept,
  type ChannelId,
} from "./snofall-tv/channels";

interface SnøfallTVProps {
  onClose: () => void;
  currentDay?: number;
}

const TICK_MS = 250;
// Day 1 tune-in: 10 ticks sweeping 85,0 → 90,0, then one channel per 5 ticks.
const SWEEP_TICKS = 10;
const TICKS_PER_CHANNEL = 5;
const TUNE_DONE = SWEEP_TICKS + TICKS_PER_CHANNEL * CHANNELS.length;
// Day 21 after the code: one channel thaws every 6 ticks.
const THAW_TICKS = 6;

// Restarts from 0 whenever `active` turns on, so a solve while open starts the thaw.
function useTicker(active: boolean, until: number): number {
  const [tick, setTick] = useState(until);
  const [wasActive, setWasActive] = useState(false);
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setTick(0);
  }
  useEffect(() => {
    if (tick >= until) return;
    const id = setTimeout(() => setTick((t) => t + 1), TICK_MS);
    return () => clearTimeout(id);
  }, [tick, until]);
  return tick;
}

export function SnøfallTV({ onClose, currentDay }: SnøfallTVProps) {
  const day = Math.max(1, Math.min(24, currentDay ?? getCurrentDay()));
  // Read on every render: the parent re-renders after a code, and the clock
  // tick catches the 20:00 fail-safe and the parent's «Frost av».
  const [, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  const solved = GameEngine.isQuestCompleted(day);
  const frost = GameEngine.getFrostLevel(day) ?? 0;
  const mode = GameEngine.getFrostMode().level;
  const hour = getCurrentDate().getHours();

  const tuneTick = useTicker(day === 1 && !solved, TUNE_DONE);
  const tuning = tuneTick < TUNE_DONE;
  const tunedChannels = tuning
    ? Math.max(0, Math.floor((tuneTick - SWEEP_TICKS) / TICKS_PER_CHANNEL))
    : CHANNELS.length;
  const thawTick = useTicker(day === 21 && solved, THAW_TICKS * 4);
  const thawed = Math.floor(thawTick / THAW_TICKS);

  const [channel, setChannel] = useState<ChannelId>(day === 1 ? 1 : 3);
  const [freq, setFreq] = useState(FREQ_HOME);
  const [playing, setPlaying] = useState(false);

  const sweepFreq = FREQ_KULDE + Math.min(tuneTick, SWEEP_TICKS) * 0.5;
  const sweeping = tuning && tuneTick < SWEEP_TICKS;
  const shownChannel: ChannelId = sweeping ? 4 : channel;
  const shownFreq = sweeping ? sweepFreq : freq;

  const fx = channelEffects(shownChannel, shownFreq, {
    day,
    solved,
    frost,
    mode,
    thawed,
  });
  const intercept =
    shownChannel === 4 && shownFreq === FREQ_KULDE && day >= 3
      ? latestIntercept(day)
      : undefined;

  const select = (id: ChannelId) => {
    if (id === channel || id > tunedChannels) return;
    SoundManager.playSound("click");
    setPlaying(false);
    setChannel(id);
  };

  const name = CHANNELS.find((c) => c.id === shownChannel)!.name;
  const label = sweeping
    ? `SØKER ${shownFreq.toFixed(1).replace(".", ",")} MHz`
    : `K${shownChannel} ${name}`;

  return (
    <RetroWindow title="SNØFALL TV" onClose={onClose}>
      <div className="p-3 lg:p-5 h-full overflow-y-auto space-y-3 select-none">
        <div className="relative w-full aspect-video border-4 border-(--neon-green) bg-black overflow-hidden">
          {shownChannel === 3 ? (
            <div className="absolute inset-0 overflow-y-auto">
              <JuliusVideo day={day} />
            </div>
          ) : (
            <LiveCam
              key={`${shownChannel}`}
              src={
                // Day 1: a channel shows snow until its carrier comes in.
                shownChannel > tunedChannels && !sweeping
                  ? null
                  : channelSource(shownChannel, day, hour, shownFreq, solved)
              }
              fallback={channelFallback(shownChannel, shownFreq, day)}
              label={label}
              {...fx}
            />
          )}
          {shownChannel === 3 && (
            <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.18)_0px,rgba(0,0,0,0.18)_1px,transparent_1px,transparent_3px)]" />
          )}
          {shownChannel !== 3 && day >= 7 && day < 24 && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 bg-black/70 border border-(--cold-blue) text-(--cold-blue) text-sm pointer-events-none">
              FROST {frost} %
            </div>
          )}
          {playing && <MiniGames onClose={() => setPlaying(false)} />}
        </div>

        {intercept && (
          <div className="border-2 border-(--cold-blue) bg-black/80 p-2 text-(--cold-blue)">
            <div className="text-xs opacity-70">
              85,0 MHz // KRYSTALLGROTTEN
            </div>
            <div className="text-lg">«{intercept}»</div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {CHANNELS.map((c) => {
            const locked = c.id > tunedChannels;
            return (
              <button
                key={c.id}
                onClick={() => select(c.id)}
                disabled={locked}
                className={`min-h-11 px-3 border-2 text-lg cursor-pointer disabled:cursor-not-allowed ${
                  locked
                    ? "border-(--gray) text-(--gray) animate-pulse"
                    : channel === c.id && !sweeping
                      ? "border-(--gold) bg-(--gold) text-black"
                      : "border-(--neon-green) text-(--neon-green) hover:bg-(--neon-green)/20"
                }`}
              >
                K{c.id} {locked ? "· · ·" : c.name}
              </button>
            );
          })}
          {solved && channel === 4 && !playing && (
            <button
              onClick={() => {
                SoundManager.playSound("click");
                setPlaying(true);
              }}
              className="min-h-11 px-3 border-2 border-(--gold) text-(--gold) text-lg cursor-pointer ml-auto"
            >
              TEKNISK HUD
            </button>
          )}
        </div>

        {channel === 4 && !sweeping && (
          <label className="flex items-center gap-3 text-(--neon-green) text-lg">
            FREKVENS
            <input
              type="range"
              min={FREQ_MIN}
              max={FREQ_MAX}
              step={0.5}
              value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
              className="flex-1 min-h-11 accent-(--neon-green)"
              aria-label="Frekvenshjul"
            />
            <span className="w-24 tabular-nums text-right">
              {freq.toFixed(1).replace(".", ",")} MHz
            </span>
          </label>
        )}
      </div>
    </RetroWindow>
  );
}
