/**
 * Chapter registry and day gating for Klementin-Ekspressen. Chapters 2–4 are
 * outlines (klar: false): scene and puzzle stubs with TODO text, so writing can
 * continue in data without touching the engine. Story timeline per
 * docs/storyboard-2026.md: no Kulde before day 7, Vintervokteren known from day 15.
 */
import { getCurrentDay, getCurrentMonth } from "@/lib/date-utils";
import { KAPITTEL_1 } from "./kapittel1";
import { KAPITTEL_2 } from "./kapittel2";
import { KAPITTEL_3 } from "./kapittel3";
import type { Kapittel, Scene } from "./motor";

const TODO = "TODO: tekst kommer.";

const stubScene = (
  id: string,
  navn: string,
  bilde: string,
  til: string,
): Scene => ({
  id,
  navn,
  bilde,
  utganger: [{ til, navn: `Gå til ${til}` }],
  hotspots: [
    {
      id: `${id}_todo`,
      navn: navn,
      rect: { x: 30, y: 30, w: 40, h: 40 },
      smart: "se",
      se: TODO,
    },
  ],
});

const stub = (
  n: number,
  tittel: string,
  dag: number,
  scener: Scene[],
  gaater: { id: string; ferdig: string }[],
): Kapittel => ({
  n,
  tittel,
  dag,
  klar: false,
  start: scener[0].id,
  slutt: `k${n}_ferdig`,
  intro: [TODO],
  utro: TODO,
  gjenstander: {},
  kombinasjoner: [],
  dialoger: {},
  scener,
  gaater: gaater.map((g) => ({ ...g, tips: [TODO, TODO, TODO] })),
});

/**
 * Kapittel 4 (dag 22, gate open, sleigh readied): Julius' glasses under a brooding
 * letter bird (tickle with a feather), the bell fished out from behind the wood box
 * with magnet and twine, tallow on the gate winch. Ends with Julius' thumbs-up.
 */
const KAPITTEL_4 = stub(
  4,
  "Klar til avgang",
  22,
  [
    stubScene(
      "porten",
      "Porten til Snøfall",
      "spill/port-aapen.jpg",
      "kontor4",
    ),
    stubScene("kontor4", "Julius' kontor", "feed/julius-kontor.jpg", "porten"),
  ],
  [
    { id: "briller", ferdig: "briller_levert" },
    { id: "bjelle", ferdig: "bjelle_montert" },
    { id: "port", ferdig: "k4_ferdig" },
  ],
);

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
