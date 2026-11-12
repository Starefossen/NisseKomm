/** @jest-environment node */
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect } from "@jest/globals";
import { strekBilder } from "../strek-bilder";
import { strekTitler } from "../guide-sesong";

describe("rampestrekark: bilder", () => {
  it("plain file wins, else newest candidate", () => {
    const d = mkdtempSync(path.join(os.tmpdir(), "strek-"));
    mkdirSync(path.join(d, "strek"));
    for (const f of [
      "dag01.png",
      "dag01-v1.png",
      "dag02-v1.png",
      "dag02-v10.png",
      "dag02-v2.png",
      "dag03.old-1.png",
    ])
      writeFileSync(path.join(d, "strek", f), "");
    const b = strekBilder(d);
    expect(b[0]).toEqual({ fil: "dag01.png", kandidat: false });
    expect(b[1]).toEqual({ fil: "dag02-v10.png", kandidat: true });
    expect(b[2]).toBeNull();
  });

  it("alle 24 titler finnes", () => {
    expect(strekTitler().every((t) => t.length > 0)).toBe(true);
  });

  // public/strek is gitignored: only checks where the media library is present.
  const dir = process.env.MEDIA_DIR ?? "public";
  const harDir = existsSync(path.join(dir, "strek"));
  (harDir ? it : it.skip)(
    "every day with a file or candidate has an image",
    () => {
      const filer = readdirSync(path.join(dir, "strek"));
      strekBilder(dir).forEach((b, i) => {
        const n = String(i + 1).padStart(2, "0");
        const finnes = filer.some((f) =>
          new RegExp(`^dag${n}(-v\\d+)?\\.png$`).test(f),
        );
        expect(b !== null).toBe(finnes);
      });
    },
  );
});
