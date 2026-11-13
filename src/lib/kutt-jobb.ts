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
 * (the child's pid), the log in kutt-NN.log, the exit code in kutt-NN.exit.
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

export interface KuttStatus {
  status: "ingen" | "kjorer" | "ferdig" | "feil";
  /** Repo-relative log path for the red line. */
  logg: string;
}

export function kuttStatus(dag: number): KuttStatus {
  const logg = `assets/out/kutt-${String(dag).padStart(2, "0")}.log`;
  if (existsSync(fil(dag, "lock")))
    return { status: levende(lesPid(dag)) ? "kjorer" : "feil", logg };
  if (existsSync(fil(dag, "exit")))
    return {
      status:
        readFileSync(fil(dag, "exit"), "utf8").trim() === "0"
          ? "ferdig"
          : "feil",
      logg,
    };
  return { status: "ingen", logg };
}

/** Starts the cut unless one runs for the day or this is not a checkout with assets/. `klar` resolves at exit (tests). */
export function startKutt(dag: number): {
  startet: boolean;
  klar?: Promise<number>;
} {
  const script = path.join(process.cwd(), "assets", "bin", "julius-dag.py");
  if (!existsSync(script) || !existsSync(ut())) return { startet: false };
  if (existsSync(fil(dag, "lock"))) {
    if (levende(lesPid(dag))) return { startet: false };
    unlinkSync(fil(dag, "lock"));
  }
  if (existsSync(fil(dag, "exit"))) unlinkSync(fil(dag, "exit"));
  const logg = openSync(fil(dag, "log"), "w");
  const barn = spawn("python3", [script, String(dag), "--kutt"], {
    cwd: process.cwd(),
    stdio: ["ignore", logg, logg],
  });
  closeSync(logg);
  writeFileSync(fil(dag, "lock"), String(barn.pid));
  const klar = new Promise<number>((resolve) => {
    const slutt = (kode: number) => {
      writeFileSync(fil(dag, "exit"), String(kode));
      if (existsSync(fil(dag, "lock"))) unlinkSync(fil(dag, "lock"));
      resolve(kode);
    };
    barn.on("error", () => slutt(127));
    barn.on("exit", (kode) => slutt(kode ?? 1));
  });
  return { startet: true, klar };
}
