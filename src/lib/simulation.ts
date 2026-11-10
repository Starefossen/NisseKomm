/**
 * Simulering: parent-guide and playthrough tools to jump through the season.
 * Exposed as window.nissekomm.sim only where Tidsmaskin is mounted (lan mode).
 */
import { GameEngine } from "@/lib/game-engine";
import {
  getCurrentDate,
  getTimeOverride,
  setTimeOverride,
} from "@/lib/date-utils";

export type FrostSetting = "på" | "av" | "nødstopp";

function goTo(day: number, time = "08:00"): void {
  const [hour, minute] = time.split(":").map(Number);
  setTimeOverride({ day, month: 12, hour, minute });
}

/** Solves days 1..day with the real codes, as if the kids typed them. */
async function solveUntil(day: number, { bonus = false } = {}) {
  for (const q of GameEngine.getAllQuests()) {
    if (q.dag > day) continue;
    await GameEngine.submitCode(q.kode, q.kode, q.dag);
    GameEngine.markJuliusVideoWatched(q.dag);
    if (bonus && q.bonusoppdrag) GameEngine.completeBonusOppdrag(q.dag);
  }
}

function setFrost(setting: FrostSetting): void {
  GameEngine.setFrostDisabledToday(setting === "av");
  if (setting === "nødstopp") {
    goTo(Math.min(24, getCurrentDate().getDate()), "20:00");
  }
}

/** Clears all progress but keeps the simulated time. */
function reset(): void {
  const saved = getTimeOverride();
  GameEngine.resetProgress();
  setTimeOverride(saved);
}

/** Solves seven days one by one from today and lands on the morning after. */
async function skipWeek({ bonus = false } = {}) {
  const now = getCurrentDate();
  const start = now.getMonth() === 11 ? Math.min(24, now.getDate()) : 1;
  const end = Math.min(24, start + 6);
  for (let d = start; d <= end; d++) {
    goTo(d);
    await solveUntil(d, { bonus });
  }
  goTo(Math.min(24, end + 1));
}

function exportSnapshot(): string {
  return JSON.stringify({
    tid: getTimeOverride(),
    tilstand: GameEngine.getSnapshot(),
  });
}

function importSnapshot(json: string): void {
  const { tid, tilstand } = JSON.parse(json);
  if (!tilstand || typeof tilstand !== "object") {
    throw new Error("Ugyldig øyeblikksbilde");
  }
  GameEngine.restoreSnapshot(tilstand);
  setTimeOverride(tid ?? null);
}

export const sim = {
  goTo,
  solveUntil,
  setFrost,
  reset,
  skipWeek,
  exportSnapshot,
  importSnapshot,
};
