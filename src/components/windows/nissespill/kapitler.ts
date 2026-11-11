/**
 * Chapter registry and day gating for Klementin-Ekspressen. Story timeline per
 * docs/storyboard-2026.md: no Kulde before day 7, Vintervokteren known from day 15.
 */
import { getCurrentDay, getCurrentMonth } from "@/lib/date-utils";
import { KAPITTEL_1 } from "./kapittel1";
import { KAPITTEL_2 } from "./kapittel2";
import { KAPITTEL_3 } from "./kapittel3";
import { KAPITTEL_4 } from "./kapittel4";
import type { Kapittel } from "./motor";

export const KAPITLER: Kapittel[] = [
  KAPITTEL_1,
  KAPITTEL_2,
  KAPITTEL_3,
  KAPITTEL_4,
];

export const kapittel = (n: number) =>
  KAPITLER.find((k) => k.n === n) ?? KAPITTEL_1;

/** December day for unlocking; outside December nothing is open unless test mode. */
export function spilldag(): number {
  if (process.env.NEXT_PUBLIC_TEST_MODE === "true") return getCurrentDay();
  return getCurrentMonth() === 12 ? getCurrentDay() : 0;
}

export const erLaastOpp = (k: Kapittel, dag = spilldag()) => dag >= k.dag;
