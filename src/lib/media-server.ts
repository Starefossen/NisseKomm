import { createHash, randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import type { NextRequest } from "next/server";
import { MEDIA_MANIFEST, mediaPath, type MediaStatus } from "./media";
import { isLanMode } from "./mode";
import { getRole } from "./auth";
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
const ticketKey = (t: string) =>
  `upload-ticket:${createHash("sha256").update(t).digest("hex")}`;

const isManifestPath = (rel: string) =>
  MEDIA_MANIFEST.some((entry) => mediaPath(entry) === rel);

/** Single-use upload ticket for one manifest path, valid 10 minutes. */
export async function createUploadTicket(rel: string): Promise<string> {
  if (!isManifestPath(rel)) throw new Error(`Ukjent fil: ${rel}`);
  const ticket = randomBytes(24).toString("base64url");
  await getStore().putState(ticketKey(ticket), {
    path: rel,
    expires: Date.now() + TICKET_MS,
  });
  return ticket;
}

// ponytail: read-then-null is not atomic; two PUTs racing within ms could
// both pass. Add a Store.takeTicket (DELETE … RETURNING) if that matters.
async function redeemTicket(ticket: string, rel: string): Promise<boolean> {
  const store = getStore();
  const key = ticketKey(ticket);
  const t = (await store.getState())[key] as
    { path: string; expires: number } | null | undefined;
  if (!t) return false;
  await store.putState(key, null);
  return t.path === rel && t.expires > Date.now();
}

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
  const role = await getRole(req);
  if (!role) return unauthorized();
  return role === "parent" ? null : forbidden();
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
): Promise<Response> {
  const abs = resolveMedia(parts, dir);
  if (!abs) return new Response("Ugyldig sti", { status: 400 });
  const info = await stat(abs).catch(() => null);
  if (!info?.isFile()) return new Response("Ikke funnet", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": MEDIA_TYPES[path.extname(abs).toLowerCase()].type,
    "Accept-Ranges": "bytes",
    // Files can be replaced by upload, so revalidate rather than cache forever.
    "Cache-Control": "public, max-age=3600, must-revalidate",
    "Last-Modified": info.mtime.toUTCString(),
  };
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
          createReadStream(abs, { start, end }),
        ) as ReadableStream<Uint8Array>);
  return new Response(body, { status, headers });
}

export async function mediaStatus(dir = mediaDir()): Promise<MediaStatus[]> {
  return Promise.all(
    MEDIA_MANIFEST.map(async (entry) => {
      const p = mediaPath(entry);
      const info = await stat(path.join(dir, p)).catch(() => null);
      return { path: p, size: info?.isFile() ? info.size : null };
    }),
  );
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
  if (!abs || !isManifestPath(rel)) {
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
