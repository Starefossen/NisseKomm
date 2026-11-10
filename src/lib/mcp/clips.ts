/**
 * Rampenissen's radio clips for get_clips, read from the media library.
 * The URL is served by /media with a strong ETag and Range.
 */
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { mediaDir } from "@/lib/media-server";
import { mediaUrl } from "@/lib/media";

const BITRATES = [
  0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320,
];
const RATES = [44100, 48000, 32000];

/**
 * Seconds of an MPEG-1 Layer III file: Xing/Info frame count if present,
 * else size over the first frame's bitrate (CBR).
 */
export function mp3Duration(buf: Buffer): number | null {
  let i = 0;
  if (buf.subarray(0, 3).toString("latin1") === "ID3") {
    i = 10 + ((buf[6] << 21) | (buf[7] << 14) | (buf[8] << 7) | buf[9]);
  }
  for (; i + 4 < buf.length; i++) {
    if (buf[i] !== 0xff || (buf[i + 1] & 0xfe) !== 0xfa) continue;
    const kbps = BITRATES[buf[i + 2] >> 4];
    const rate = RATES[(buf[i + 2] >> 2) & 3];
    if (!kbps || !rate) continue;
    const mono = buf[i + 3] >> 6 === 3;
    const x = i + 4 + (mono ? 17 : 32);
    const tag = buf.subarray(x, x + 4).toString("latin1");
    if ((tag === "Xing" || tag === "Info") && buf[x + 7] & 1) {
      // A truncated header has no trustworthy frame count.
      if (x + 12 > buf.length) return null;
      return Math.round((buf.readUInt32BE(x + 8) * 1152 * 100) / rate) / 100;
    }
    return Math.round(((buf.length - i) * 8 * 100) / (kbps * 1000)) / 100;
  }
  return null;
}

const cache = new Map<
  string,
  { key: string; sha256: string; duration_s: number | null }
>();

export async function getClip(day: number, dir = mediaDir()) {
  const rel = `audio/rampenissen/dag-${String(day).padStart(2, "0")}.mp3`;
  const base = { id: `rampenissen-${day}`, url: mediaUrl(rel) };
  const abs = path.join(dir, rel);
  const info = await stat(abs).catch(() => null);
  if (!info?.isFile() || info.size === 0) {
    return { ...base, ready: false, duration_s: null, sha256: null };
  }
  const key = `${info.size}-${info.mtimeMs}`;
  let hit = cache.get(abs);
  if (hit?.key !== key) {
    const buf = await readFile(abs);
    hit = {
      key,
      sha256: createHash("sha256").update(buf).digest("hex"),
      duration_s: mp3Duration(buf),
    };
    cache.set(abs, hit);
  }
  return {
    ...base,
    ready: true,
    duration_s: hit.duration_s,
    sha256: hit.sha256,
  };
}
