import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import manus from "@/data/julius-manus.json";
import { forbruk } from "@/lib/forbruk";
import { kuttStatus } from "@/lib/kutt-jobb";
import { authorizeMedia, mediaDir, mediaStatus } from "@/lib/media-server";
import { versionKey } from "@/lib/media-status";
import type { KoServer } from "@/app/nissemor-guide/gjennomgang/ko";
import {
  filHash,
  flat,
  lesLager,
  nyesteSegmenter,
  prioriteter,
  sløyfe,
} from "@/lib/vurdering-lager";
import { lesLaerdom } from "@/lib/laerdom";
import { lesBeslutninger } from "@/lib/beslutninger";

/** The queue's server half: budget, duplicate files and image job ids (assets/ only exists in a checkout). */
export async function GET(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  const dir = mediaDir();
  const lager = await lesLager(dir);
  const vurdert = flat(lager);
  // Same bytes as a reviewed version of the family: nothing new to look at.
  const kjente = new Map<string, Set<string>>();
  for (const [key, e] of Object.entries(lager.elementer))
    kjente.set(
      versionKey(key),
      new Set(e.vurderinger.filter((v) => v.vurdering).map((v) => v.hash)),
    );
  const duplikater: string[] = [];
  await Promise.all(
    (await mediaStatus(dir)).map(async (f) => {
      const hasher = kjente.get(versionKey(f.path));
      if (!hasher?.size || f.size === null || vurdert[f.path]?.vurdering)
        return;
      const info = await stat(path.join(dir, f.path)).catch(() => null);
      if (!info?.isFile()) return;
      const h = await filHash(
        path.join(dir, f.path),
        `${info.size}-${Math.round(info.mtimeMs)}`,
      );
      if (hasher.has(h)) duplikater.push(f.path);
    }),
  );
  const logg =
    process.env.FORBRUK_LOGG ??
    path.join(process.cwd(), "assets/out/forbruk.jsonl");
  const medier = JSON.parse(
    await readFile(
      path.join(process.cwd(), "assets/medier.json"),
      "utf8",
    ).catch(() => "{}"),
  ) as Record<string, { ut?: string }>;
  const jobber = Object.fromEntries(
    Object.entries(medier)
      .filter(([, j]) => j.ut)
      .map(([k, j]) => [j.ut!, k.replace("/", ":")]),
  );
  // Machine flags per segment of the day's newest join (a candidate -vN before the plain name).
  const flagg: KoServer["flagg"] = {};
  const segtid: NonNullable<KoServer["segtid"]> = {};
  await Promise.all(
    Object.keys(manus).map(async (d) => {
      const segs = await nyesteSegmenter<{
        s: number;
        start: number;
        slutt: number;
        flagg?: string[];
      }>(dir, Number(d));
      const f = segs
        .filter((x) => x.flagg?.length)
        .map((x) => ({ s: x.s, flagg: x.flagg! }));
      if (f.length) flagg[d] = f;
      segtid[d] = segs.map(({ s, start, slutt }) => ({ s, start, slutt }));
    }),
  );
  // Automatic cuts that failed: a red line in «Hos agent» with the log path.
  const kuttFeil: Record<string, string> = {};
  const sl = sløyfe(lager);
  for (let d = 1; d <= 24; d++) {
    const k = kuttStatus(d);
    if (k.status === "feil") kuttFeil[d] = k.logg;
    // A running cut is «under arbeid» on its own: the run is the update.
    if (k.status === "kjorer") {
      const fil = `video/julius/dag-${String(d).padStart(2, "0")}.mp4`;
      sl.arbeid[versionKey(fil)] = {
        fil,
        av: "agent:kutt",
        hva: k.ko ? "kutter (en til i kø)" : "kutter",
        når: new Date(Date.now()).toISOString(),
      };
    }
  }
  return Response.json({
    prioriteter: prioriteter(lager),
    ...sl,
    flagg,
    kuttFeil,
    segtid,
    laerdom: await lesLaerdom(),
    beslutninger: await lesBeslutninger(),
    forbruk: forbruk(await readFile(logg, "utf8").catch(() => "")),
    duplikater,
    jobber,
    manus: Object.fromEntries(
      Object.entries(manus).map(([d, segs]) => [d, segs.map((x) => x.s)]),
    ),
  });
}
