import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { medLås } from "./vurdering-lager";
import { TAGGER } from "./vurdering-tagger";

/**
 * assets/laerdom.json (in git, season-independent): Hans' approved rules per
 * media type. The generators read the active ones (medie.py unngaa); agents
 * commit the file. «Avvist» holds suggestion ids Hans turned down.
 */
export interface Regel {
  type: string;
  regel: string;
  kilder: string[];
  dato: string;
  aktiv: boolean;
}
export interface Laerdom {
  regler: Regel[];
  avvist: string[];
}

export const laerdomFil = () =>
  process.env.LAERDOM_FIL ?? path.join(process.cwd(), "assets/laerdom.json");

export async function lesLaerdom(fil = laerdomFil()): Promise<Laerdom> {
  const d = JSON.parse(
    await readFile(fil, "utf8").catch(() => "{}"),
  ) as Partial<Laerdom>;
  return { regler: d.regler ?? [], avvist: d.avvist ?? [] };
}

export type Endring =
  | { handling: "regel"; type: string; regel: string; kilder: string[] }
  | { handling: "avvis"; kilder: string[] }
  | { handling: "av" | "på"; indeks: number };

/** Validates and applies one change under the shared file lock. */
export function endreLaerdom(e: Endring, fil = laerdomFil()) {
  return medLås(fil, async () => {
    const d = await lesLaerdom(fil);
    if (e.handling === "regel") {
      // One line: medie.py puts each rule on its own line in the prompt's «Unngå:» block.
      const regel = e.regel.replace(/\s+/g, " ").trim();
      if (!regel || regel.length > 200)
        throw new Error("Regelen må ha tekst (høyst 200 tegn)");
      if (!Object.hasOwn(TAGGER, e.type))
        throw new Error(`Ukjent type: ${e.type}`);
      d.regler.push({
        type: e.type,
        regel,
        kilder: e.kilder,
        dato: new Date().toISOString().slice(0, 10),
        aktiv: true,
      });
    } else if (e.handling === "avvis") {
      d.avvist = [...new Set([...d.avvist, ...e.kilder])];
    } else {
      const r = d.regler[e.indeks];
      if (!r) throw new Error("Fant ikke regelen");
      r.aktiv = e.handling === "på";
    }
    const tmp = `${fil}.tmp.${process.pid}`;
    await writeFile(tmp, JSON.stringify(d, null, 2) + "\n");
    await rename(tmp, fil);
    return d;
  });
}
