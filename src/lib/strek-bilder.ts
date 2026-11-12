import { readdirSync } from "node:fs";
import path from "node:path";
import { variantOf, versionKey } from "./media-status";

/** Per day: the plain file in use, else the newest -vN candidate (same rules as the media overview). */
export function strekBilder(
  dir: string,
): ({ fil: string; kandidat: boolean } | null)[] {
  let filer: string[] = [];
  try {
    filer = readdirSync(path.join(dir, "strek")).filter((f) =>
      /^dag\d\d(-v\d+)?\.png$/.test(f),
    );
  } catch {}
  return Array.from({ length: 24 }, (_, i) => {
    const nøkkel = `dag${String(i + 1).padStart(2, "0")}.png`;
    const treff = filer.filter((f) => versionKey(f) === nøkkel);
    if (treff.includes(nøkkel)) return { fil: nøkkel, kandidat: false };
    const ny = treff.sort((a, b) => variantOf(b) - variantOf(a))[0];
    return ny ? { fil: ny, kandidat: true } : null;
  });
}
