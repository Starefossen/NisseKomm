import { createHash, randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  mkdir,
  readdir,
  realpath,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import type { NextRequest } from "next/server";
import { MEDIA_MANIFEST, mediaPath, type MediaStatus } from "./media";
import { isLanMode } from "./mode";
import { hasRole } from "./auth";
import { authenticate } from "./mcp/auth";
import { getStore } from "./db";

const MB = 1024 * 1024;

export const MEDIA_TYPES: Record<string, { type: string; max: number }> = {
  ".mp4": { type: "video/mp4", max: 50 * MB },
  ".mp3": { type: "audio/mpeg", max: 20 * MB },
  ".png": { type: "image/png", max: 10 * MB },
  ".jpg": { type: "image/jpeg", max: 10 * MB },
  ".webp": { type: "image/webp", max: 10 * MB },
};

export function mediaDir(): string {
  if (process.env.MEDIA_DIR) return process.env.MEDIA_DIR;
  // next dev keeps media in public/ so the local simulation works without a PVC
  return process.env.NODE_ENV === "development"
    ? path.join(process.cwd(), "public")
    : "/data/media";
}

const TICKET_MS = 10 * 60 * 1000;
const ticketHash = (t: string) => createHash("sha256").update(t).digest("hex");

const isManifestPath = (rel: string) =>
  MEDIA_MANIFEST.some((entry) => mediaPath(entry) === rel);

/** Extra NisseMusikk tracks: any MP3 directly under music/, beyond the manifest. */
export const isMusicTrack = (rel: string) => /^music\/[^/]+\.mp3$/i.test(rel);

const canUpload = (rel: string) => isManifestPath(rel) || isMusicTrack(rel);

/** Uploaded music/ MP3s not in the manifest, sorted by name. */
export async function extraMusic(dir = mediaDir()): Promise<MediaStatus[]> {
  const names = await readdir(path.join(dir, "music")).catch(() => []);
  const extra = names
    .map((n) => `music/${n.normalize("NFC")}`)
    .filter((p) => isMusicTrack(p) && !isManifestPath(p))
    .sort();
  return Promise.all(
    extra.map(async (p) => {
      const info = await stat(path.join(dir, p)).catch(() => null);
      return { path: p, size: info?.isFile() ? info.size : null };
    }),
  );
}

const MEDIA_DIRS = ["video", "audio", "music", "feed", "strek", "spill", "promo"];

/** Every media file under MEDIA_DIRS, so old versions, stills and sprites show up too. */
async function walk(dir: string, rel = ""): Promise<string[]> {
  const entries = await readdir(path.join(dir, rel), {
    withFileTypes: true,
  }).catch(() => []);
  const out: string[] = [];
  for (const e of entries) {
    const p = rel ? `${rel}/${e.name.normalize("NFC")}` : e.name;
    if (e.name.startsWith(".")) continue;
    if (e.isDirectory()) out.push(...(await walk(dir, p)));
    else if (path.extname(p).toLowerCase() in MEDIA_TYPES) out.push(p);
  }
  return out;
}

/** Single-use upload ticket for one manifest path, valid 10 minutes. */
export async function createUploadTicket(rel: string): Promise<string> {
  if (!canUpload(rel)) throw new Error(`Ukjent fil: ${rel}`);
  const ticket = randomBytes(24).toString("base64url");
  await getStore().putState(`upload-ticket:${ticketHash(ticket)}`, {
    path: rel,
    expires: Date.now() + TICKET_MS,
  });
  return ticket;
}

const redeemTicket = (ticket: string, rel: string) =>
  getStore().consumeTicket(ticketHash(ticket), rel);

const forbidden = () => new Response("Krever forelder", { status: 403 });
const unauthorized = () => new Response("Ikke innlogget", { status: 401 });

/**
 * Parent cookie, parent Bearer (MCP auth) or, with `rel` (PUT), a ticket
 * bound to that path. Returns an error Response, or null when allowed.
 */
export async function authorizeMedia(
  req: NextRequest,
  rel?: string,
): Promise<Response | null> {
  if (!isLanMode()) return new Response("Ikke funnet", { status: 404 });
  const ticket = req.nextUrl.searchParams.get("ticket");
  if (ticket && rel !== undefined) {
    return (await redeemTicket(ticket, rel)) ? null : forbidden();
  }
  if (req.headers.get("authorization")) {
    const caller = await authenticate(req);
    if (!caller) return unauthorized();
    return caller.level === "parent" ? null : forbidden();
  }
  if (await hasRole(req, "parent")) return null;
  return (await hasRole(req, "kid")) ? forbidden() : unauthorized();
}

/** Absolute path inside MEDIA_DIR, or null if the path escapes it or has an unknown type. */
export function resolveMedia(parts: string[], dir = mediaDir()): string | null {
  const rel = parts.join("/").normalize("NFC");
  if (!(path.extname(rel).toLowerCase() in MEDIA_TYPES)) return null;
  const root = path.resolve(dir);
  const abs = path.resolve(root, rel);
  return abs.startsWith(root + path.sep) ? abs : null;
}

export async function serveMedia(
  parts: string[],
  range: string | null,
  dir = mediaDir(),
  ifNoneMatch: string | null = null,
): Promise<Response> {
  const abs = resolveMedia(parts, dir);
  if (!abs) return new Response("Ugyldig sti", { status: 400 });
  // A symlink inside MEDIA_DIR must not lead outside it.
  const [real, root] = await Promise.all([
    realpath(abs).catch(() => null),
    realpath(dir).catch(() => null),
  ]);
  if (!real || !root || !real.startsWith(root + path.sep)) {
    return new Response("Ikke funnet", { status: 404 });
  }
  const info = await stat(real).catch(() => null);
  if (!info?.isFile()) return new Response("Ikke funnet", { status: 404 });
  const etag = `"${info.size.toString(36)}-${info.mtimeMs.toString(36)}"`;

  const headers: Record<string, string> = {
    "Content-Type": MEDIA_TYPES[path.extname(abs).toLowerCase()].type,
    "Accept-Ranges": "bytes",
    // Files are swapped by upload: always revalidate (cheap 304 via ETag).
    "Cache-Control": "no-cache",
    ETag: etag,
    "Last-Modified": info.mtime.toUTCString(),
  };
  if (ifNoneMatch?.split(",").some((t) => t.trim() === etag)) {
    return new Response(null, { status: 304, headers });
  }
  let start = 0;
  let end = info.size - 1;
  let status = 200;
  const m = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (range && m && (m[1] || m[2])) {
    if (m[1]) {
      start = Number(m[1]);
      if (m[2]) end = Math.min(Number(m[2]), end);
    } else {
      start = Math.max(info.size - Number(m[2]), 0);
    }
    if (start > end) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${info.size}` },
      });
    }
    status = 206;
    headers["Content-Range"] = `bytes ${start}-${end}/${info.size}`;
  }
  headers["Content-Length"] = String(end - start + 1);
  const body =
    info.size === 0
      ? null
      : (Readable.toWeb(
          createReadStream(real, { start, end }),
        ) as ReadableStream<Uint8Array>);
  return new Response(body, { status, headers });
}

export async function mediaStatus(dir = mediaDir()): Promise<MediaStatus[]> {
  const found = (await Promise.all(MEDIA_DIRS.map((d) => walk(dir, d)))).flat();
  const all = new Set(found);
  const manifest = MEDIA_MANIFEST.map(mediaPath);
  const known = new Set(manifest);
  const extra = found
    .filter(
      (p) =>
        !known.has(p) &&
        // a poster frame written beside its video is not a file of its own
        !(p.endsWith(".jpg") && all.has(p.replace(/\.jpg$/, ".mp4"))),
    )
    .sort();
  return Promise.all(
    [...manifest, ...extra].map(async (p) => {
      const info = await stat(path.join(dir, p)).catch(() => null);
      return { path: p, size: info?.isFile() ? info.size : null };
    }),
  );
}

/** Rejects a declared body larger than any media type allows, before it is read. */
export function tooLarge(contentLength: string | null): boolean {
  const max = Math.max(...Object.values(MEDIA_TYPES).map((r) => r.max));
  return Number(contentLength ?? 0) > max;
}

/** Validates and atomically writes one manifest file (lan mode only). */
export async function uploadMedia(
  parts: string[],
  contentType: string | null,
  data: ArrayBuffer,
  dir = mediaDir(),
): Promise<Response> {
  if (!isLanMode()) return new Response("Ikke funnet", { status: 404 });
  const rel = parts.join("/").normalize("NFC");
  const abs = resolveMedia(parts, dir);
  if (!abs || !canUpload(rel)) {
    return new Response("Ukjent fil", { status: 400 });
  }
  const rule = MEDIA_TYPES[path.extname(abs).toLowerCase()];
  if (contentType?.split(";")[0].trim() !== rule.type) {
    return new Response(`Forventet ${rule.type}`, { status: 415 });
  }
  if (data.byteLength === 0 || data.byteLength > rule.max) {
    return new Response("Feil størrelse", { status: 413 });
  }
  const tmp = `${abs}.${process.pid}.${Date.now()}.tmp`;
  try {
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(tmp, new Uint8Array(data));
    await rename(tmp, abs);
  } catch (e) {
    await unlink(tmp).catch(() => {});
    const code = (e as NodeJS.ErrnoException).code;
    // The public service mounts the PVC read-only.
    if (code === "EROFS" || code === "EACCES") {
      return new Response("Mediemappen er skrivebeskyttet", { status: 503 });
    }
    throw e;
  }
  return Response.json({ path: rel, size: data.byteLength }, { status: 201 });
}
