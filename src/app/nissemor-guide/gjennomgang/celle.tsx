"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { GameEngine } from "@/lib/game-engine";
import { brukbar, celleAv, celleFor, MERKE } from "@/lib/media-status";
import { videoStatus } from "@/lib/segmenter";
import type { Laerdom } from "@/lib/laerdom";
import { useSesong, type Sesong } from "../_kveld/felles";
import { kilde, useMediaData } from "../media/kort";
import { StatusI, useVurderinger } from "../vurdering";
import { versionKey } from "@/lib/media-status";
import { alleElementer, tilstand, type Element } from "./elementer";
import {
  arbeidTekst,
  byggKo,
  fremdrift,
  prioritetFor,
  type Fremdrift,
  type KoServer,
} from "./ko";

/** Everything Gjennomgang (and Filer) derive status from. */
export function useData() {
  const sesong = useSesong();
  const media = useMediaData();
  const vurd = useVurderinger();
  const krypto = GameEngine.getAllQuests().filter(
    (q) => q.decryption_challenge,
  ).length;
  const [server, setServer] = useState<KoServer | null>(null);
  useEffect(() => {
    fetch("/api/media/ko")
      .then((r) => (r.ok ? r.json() : null))
      .then(setServer)
      .catch(() => setServer(null));
  }, []);
  const settLaerdom = (laerdom: Laerdom) =>
    setServer((s) => (s ? { ...s, laerdom } : s));
  const settServer = (f: (s: KoServer) => KoServer) =>
    setServer((s) => (s ? f(s) : s));
  return { sesong, media, vurd, krypto, server, settLaerdom, settServer };
}
export type Data = ReturnType<typeof useData>;

export function useKo(d: Data, sesong: Sesong) {
  const liste = alleElementer("dag", sesong, d.media.files, d.krypto);
  const k = { ...kilde(d.media), vurderinger: d.vurd ?? {} };
  const ko = d.server ? byggKo(liste, k, d.server) : null;
  const fd = ko ? fremdrift(liste, k, ko, d.server ?? {}) : null;
  return { liste, ko, fd };
}

/** Cell words and fills, the same colours as the progress bar. */
export const CELLE: Record<Fremdrift, [string, string]> = {
  godkjent: ["✓ godkjent", "bg-(--gold) text-black"],
  ok: ["◐ OK", "bg-amber-300 text-black"],
  venter: ["● se på", "bg-(--cold-blue) text-black"],
  agent: ["✗ fikses", "bg-(--christmas-red) text-white"],
  mangler: ["mangler", "bg-(--gray) text-black"],
  valgfri: ["valgfri", "bg-(--gray)/30"],
  ikke: ["ikke aktuelt", "bg-(--gray)/30"],
};

/** Without the queue (still loading): the verdict alone. */
const statusAvCelle = (c: ReturnType<typeof tilstand>["celle"]): Fremdrift =>
  c === "godkjent" || c === "ok" || c === "mangler" || c === "valgfri"
    ? c
    : c === "lag_paa_nytt"
      ? "agent"
      : "venter";

export interface CelleData {
  e: Element;
  status: Fremdrift;
  /** «✗ kuttes» or a Julius progress line, replacing the status word. */
  ord?: string;
  /** «+v4 ✓»: a newer candidate under the main status. */
  kandidat?: string;
  notat?: string;
  celle: string;
  /** «⚙ agent · hva · siden 14:32» while an agent works on it. */
  arbeid?: string;
}

/** One element's matrix cell: the progress bar's status, Julius per segment. */
export function useCelle(d: Data, sesong: Sesong) {
  const vurd = d.vurd ?? {};
  const k = { ...kilde(d.media), vurderinger: vurd };
  const { fd } = useKo(d, sesong);
  const status = new Map<string, Fremdrift>(
    (fd?.poster ?? []).map((x) => [x.id, x.status]),
  );
  return (e: Element): CelleData => {
    const ti = tilstand(e, k);
    const st = status.get(e.id) ?? statusAvCelle(ti.celle);
    let ord: string | undefined;
    // A segmented Julius day: «3/4 ✓», or the cut/take the worst segment waits for.
    const segs = e.gruppe === "julius" && e.dag ? d.server?.manus[e.dag] : null;
    const sid = (n: number) =>
      `video/julius/dag-${String(e.dag).padStart(2, "0")}#s${n}`;
    if (segs?.length && segs.some((n) => vurd[sid(n)])) {
      const vs = videoStatus(
        segs.map((s) => ({ s })),
        (n) => vurd[sid(n)],
      );
      const ok = segs.filter((n) => brukbar(celleAv(vurd[sid(n)]))).length;
      if (vs.steg === "kutt") ord = "✗ kuttes";
      if (vs.steg === "vurder" && st === "venter")
        ord = `● ${ok}/${segs.length} ✓`;
    }
    const arbeid = prioritetFor(e.id, d.server?.arbeid ?? {}, e.media);
    const fam = e.media.length ? celleFor(e.media, k).familie : undefined;
    const kand = fam?.kandidat;
    return {
      e,
      status: st,
      ord,
      kandidat: kand
        ? `+${kand.navn} ${MERKE[kand.celle][0]}${brukbar(kand.celle) ? " klar" : ""}`
        : undefined,
      notat: ti.notat,
      ...(arbeid ? { arbeid: arbeidTekst(arbeid) } : {}),
      celle:
        MERKE[ti.celle][2] +
        (fam?.iBruk.utdatert ? ` · ${fam.iBruk.utdatert}` : ""),
    };
  };
}

/** The cell as a link into the element view; the matrix and Filer both use it. */
export function StatusBrikke({
  c,
  href,
  dempet = false,
}: {
  c: CelleData;
  href: string;
  dempet?: boolean;
}) {
  const [ord, farge] = CELLE[c.status];
  return (
    <Link
      href={href}
      data-status={c.status}
      title={`${c.e.tittel}: i bruk ${c.celle}${c.notat ? ` – ${c.notat}` : ""}${c.arbeid ? ` · under arbeid: ${c.arbeid}` : ""}`}
      className={`flex flex-col items-center justify-center min-h-11 min-w-11 px-1 whitespace-nowrap hover:opacity-70 ${farge} ${dempet ? "opacity-40" : ""}`}
    >
      {c.ord ?? ord}
      {c.kandidat && <span className="text-sm">{c.kandidat}</span>}
      {c.arbeid && (
        <span className="text-sm" title={c.arbeid}>
          ⚙ under arbeid
        </span>
      )}
    </Link>
  );
}

/** The day view's status cells: each id → its element's StatusBrikke, linked into Gjennomgang. */
export function DagStatus({ children }: { children: ReactNode }) {
  const d = useData();
  if (!d.sesong || !d.vurd || !d.media.files)
    return <StatusI.Provider value={() => null}>{children}</StatusI.Provider>;
  return (
    <MedStatus d={d} sesong={d.sesong}>
      {children}
    </MedStatus>
  );
}

function MedStatus({
  d,
  sesong,
  children,
}: {
  d: Data;
  sesong: Sesong;
  children: ReactNode;
}) {
  const celle = useCelle(d, sesong);
  const liste = alleElementer("dag", sesong, d.media.files, d.krypto);
  const fn = (id: string) => {
    const e = liste.find(
      (x) =>
        x.id === id || x.media.some((p) => versionKey(p) === versionKey(id)),
    );
    return e ? (
      <StatusBrikke
        c={celle(e)}
        href={`/nissemor-guide/gjennomgang?id=${encodeURIComponent(e.id)}${e.dag ? `&dag=${e.dag}` : ""}`}
      />
    ) : null;
  };
  return <StatusI.Provider value={fn}>{children}</StatusI.Provider>;
}
