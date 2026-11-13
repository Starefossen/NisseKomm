"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { mediaUrl } from "@/lib/media";
import {
  flaggTid,
  ordDiff,
  segmentHint,
  segmentId,
  type Segment,
} from "@/lib/segmenter";
import type { MediaVurderingItem } from "@/app/api/media/vurdering/route";
import {
  SkjulVurder,
  taggTast,
  useVurderinger,
  Vurder,
  vurderTast,
} from "../vurdering";

const MERKE: Record<string, [string, string]> = {
  godkjent: ["✓", "text-(--gold)"],
  ok: ["◐", "text-(--gold)"],
  lag_paa_nytt: ["✗", "text-(--christmas-red)"],
};
const merke = (v?: MediaVurderingItem): [string, string] =>
  (v?.vurdering && MERKE[v.vurdering]) || ["○", "text-(--neon-green)/70"];
const tid = (t: number) =>
  `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/**
 * A Julius video cut into its segments (dag-NN-vN.segmenter.json): one chip per
 * segment, each played alone and judged on its own id `video/julius/dag-NN#sK`
 * (the raw take's hash, so a verdict carries over to the next join). The
 * video's own verdict is the join. Without a sidecar: `children` (the plain player).
 */
export function SegmentStripe({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const [segs, setSegs] = useState<Segment[] | null>(null);
  const [valgt, setValgt] = useState<number | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stopp = useRef<number | null>(null);
  const alle = useVurderinger();

  useEffect(() => {
    let aktiv = true;
    fetch(`/api/guide/segmenter?fil=${encodeURIComponent(path)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((s: Segment[]) => aktiv && setSegs(s))
      .catch(() => aktiv && setSegs([]));
    return () => {
      aktiv = false;
    };
  }, [path]);

  const spill = (fra: number, til: number | null) => {
    const v = video.current;
    if (!v) return;
    v.currentTime = fra;
    stopp.current = til;
    void v.play().catch(() => {});
  };
  const seg = segs?.find((s) => s.s === valgt);

  useEffect(() => {
    if (!segs?.length) return;
    const ned = (ev: KeyboardEvent) => {
      const mal = ev.target as HTMLElement;
      if (
        ev.metaKey ||
        ev.ctrlKey ||
        ev.altKey ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(mal.tagName)
      )
        return;
      const tast = ev.key.toLowerCase();
      const nr = Number(tast);
      let tatt = true;
      if (seg && taggTast(ev, segmentId(path, seg.s))) tatt = true;
      else if (ev.shiftKey) tatt = false;
      else if (nr >= 1 && segs.some((s) => s.s === nr)) setValgt(nr);
      else if (tast === "escape") setValgt(null);
      else if (tast === " ") {
        const v = video.current;
        if (seg) spill(seg.start, seg.slutt);
        else if (v) void (v.paused ? v.play() : v.pause());
      } else if (seg && "gol".includes(tast) && tast.length === 1)
        tatt = vurderTast(tast, segmentId(path, seg.s));
      else tatt = false;
      // Before the page's own G/O/L, which judge the join.
      if (tatt) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    };
    window.addEventListener("keydown", ned, true);
    return () => window.removeEventListener("keydown", ned, true);
  }, [segs, seg, path]);

  if (segs === null) return <p>Laster …</p>;
  if (!segs.length) return <>{children}</>;
  const vurd = (s: Segment) => alle?.[segmentId(path, s.s)];
  const godkjent = segs.filter((s) =>
    ["godkjent", "ok"].includes(vurd(s)?.vurdering ?? ""),
  ).length;
  const v = seg && vurd(seg);

  return (
    <div data-testid="segmentstripe">
      <video
        ref={video}
        src={mediaUrl(path)}
        controls
        onTimeUpdate={(e) => {
          if (
            stopp.current !== null &&
            e.currentTarget.currentTime >= stopp.current
          ) {
            e.currentTarget.pause();
            stopp.current = null;
          }
        }}
        className="w-full max-h-[60vh] bg-black border border-(--neon-green)/40"
      />
      <p className="mt-2 text-(--gold)" data-testid="segment-sum">
        {godkjent} av {segs.length} segmenter godkjent · videoens egen vurdering
        over gjelder hele videoen (overganger, slutt)
      </p>
      <div className="flex flex-wrap gap-2 my-2" role="tablist">
        {segs.map((s) => {
          const [m, farge] = merke(vurd(s));
          return (
            <button
              key={s.s}
              role="tab"
              aria-selected={valgt === s.s}
              onClick={() => setValgt(s.s)}
              className={`min-h-11 px-3 border-2 ${valgt === s.s ? "border-(--gold) bg-(--gold)/20" : "border-(--neon-green)/50"}`}
            >
              <span className={farge}>{m}</span> s{s.s}{" "}
              <span className="text-sm">{tid(s.start)}</span>
              {s.flagg.length > 0 && (
                <span className="text-(--christmas-red)"> !</span>
              )}
            </button>
          );
        })}
        <button
          role="tab"
          aria-selected={valgt === null}
          onClick={() => setValgt(null)}
          className={`min-h-11 px-3 border-2 ${valgt === null ? "border-(--gold) bg-(--gold)/20" : "border-(--neon-green)/50"}`}
        >
          Hele videoen
        </button>
      </div>
      {seg && (
        <div className="border border-(--neon-green)/40 p-2 space-y-2">
          <button
            onClick={() => spill(seg.start, seg.slutt)}
            className="min-h-11 px-3 border-2 border-(--neon-green)"
          >
            Spill s{seg.s} ({tid(seg.start)}–{tid(seg.slutt)})
          </button>
          <p>
            <span className="text-(--gold)">Manus:</span> {seg.replikk}
          </p>
          {seg.hørt && (
            <p data-testid="ord-diff">
              <span className="text-(--gold)">Hørt:</span>{" "}
              {ordDiff(seg.replikk, seg.hørt).map((o, i) => (
                <span
                  key={i}
                  className={
                    o.t === "mangler"
                      ? "text-(--christmas-red) line-through"
                      : o.t === "ekstra"
                        ? "text-(--neon-green)/50 italic"
                        : ""
                  }
                >
                  {o.w}{" "}
                </span>
              ))}
              <span className="text-sm">
                (<span className="text-(--christmas-red)">mangler</span>,{" "}
                <span className="text-(--neon-green)/50 italic">ekstra</span>)
              </span>
            </p>
          )}
          {seg.flagg.map((f) => (
            <p key={f}>
              <span className="text-(--christmas-red)">Maskinen fant:</span> {f}{" "}
              <button
                onClick={() => spill(flaggTid(seg, f), seg.slutt)}
                className="min-h-11 px-2 underline text-(--gold)"
              >
                {tid(flaggTid(seg, f))} → hopp
              </button>
            </p>
          ))}
          {v?.versjon && seg.raw && v.versjon !== seg.raw && (
            <p className="text-(--cold-blue)">
              Vurderingen gjelder et annet råklipp enn det i denne videoen.
            </p>
          )}
          <SkjulVurder.Provider value={false}>
            <Vurder key={seg.s} id={segmentId(path, seg.s)} />
          </SkjulVurder.Provider>
          {v?.vurdering === "lag_paa_nytt" && (
            <p className="text-sm break-all">
              Agentene kjører:
              {segmentHint(segmentId(path, seg.s), v.vurdering)}
            </p>
          )}
        </div>
      )}
      <p className="text-base text-(--neon-green)/80">
        Segmenter: 1–{segs.length} velg · mellomrom spill · G/O/L, ⇧1–9 merke og
        T tidskode på valgt segment · Esc tilbake til hele videoen
      </p>
    </div>
  );
}
