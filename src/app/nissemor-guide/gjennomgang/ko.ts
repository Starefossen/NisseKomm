import type { MediaVurderinger } from "@/app/api/media/vurdering/route";
import { PRIS } from "@/lib/forbruk";
import {
  brukbar,
  celleAv,
  familie,
  versionKey,
  type StatusKilde,
} from "@/lib/media-status";
import { segmentHint } from "@/lib/segmenter";
import { dagAv, typeAv } from "../media/filter";
import { juliusFiles } from "../media/oversikt";
import type { Element } from "./elementer";

/**
 * Gjennomgang's queue, derived from files and verdicts (no state of its own):
 * «Venter på deg» = Hans has something to look at, «Hos agent» = a generation
 * or an edit is next, «Lærdom» = notes on approved/OK items.
 */
export interface Linje {
  /** The id the line opens (`?id=` when it is a Gjennomgang element). */
  id: string;
  tittel: string;
  hva: string;
  type: string;
  dag?: number;
  notat?: string;
  kommando?: string;
  /** NOK for a retake (PRIS). */
  pris?: number;
}

/** From /api/media/ko. */
export interface KoServer {
  forbruk: { brukt: number; igjen: number; budsjett: number; fra: string };
  duplikater: string[];
  jobber: Record<string, string>;
  /** Segment numbers per Julius day (julius-manus.json). */
  manus: Record<string, number[]>;
}

const pad = (n: number) => String(n).padStart(2, "0");
const typeFor = (id: string) =>
  id.startsWith("manus/") ? "manus" : (typeAv(id) ?? id.split("/")[0]);
const dagFor = (id: string) =>
  id.startsWith("dag/") ? Number(id.split("/")[1]) : dagAv(id);
const notatAv = (v?: MediaVurderinger[string]) =>
  (v?.notat ?? v?.forrige?.notat)?.replace(/\s*\n\s*/g, " / ");

/** What the agent runs to remake a media file, and what it costs. */
export function omtak(
  path: string,
  jobber: Record<string, string>,
  segmenter: number,
): { kommando: string; pris: number } {
  const dag = dagAv(path);
  if (path.startsWith("video/julius/"))
    return {
      kommando: `python3 assets/bin/julius-dag.py ${dag} --suffix -vN`,
      pris: PRIS.video * Math.max(1, segmenter),
    };
  if (path.startsWith("audio/rampenissen/"))
    return {
      kommando: `bash assets/bin/rampenissen-tts.sh ${dag} --force`,
      pris: PRIS.tts,
    };
  if (path.startsWith("video/tv/"))
    return {
      kommando: `bash assets/bin/tv-loops.sh --bare ${path.slice(9, -4)}`,
      pris: PRIS.video,
    };
  if (/\.mp4$/.test(path))
    return { kommando: `ny video: ${path}`, pris: PRIS.video };
  const jobb = jobber[versionKey(path)];
  return {
    kommando: jobb
      ? `python3 assets/bin/generer.py kjør --bare ${jobb} --force`
      : `nytt bilde: ${path}`,
    pris: PRIS.bilde,
  };
}

const sorter = (a: Linje, b: Linje) =>
  (a.dag ?? 99) - (b.dag ?? 99) ||
  a.type.localeCompare(b.type) ||
  a.id.localeCompare(b.id);

export function byggKo(
  liste: Element[],
  k: StatusKilde & { vurderinger: MediaVurderinger },
  s: KoServer,
) {
  const vurd = k.vurderinger;
  const venter: Linje[] = [];
  const agent: Linje[] = [];
  const laerdom: Linje[] = [];
  const dup = new Set(s.duplikater);
  const finnes = new Set(
    k.filer.filter((f) => f.size !== null).map((f) => f.path),
  );
  const tittel = new Map(liste.map((e) => [e.id, e.tittel]));
  const segmenterPaa = (dag?: number) =>
    dag ? (s.manus[dag]?.length ?? 0) : 0;

  // Media families: every file an element shows, and every file with a verdict.
  const familier = new Set<string>();
  for (const e of liste) for (const p of e.media) familier.add(versionKey(p));
  for (const id of Object.keys(vurd))
    if (/\.\w+$/.test(id) && !id.includes("#")) familier.add(versionKey(id));

  for (const key of familier) {
    const f = familie(key, k);
    const ny = f.kandidat ?? f.iBruk;
    const dag = dagFor(key);
    const type = typeFor(key);
    // A Julius day without any video goes through its script (below).
    if (
      type === "julius" &&
      !juliusFiles(dag ?? 0, k.filer).some((p) => finnes.has(p))
    )
      continue;
    const v = vurd[ny.path];
    const elementId = liste.find((e) =>
      e.media.some((p) => versionKey(p) === key),
    )?.id;
    const linje = {
      id: elementId ?? ny.path,
      tittel: tittel.get(elementId ?? "") ?? ny.path,
      type,
      dag,
      notat: notatAv(v),
    };
    // Radio gate: a clip to make or remake waits on its script first (rampenissen-tts.sh refuses without it).
    const radio = key.match(/^audio\/rampenissen\/dag-(\d+)\.mp3$/)?.[1];
    const lagRadio =
      ny.celle === "mangler" || (!!v?.vurdering && !brukbar(celleAv(v)));
    if (radio && lagRadio) {
      const mid = `manus/radio/dag-${radio}`;
      const mv = vurd[mid];
      if (mv?.vurdering && !brukbar(celleAv(mv))) {
        agent.push({
          id: mid,
          tittel: `Radiomanus dag ${Number(radio)}`,
          type: "manus",
          dag,
          hva: "lag på nytt",
          notat: notatAv(mv),
          pris: 0,
          kommando:
            "endre klippet i docs/manus/rampenissen-radio-2026.md, så python3 assets/bin/medie.py radio-manus",
        });
        continue;
      }
      if (!brukbar(celleAv(mv))) {
        venter.push({
          id: mid,
          tittel: `Radiomanus dag ${Number(radio)}`,
          type: "manus",
          dag,
          notat: notatAv(mv),
          hva: mv?.forrige
            ? "manus endret, radio må lages på nytt"
            : "manus før radio",
        });
        continue;
      }
    }
    if (ny.celle === "mangler") {
      if (k.inventar?.get(ny.path)?.status === "valgfri") continue;
      agent.push({
        ...linje,
        hva: "ikke laget",
        ...omtak(key, s.jobber, segmenterPaa(dag)),
      });
    } else if (v?.vurdering && !brukbar(celleAv(v))) {
      agent.push({
        ...linje,
        hva: `lag på nytt (${ny.navn})`,
        ...omtak(key, s.jobber, segmenterPaa(dag)),
      });
    } else if (!v?.vurdering && !dup.has(ny.path)) {
      venter.push({
        ...linje,
        hva: v?.forrige
          ? `ny versjon (${ny.navn})`
          : v?.notat
            ? `notat uten vurdering (${ny.navn})`
            : `ny (${ny.navn})`,
      });
    }
  }

  // Guide sections: a changed text or a rejection; never-reviewed sections stay in Oversikt.
  for (const e of liste) {
    if (e.media.length || e.id.startsWith("manus/")) continue;
    const v = vurd[e.id];
    const linje = {
      id: e.id,
      tittel: e.tittel,
      type: e.gruppe,
      dag: e.dag,
      notat: notatAv(v),
    };
    if (v?.vurdering && !brukbar(celleAv(v)))
      agent.push({
        ...linje,
        hva: "lag på nytt",
        kommando: "rediger kilden (docs/ eller koden)",
        pris: 0,
      });
    else if (!v?.vurdering && (v?.forrige || v?.notat))
      venter.push({
        ...linje,
        hva: v.forrige ? "ny versjon" : "notat uten vurdering",
      });
  }

  // Script gate: days without a video wait on their segments, then on the video call.
  let segmenter = 0;
  for (const [d, segs] of Object.entries(s.manus)) {
    const dag = Number(d);
    const id = `manus/julius/dag-${pad(dag)}`;
    const harVideo = juliusFiles(dag, k.filer).some((p) => finnes.has(p));
    const åpne = segs.filter((n) => !brukbar(celleAv(vurd[`${id}#s${n}`])));
    for (const n of segs) {
      const v = vurd[`${id}#s${n}`];
      if (v?.vurdering && !brukbar(celleAv(v)))
        agent.push({
          id,
          tittel: `Manus dag ${dag}, segment ${n}`,
          type: "manus",
          dag,
          hva: "lag på nytt",
          notat: notatAv(v),
          pris: 0,
          kommando: segmentHint(`${id}#s${n}`, "lag_paa_nytt").replace(
            /^ → /,
            "",
          ),
        });
    }
    if (harVideo) continue;
    const venterHer = åpne.filter((n) => !vurd[`${id}#s${n}`]?.vurdering);
    segmenter += venterHer.length;
    if (venterHer.length)
      venter.push({
        id,
        tittel: `Manus dag ${dag}`,
        type: "manus",
        dag,
        hva: `${venterHer.length} av ${segs.length} segmenter venter`,
      });
    else if (!åpne.length)
      agent.push({
        id,
        tittel: `Julius dag ${dag}`,
        type: "julius",
        dag,
        hva: "manus godkjent, ingen video",
        kommando: `python3 assets/bin/julius-dag.py ${dag}`,
        pris: PRIS.video * segs.length,
      });
  }

  // Video segment retakes (the segment strip).
  for (const [id, v] of Object.entries(vurd)) {
    const m = id.match(/^video\/julius\/dag-(\d+)#s(\d+)$/);
    if (!m || !v.vurdering || brukbar(celleAv(v))) continue;
    agent.push({
      id:
        liste.find((e) => e.gruppe === "julius" && e.dag === Number(m[1]))
          ?.id ?? id,
      tittel: `Julius dag ${Number(m[1])}, segment ${m[2]}`,
      type: "julius",
      dag: Number(m[1]),
      hva: "lag segmentet på nytt",
      notat: notatAv(v),
      pris: PRIS.video,
      kommando: segmentHint(id, "lag_paa_nytt").replace(/^ → /, ""),
    });
  }

  for (const [id, v] of Object.entries(vurd))
    if (brukbar(celleAv(v)) && v.notat)
      laerdom.push({
        id,
        tittel: tittel.get(id) ?? id,
        type: typeFor(id),
        dag: dagFor(id),
        hva: v.vurdering!,
        notat: notatAv(v),
      });

  return {
    venter: venter.sort(sorter),
    agent: agent.sort(sorter),
    laerdom: laerdom.sort(sorter),
    segmenter,
  };
}
