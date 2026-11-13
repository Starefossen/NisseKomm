"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { mediaUrl } from "@/lib/media";
import {
  flaggTid,
  ordDiff,
  segmentHint,
  segmentId,
  videoStatus,
  type Kutt,
  type Segment,
  type VideoStatus,
} from "@/lib/segmenter";
import type { MediaVurderingItem } from "@/app/api/media/vurdering/route";
import { Lagremelding, useLagring } from "../lagring";
import type { KuttStatus } from "@/lib/kutt-jobb";
import {
  lagreKutt,
  lastVurderinger,
  settTagning,
  SkjulVurder,
  taggTast,
  useVurderinger,
  Vurder,
  vurderTast,
} from "../vurdering";

/** Verdict → mark, text colour, timeline colour (✓ gold, ◐ amber, ✂︎ blue, ✗ red, open grey). */
const MERKE: Record<string, [string, string, string]> = {
  godkjent: ["✓", "text-(--gold)", "bg-(--gold)"],
  ok: ["◐", "text-(--brass)", "bg-(--brass)"],
  kutt: ["✂︎", "text-(--cold-blue)", "bg-(--cold-blue)"],
  lag_paa_nytt: ["✗", "text-(--christmas-red)", "bg-(--christmas-red)"],
};
const merke = (v?: MediaVurderingItem): [string, string, string] =>
  (v?.vurdering && MERKE[v.vurdering]) || [
    "○",
    "text-(--neon-green)/70",
    "bg-(--gray)",
  ];
const tid = (t: number) =>
  `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/** The page learns the derived status: it hides its own verdict box and gates Ta i bruk on it. */
export const SegmentStatus = createContext<(s: VideoStatus | null) => void>(
  () => {},
);

/** Peaks per `dt` seconds, 0–99 (julius-dag.py writes <video>.lyd.json at the join, `lyd` back-fills). */
export interface Lyd {
  dt: number;
  topp: number[];
}

/** Which segment plays at t: the crossfade belongs to the next one once it has started. */
export const segmentVed = (segs: Segment[], t: number) =>
  [...segs].reverse().find((s) => t >= s.start) ?? segs[0];

/**
 * A Julius video cut into its segments (dag-NN-vN.segmenter.json): one player
 * with our own timeline under it (segments coloured by their verdict, flags,
 * timecodes and cut points as marks, the audio curve above). Each segment is
 * judged on `video/julius/dag-NN#sK` (the raw take's hash, so a verdict
 * carries over to the next join); «Hele videoen» is the video's own verdict.
 * Without a sidecar: `children` (the plain player).
 */
export function SegmentStripe({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const [segs, setSegs] = useState<Segment[] | null>(null);
  const [lyd, setLyd] = useState<Lyd | null>(null);
  // `&s=3` from a queue line opens that segment; null = Hele videoen.
  const [valgt, setValgt] = useState<number | null>(
    () => Number(new URLSearchParams(location.search).get("s")) || null,
  );
  const [nå, setNå] = useState(0);
  const [lengde, setLengde] = useState(0);
  const [peker, setPeker] = useState<{ x: number; t: number } | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stopp = useRef<number | null>(null);
  const alle = useVurderinger();
  const meld = useContext(SegmentStatus);
  const kuttLagring = useLagring();
  // K only draws the cut on the timeline; «Lagre kutt» (Enter) is what writes ✂.
  const [utkastRå, setUtkast] = useState<{
    s: number;
    retning: Kutt["retning"];
    t: number;
  } | null>(null);
  // A draft belongs to the segment it was drawn on.
  const utkast = utkastRå && utkastRå.s === valgt ? utkastRå : null;
  const [kuttSt, setKuttSt] = useState<KuttStatus | null>(null);
  const sistKutt = useRef<string | null>(null);
  const [nyttKutt, setNyttKutt] = useState(false);

  useEffect(() => {
    let aktiv = true;
    const fil = encodeURIComponent(path);
    fetch(`/api/guide/segmenter?fil=${fil}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((s: Segment[]) => {
        if (!aktiv) return;
        for (const x of s)
          if (x.raw) settTagning.set(segmentId(path, x.s), x.raw);
        setSegs(s);
      })
      .catch(() => aktiv && setSegs([]));
    fetch(`/api/guide/segmenter?fil=${fil}&lyd=1`)
      .then((r) => (r.ok ? r.json() : null))
      .then((l: Lyd | null) => aktiv && setLyd(l?.topp?.length ? l : null))
      .catch(() => {});
    return () => {
      aktiv = false;
    };
  }, [path]);

  const vurd = (n: number) => alle?.[segmentId(path, n)];
  const status =
    segs?.length && alle ? videoStatus(segs, (n) => vurd(n), alle[path]) : null;
  const statusTekst = status?.tekst;
  const segVurd = segs?.map((x) => ({ s: x.s, v: vurd(x.s)?.vurdering }));
  const segNøkkel = JSON.stringify(segVurd);
  const dag = Number(path.match(/dag-(\d+)/)?.[1]);
  const harKutt = !!segs?.some((x) => vurd(x.s)?.vurdering === "kutt");
  // The server cuts on its own after a ✂ is saved; show how it goes.
  useEffect(() => {
    if (!dag || !(harKutt || nyttKutt)) return;
    let aktiv = true;
    const hent = () =>
      fetch(`/api/media/kutt?dag=${dag}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((x: KuttStatus | null) => {
          if (!aktiv || !x) return;
          // The cut moved the verdicts to the new take: fetch them, or the old ✂ still reads «Venter på kutt».
          if (sistKutt.current === "kjorer" && x.status !== "kjorer")
            lastVurderinger();
          sistKutt.current = x.status;
          setKuttSt(x);
        })
        .catch(() => {});
    hent();
    const id = setInterval(hent, 3000);
    return () => {
      aktiv = false;
      clearInterval(id);
    };
  }, [dag, harKutt, nyttKutt]);
  useEffect(() => {
    meld(status && { ...status, segs: segVurd });
    return () => meld(null);
    // The text and the verdict list carry the whole status.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTekst, status?.slutt, segNøkkel, meld]);

  const spill = (fra: number, til: number | null) => {
    const v = video.current;
    if (!v) return;
    v.currentTime = Math.max(0, fra);
    stopp.current = til;
    void v.play().catch(() => {});
  };
  const seg = segs?.find((s) => s.s === valgt);

  const kutt = (retning: Kutt["retning"]) => {
    const v = video.current;
    if (!seg || !v) return;
    if (!(v.currentTime > seg.start && v.currentTime < seg.slutt)) {
      void kuttLagring.kjør(async () => {
        throw new Error(`spol til et punkt inne i s${seg.s} først`);
      }, "");
      return;
    }
    setUtkast({ s: seg.s, retning, t: v.currentTime });
  };
  const hørKutt = () => {
    if (!utkast) return;
    if (utkast.retning === "slutt") spill(utkast.t - 3, utkast.t);
    else spill(utkast.t, utkast.t + 3);
  };
  const lagreUtkast = () => {
    if (!utkast || !seg) return;
    const u = utkast;
    const t = Math.round((u.t - seg.start) * 100) / 100;
    setUtkast(null);
    void kuttLagring.kjør(
      async () => {
        await lagreKutt(segmentId(path, u.s), { retning: u.retning, t });
        setNyttKutt(true);
      },
      `✂︎ fjern ${u.retning === "slutt" ? "resten etter" : "starten før"} ${tid(u.t)}`,
    );
  };

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
      if (utkast && (tast === "enter" || tast === "escape")) {
        if (tast === "enter") lagreUtkast();
        else setUtkast(null);
      } else if (seg && taggTast(ev, segmentId(path, seg.s))) tatt = true;
      else if (seg && tast === "k") kutt(ev.shiftKey ? "start" : "slutt");
      else if (ev.shiftKey) tatt = false;
      else if (nr >= 1 && segs.some((s) => s.s === nr)) setValgt(nr);
      else if (tast === "escape") setValgt(null);
      else if (tast === " ") {
        const v = video.current;
        if (seg && v?.paused) spill(seg.start, seg.slutt);
        else if (v) void (v.paused ? v.play() : v.pause());
      } else if (seg && "gol".includes(tast) && tast.length === 1)
        tatt = vurderTast(tast, segmentId(path, seg.s));
      else tatt = false;
      // Before the page's own G/O/L, which judge the whole video.
      if (tatt) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    };
    window.addEventListener("keydown", ned, true);
    return () => window.removeEventListener("keydown", ned, true);
  });

  if (segs === null) return <p>Laster …</p>;
  if (!segs.length) return <>{children}</>;
  const total = lengde || segs.at(-1)!.slutt + 1;
  const pst = (t: number) => `${(Math.min(t, total) / total) * 100}%`;
  const v = seg && vurd(seg.s);
  const lytt = v?.kuttsjekk;

  const merker = segs.flatMap((s) => {
    const d = vurd(s.s);
    return [
      ...s.flagg.map((f) => ({
        t: flaggTid(s, f),
        farge: "bg-(--christmas-red)",
        tekst: `s${s.s} ! ${f}`,
      })),
      ...(d?.tid !== undefined
        ? [
            {
              t: d.tid,
              farge: "bg-(--cold-blue)",
              tekst: `s${s.s} @${tid(d.tid)} ${d.tagger?.join(", ") ?? ""}`,
            },
          ]
        : []),
      ...(d?.kutt
        ? [
            {
              t: s.start + d.kutt.t,
              farge: "bg-white",
              tekst: `s${s.s} ✂︎ kutt ${d.kutt.retning}`,
            },
          ]
        : []),
    ];
  });

  return (
    <div data-testid="segmentstripe">
      <video
        ref={video}
        src={mediaUrl(path)}
        controls
        onLoadedMetadata={(e) => setLengde(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setNå(t);
          if (stopp.current !== null && t >= stopp.current) {
            e.currentTarget.pause();
            stopp.current = null;
          }
          // The script follows playback; paused, the choice stays.
          if (!e.currentTarget.paused) {
            const s = segmentVed(segs, t).s;
            if (s !== valgt) setValgt(s);
          }
        }}
        className="w-full max-h-[60vh] bg-black border border-(--neon-green)/40"
      />
      <div
        data-testid="tidslinje"
        className="relative mt-1 select-none cursor-pointer"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - r.left;
          setPeker({ x, t: (x / r.width) * total });
        }}
        onMouseLeave={() => setPeker(null)}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const t = ((e.clientX - r.left) / r.width) * total;
          if (video.current) video.current.currentTime = t;
          setNå(t);
          setValgt(segmentVed(segs, t).s);
        }}
      >
        {lyd && (
          <svg
            data-testid="lydkurve"
            viewBox={`0 0 ${lyd.topp.length} 100`}
            preserveAspectRatio="none"
            className="block h-10"
            style={{ width: pst(lyd.topp.length * lyd.dt) }}
            aria-hidden
          >
            <path
              d={lyd.topp
                .map((p, i) => `M${i + 0.5} ${50 - p / 2}V${50 + p / 2}`)
                .join("")}
              stroke="var(--neon-green)"
              strokeOpacity={0.6}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
        <div className="relative h-8 bg-black/60 border border-(--neon-green)/30">
          {segs.map((s, i) => {
            const fra = i ? Math.max(s.start, segs[i - 1].slutt) : s.start;
            const [m, , farge] = merke(vurd(s.s));
            return (
              <button
                key={s.s}
                type="button"
                data-seg={s.s}
                aria-pressed={valgt === s.s}
                title={`s${s.s} ${tid(s.start)}–${tid(s.slutt)} «${s.replikk}»`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (video.current) video.current.currentTime = s.start;
                  setNå(s.start);
                  setValgt(s.s);
                }}
                className={`absolute top-1 bottom-1 ${farge} text-black text-sm overflow-hidden ${valgt === s.s ? "ring-2 ring-white" : "opacity-80"}`}
                style={{
                  left: `calc(${pst(fra)} + 2px)`,
                  width: `calc(${pst(s.slutt - fra)} - 4px)`,
                }}
              >
                {m} s{s.s}
              </button>
            );
          })}
          {merker.map((k, i) => (
            <span
              key={i}
              title={k.tekst}
              className={`absolute -top-1 h-2 w-1 ${k.farge}`}
              style={{ left: pst(k.t) }}
            />
          ))}
          {utkast && (
            <>
              <span
                data-testid="utkast-bort"
                className="absolute top-0 bottom-0 z-10 bg-(--gray)/80 pointer-events-none"
                style={
                  utkast.retning === "slutt"
                    ? { left: pst(utkast.t), width: pst(seg!.slutt - utkast.t) }
                    : {
                        left: pst(seg!.start),
                        width: pst(utkast.t - seg!.start),
                      }
                }
              />
              <span
                data-testid="utkast-strek"
                className="absolute -top-2 -bottom-2 z-10 w-0.5 bg-(--cold-blue) pointer-events-none"
                style={{ left: pst(utkast.t) }}
              />
            </>
          )}
          <span
            className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
            style={{ left: pst(nå) }}
          />
        </div>
        {peker && (
          <span
            className="absolute bottom-full mb-1 text-sm bg-black px-1 whitespace-nowrap pointer-events-none z-20"
            style={{ left: peker.x }}
          >
            {tid(peker.t)} {segmentVed(segs, peker.t).replikk.slice(0, 60)}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <span className="text-(--gold)" data-testid="segment-sum">
          {status?.tekst}
        </span>
        <button
          type="button"
          aria-pressed={valgt === null}
          onClick={() => setValgt(null)}
          className={`min-h-11 px-3 border-2 ml-auto ${valgt === null ? "border-(--gold) bg-(--gold)/20" : "border-(--neon-green)/50"}`}
        >
          <span className={merke(alle?.[path])[1]}>
            {merke(alle?.[path])[0]}
          </span>{" "}
          Hele videoen
        </button>
      </div>
      {kuttSt?.status === "kjorer" && (
        <p data-testid="kutter" className="text-(--cold-blue)">
          Kutter …{kuttSt.ko && " Et nytt kutt er i kø."}{" "}
          <button
            type="button"
            className="min-h-11 px-3 border-2 border-(--christmas-red) text-(--christmas-red)"
            onClick={() =>
              void fetch(`/api/media/kutt?dag=${dag}`, { method: "DELETE" })
                .then((r) => (r.ok ? r.json() : null))
                .then((x: KuttStatus | null) => x && setKuttSt(x))
                .catch(() => {})
            }
          >
            Avbryt
          </button>
        </p>
      )}
      {kuttSt?.ko && kuttSt.status !== "kjorer" && (
        <p className="text-(--cold-blue)">Kutt i kø …</p>
      )}
      {kuttSt?.status === "feil" && (
        <p data-testid="kutt-feil" className="text-(--christmas-red)">
          Kuttet feilet. Se {kuttSt.logg}
        </p>
      )}
      {kuttSt?.status === "ferdig" &&
        !kuttSt.ko &&
        kuttSt.ny &&
        kuttSt.ny !== path && (
          <p data-testid="kutt-ferdig" className="text-(--cold-blue)">
            Kuttet er gjort; den nye versjonen venter på kuttsjekk.{" "}
            <a
              href={`/nissemor-guide/gjennomgang?id=${encodeURIComponent(kuttSt.ny)}`}
              className="underline text-(--gold)"
            >
              Åpne v{kuttSt.ny.match(/-v(\d+)\.mp4$/)?.[1]} →
            </a>
          </p>
        )}
      {seg ? (
        <div className="border border-(--neon-green)/40 p-2 space-y-2 mt-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => spill(seg.start, seg.slutt)}
              className="min-h-11 px-3 border-2 border-(--neon-green)"
            >
              ▶ Hør segmentet s{seg.s} ({tid(seg.start)}–{tid(seg.slutt)})
            </button>
            {lytt && (
              <button
                type="button"
                data-testid="hor-kuttet"
                onClick={() =>
                  lytt.retning === "slutt"
                    ? spill(seg.slutt - 3.5, seg.slutt)
                    : spill(seg.start - 2.5, seg.start + 1)
                }
                className="min-h-11 px-3 border-2 border-(--cold-blue) text-(--cold-blue)"
              >
                Hør kuttet
              </button>
            )}
            <button
              type="button"
              onClick={() => kutt("slutt")}
              className="min-h-11 px-3 border-2 border-(--cold-blue)/60"
            >
              ✂︎ Fjern resten (etter her) (K)
            </button>
            <button
              type="button"
              onClick={() => kutt("start")}
              className="min-h-11 px-3 border-2 border-(--cold-blue)/60"
            >
              ✂︎ Fjern starten (før her) (⇧K)
            </button>
            {utkast && (
              <>
                <button
                  type="button"
                  data-testid="utkast-hor"
                  onClick={hørKutt}
                  className="min-h-11 px-3 border-2 border-(--cold-blue) text-(--cold-blue)"
                >
                  Hør
                </button>
                <button
                  type="button"
                  data-testid="utkast-lagre"
                  onClick={lagreUtkast}
                  className="min-h-11 px-3 border-2 border-(--gold) bg-(--gold)/20"
                >
                  Lagre kutt (Enter)
                </button>
                <button
                  type="button"
                  data-testid="utkast-avbryt"
                  onClick={() => setUtkast(null)}
                  className="min-h-11 px-3 border-2 border-(--neon-green)/50"
                >
                  Avbryt (Esc)
                </button>
              </>
            )}
            <Lagremelding status={kuttLagring.status} />
          </div>
          {lytt && (
            <p className="text-(--cold-blue)">
              Kuttsjekk: segmentet er kuttet (
              {lytt.retning === "slutt" ? "slutten" : "starten"}). Hør sekundene
              rundt kuttet, så G eller L.
            </p>
          )}
          {v?.vurdering === "kutt" && v.kutt && (
            <p className="text-(--cold-blue) break-all">
              ✂︎ Kutt {v.kutt.retning === "slutt" ? "slutt fra" : "start til"}{" "}
              {tid(seg.start + v.kutt.t)}. Serveren kutter selv (0 kr).
            </p>
          )}
          <p>
            <span className="text-(--gold)">Manus nå:</span> {seg.replikk}
          </p>
          {seg.hørt && (
            <p data-testid="ord-diff">
              <span className="text-(--gold)">Maskinen hørte i videoen:</span>{" "}
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
                type="button"
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
      ) : (
        <div className="border border-(--neon-green)/40 p-2 mt-2">
          <p>
            Hele videoen: overganger, slutt og lydnivå.
            {status?.steg !== "klar" &&
              status?.steg !== "ferdig" &&
              " Vurder segmentene først."}
          </p>
          <SkjulVurder.Provider value={false}>
            <Vurder id={path} />
          </SkjulVurder.Provider>
        </div>
      )}
      <p className="text-base text-(--neon-green)/80">
        1–{segs.length} velg segment · klikk på tidslinjen spoler · mellomrom
        spill · G/O/L, K fjern resten (etter her), ⇧K fjern starten (før her),
        Enter lagrer kuttet, Esc avbryter, ⇧1–9 merke og T tidskode på valgt
        segment · Esc hele videoen
      </p>
    </div>
  );
}
