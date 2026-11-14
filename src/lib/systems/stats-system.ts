/**
 * Stats System
 *
 * NisseStats metrics from statisk_innhold.json and the live frost and rune
 * state.
 */

import {
  calculateSigmoidValue,
  getMetricStatus,
} from "../utils/metric-calculator";
import statiskInnhold from "@/data/statisk_innhold.json";
import { KULDE_INTERCEPTS } from "@/components/windows/snofall-tv/channels";
import { ALLE_RUNER } from "../data-loader";
import { getFrostLevel, getLearnedRunes } from "./frost-system";

export type MetricDisplayType =
  | "counter"
  | "bar"
  | "percentage"
  | "waveform"
  | "radar"
  | "gauge"
  | "binary"
  | "hexgrid";

/**
 * NisseStats metrics: a sigmoid from min to max over December with a small
 * bonus per solved code, or a live value when `kilde` names one (frost,
 * line warmth, runes, Kulde's ghost images). Filtered by unlock_day.
 */
export function getGlobalProductionMetrics(
  day: number,
  completedQuestCount: number,
): Array<{
  navn: string;
  verdi: number;
  maks: number;
  displayType: MetricDisplayType;
  unit: string;
  description: string;
  status: "normal" | "advarsel" | "kritisk";
}> {
  const { nissestats_global_metrics: metrics, progression_config } =
    statiskInnhold as unknown as {
      nissestats_global_metrics: Array<{
        navn: string;
        min: number;
        maks: number;
        unlock_day: number;
        display_type: MetricDisplayType;
        unit: string;
        child_progress_multiplier: number;
        description: string;
        kilde?: "frost" | "linje" | "runer" | "spokelser";
      }>;
      progression_config: { sigmoid: { k: number; midpoint: number } };
    };
  const { k, midpoint } = progression_config.sigmoid;
  const frost = getFrostLevel(day) ?? 0;
  const live = {
    frost: [frost, 100],
    linje: [100 - frost, 100],
    runer: [getLearnedRunes().size, ALLE_RUNER.size],
    spokelser: [
      Object.keys(KULDE_INTERCEPTS).filter((d) => Number(d) <= day).length,
      Object.keys(KULDE_INTERCEPTS).length,
    ],
  } as const;

  return metrics
    .filter((m) => m.unlock_day <= day)
    .map((m) => {
      let verdi: number;
      let maks = m.maks;
      if (m.kilde) [verdi, maks] = live[m.kilde];
      else {
        const base = calculateSigmoidValue(m.min, m.maks, day, k, midpoint);
        const bonus = 1 + completedQuestCount * m.child_progress_multiplier;
        verdi = Math.min(Math.round(base * bonus), m.maks);
      }
      // Frost is bad when high; everything else is bad when low
      const status =
        m.kilde === "frost"
          ? getMetricStatus(100 - verdi, 100)
          : getMetricStatus(verdi, maks);
      return {
        navn: m.navn,
        verdi,
        maks,
        displayType: m.display_type,
        unit: m.unit,
        description: m.description,
        status,
      };
    });
}
