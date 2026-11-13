import { spawn } from "node:child_process";
import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

/**
 * ✂ runs by itself: `python3 assets/bin/julius-dag.py NN --kutt` in the background (0 kr + a ~0.1 kr
 * transcription). Only the day number comes from outside. One run per day via assets/out/kutt-NN.lock
 * (the child's pid), the log in kutt-NN.log, the exit code in kutt-NN.exit. A ✂ saved while a run is going
 * leaves kutt-NN.ko: the run starts again when it ends, so the new ✂ is cut too. A run is killed (its whole
 * process group; julius-dag.py rolls the takes back) by «Avbryt» or after KUTT_MAKS_MS.
 */
export const kuttDag = (d: unknown): number | null =>
  typeof d === "number" && Number.isInteger(d) && d >= 1 && d <= 24 ? d : null;

const ut = () => path.join(process.cwd(), "assets", "out");
const fil = (dag: number, ext: string) =>
  path.join(ut(), `kutt-${String(dag).padStart(2, "0")}.${ext}`);
const levende = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
const lesPid = (dag: number) =>
  Number(readFileSync(fil(dag, "lock"), "utf8")) || 0;

const KUTT_MAKS_MS = 15 * 60 * 1000;

export interface KuttStatus {
  status: "ingen" | "kjorer" | "ferdig" | "feil";
  /** Repo-relative log path for the red line. */
  logg: string;
  /** Another ✂ waits for this run to end («Kutt i kø»). */
  ko?: boolean;
  /** After «ferdig»: the new version, `video/julius/dag-NN-vN.mp4` (the run's last line). */
  ny?: string;
}

export function kuttStatus(dag: number): KuttStatus {
  const logg = `assets/out/kutt-${String(dag).padStart(2, "0")}.log`;
  const ko = existsSync(fil(dag, "ko")) ? { ko: true } : {};
  if (existsSync(fil(dag, "lock")))
    return { status: levende(lesPid(dag)) ? "kjorer" : "feil", logg, ...ko };
  if (existsSync(fil(dag, "exit"))) {
    if (readFileSync(fil(dag, "exit"), "utf8").trim() !== "0")
      return { status: "feil", logg, ...ko };
    const ny = readFileSync(fil(dag, "log"), "utf8").match(
      /(dag-\d\d-v\d+\.mp4)\s*$/,
    )?.[1];
    return {
      status: "ferdig",
      logg,
      ...ko,
      ...(ny ? { ny: `video/julius/${ny}` } : {}),
    };
  }
  return { status: "ingen", logg, ...ko };
}

/** «Avbryt»: kills the run's process group; julius-dag.py puts the takes back on SIGTERM. */
export function avbrytKutt(dag: number): boolean {
  if (existsSync(fil(dag, "ko"))) unlinkSync(fil(dag, "ko"));
  if (!existsSync(fil(dag, "lock"))) return false;
  const pid = lesPid(dag);
  if (!levende(pid)) return false;
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    process.kill(pid, "SIGTERM");
  }
  return true;
}

/**
 * Starts the cut unless this is not a checkout with assets/; while one runs for the day it queues
 * (`ko`). `klar` resolves when the run and any queued rerun have exited (tests).
 */
export function startKutt(
  dag: number,
  maksMs = KUTT_MAKS_MS,
): {
  startet: boolean;
  ko?: boolean;
  klar?: Promise<number>;
} {
  const script = path.join(process.cwd(), "assets", "bin", "julius-dag.py");
  if (!existsSync(script) || !existsSync(ut())) return { startet: false };
  if (existsSync(fil(dag, "lock"))) {
    if (levende(lesPid(dag))) {
      writeFileSync(fil(dag, "ko"), "");
      return { startet: false, ko: true };
    }
    unlinkSync(fil(dag, "lock"));
  }
  if (existsSync(fil(dag, "exit"))) unlinkSync(fil(dag, "exit"));
  const logg = openSync(fil(dag, "log"), "w");
  const barn = spawn("python3", [script, String(dag), "--kutt"], {
    cwd: process.cwd(),
    stdio: ["ignore", logg, logg],
    // Its own process group, so «Avbryt» also stops the join it runs.
    detached: true,
  });
  closeSync(logg);
  writeFileSync(fil(dag, "lock"), String(barn.pid));
  const vakt = setTimeout(() => avbrytKutt(dag), maksMs);
  vakt.unref();
  const klar = new Promise<number>((resolve) => {
    let ferdig = false;
    const slutt = (kode: number) => {
      if (ferdig) return;
      ferdig = true;
      clearTimeout(vakt);
      writeFileSync(fil(dag, "exit"), String(kode));
      if (existsSync(fil(dag, "lock"))) unlinkSync(fil(dag, "lock"));
      if (existsSync(fil(dag, "ko"))) {
        unlinkSync(fil(dag, "ko"));
        const igjen = startKutt(dag, maksMs);
        if (igjen.klar) return void igjen.klar.then(resolve);
      }
      resolve(kode);
    };
    barn.on("error", () => slutt(127));
    barn.on("exit", (kode) => slutt(kode ?? 1));
  });
  return { startet: true, klar };
}
