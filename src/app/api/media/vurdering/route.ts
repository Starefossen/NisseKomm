import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { authorizeMedia, mediaDir } from "@/lib/media-server";
import { medVersjon, versjonAv, type Forrige } from "@/lib/vurdering-versjon";

/** «ok» = usable with flaws; its note is a lesson for later generation. */
export type Verdikt = "godkjent" | "ok" | "lag_paa_nytt";

export interface MediaVurderingItem {
  vurdering?: Verdikt;
  notat?: string;
  oppdatert?: string;
  /** What was reviewed: file size-mtime or a hash of the section text. */
  versjon?: string;
  /** Set when served: the verdict given to an earlier version. */
  forrige?: Forrige;
}

export type MediaVurderinger = Record<string, MediaVurderingItem>;

const badRequest = () => new Response("Ugyldig forespørsel", { status: 400 });
const serverError = () => new Response("Serverfeil", { status: 500 });

function isSafePath(p: string): boolean {
  if (typeof p !== "string" || !p.trim()) return false;
  if (p.includes("\0")) return false;
  const trimmed = p.trim();
  const normalized = path.normalize(trimmed);
  if (
    normalized.startsWith("..") ||
    normalized.includes("..") ||
    path.isAbsolute(trimmed) ||
    path.isAbsolute(normalized) ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("\\")
  ) {
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;

  const file = path.join(mediaDir(), "media-vurdering.json");
  try {
    const data = await readFile(file, "utf8");
    return Response.json(await medVersjon(mediaDir(), JSON.parse(data)));
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return Response.json({});
    }
    return serverError();
  }
}

// «Godkjenn alle på dagen» posts in parallel; read-modify-write must not interleave.
let kø: Promise<unknown> = Promise.resolve();

export async function POST(req: NextRequest) {
  const svar = kø.then(() => lagre(req));
  kø = svar.catch(() => {});
  return svar;
}

async function lagre(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest();
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return badRequest();
  }

  const { path: relPath, vurdering, notat } = body as Record<string, unknown>;

  if (typeof relPath !== "string" || !isSafePath(relPath)) {
    return badRequest();
  }

  const cleanPath = relPath.trim();

  const allowedVerdicts = ["godkjent", "ok", "lag_paa_nytt", null, ""];
  if (
    vurdering !== undefined &&
    !allowedVerdicts.includes(vurdering as string | null)
  ) {
    return badRequest();
  }

  if (
    notat !== undefined &&
    (typeof notat !== "string" || notat.length > 1000)
  ) {
    return badRequest();
  }

  const dir = mediaDir();
  const target = path.join(dir, "media-vurdering.json");

  let current: MediaVurderinger = {};
  try {
    const text = await readFile(target, "utf8");
    current = JSON.parse(text);
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      current = {};
    }
  }

  // Real wall-clock time: TIDSMASKIN mocks date-utils, and review notes need the actual time.
  const now = new Date(Date.now()).toISOString();
  const prev = current[cleanPath] || {};

  const nextVerdict =
    vurdering !== undefined
      ? (vurdering as Verdikt | null | "")
      : prev.vurdering;

  const nextNote =
    notat !== undefined ? (notat as string).trim() : (prev.notat ?? "");

  // A redo without a note tells the generator nothing.
  if (nextVerdict === "lag_paa_nytt" && !nextNote) return badRequest();

  if (!nextVerdict && !nextNote) {
    delete current[cleanPath];
  } else {
    const versjon = await versjonAv(dir, cleanPath);
    current[cleanPath] = {
      ...(nextVerdict ? { vurdering: nextVerdict } : {}),
      ...(nextNote ? { notat: nextNote } : {}),
      oppdatert: now,
      ...(versjon ? { versjon } : {}),
    };
  }

  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  try {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(tmp, JSON.stringify(current, null, 2) + "\n");
    await rename(tmp, target);
  } catch {
    await unlink(tmp).catch(() => {});
    return serverError();
  }

  return Response.json({
    ok: true,
    path: cleanPath,
    entry: current[cleanPath] ?? null,
    vurderinger: await medVersjon(dir, current),
  });
}
