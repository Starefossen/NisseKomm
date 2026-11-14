"use client";
import { fyll } from "@/lib/navn";
import { Vurder } from "../../vurdering";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { diagramKanter } from "@/lib/gaate-diagram";
import { losningstavle, type Kilde } from "@/lib/losningstavle";
import { LysbordBilde } from "../../lysbord";
import { utskriftHref, utskriftTittel } from "../../printout/filer";
import type { Bit, gaatekart, kveldDag } from "@/lib/guide-sesong";

const box = "border-2 border-(--neon-green) bg-black p-3 sm:p-4 mb-4";

/** Letter rows such as «_ R _ S _ _»: the letters go, the gaps stay. */
const skjulRad = (s: string, vis: boolean) =>
  vis
    ? s
    : s.replace(/[_A-ZÆØÅƧЯ](?: [_A-ZÆØÅƧЯ])+/g, (m) =>
        m.includes("_") ? m.replace(/[^_ ]/g, "▢") : m,
      );

/** Bold in gaater marks the letters the kids find; hidden like the code. */
function Bokstaver({ tekst, vis }: { tekst: string; vis: boolean }) {
  return (
    <>
      {skjulRad(tekst, vis)
        .split(/\*\*(.+?)\*\*/)
        .map((x, i) =>
          i % 2 ? (
            <strong key={i} className="text-(--gold)">
              {vis ? x : "▢".repeat(x.length)}
            </strong>
          ) : (
            x
          ),
        )}
    </>
  );
}

/** «steg → steg → KODE»: «Slik løses den» without the blind alleys in parentheses. */
export const fasitKjede = (steg: string[], kode: string) =>
  [
    ...steg.map((x) =>
      x
        .replace(/\([^)]*\)/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    ),
    kode,
  ]
    .filter(Boolean)
    .join(" → ");

/** Marks the quoted sentence inside a longer text (mail, PS, transcript). */
function Merket({ tekst, sitat }: { tekst: string; sitat?: string }) {
  const i = sitat ? tekst.indexOf(sitat) : -1;
  if (i < 0) return <>{tekst}</>;
  return (
    <>
      {tekst.slice(0, i)}
      <mark className="bg-(--gold) text-black">{sitat}</mark>
      {tekst.slice(i + sitat!.length)}
    </>
  );
}

function Kolonne({
  tittel,
  children,
}: {
  tittel: string;
  children: ReactNode;
}) {
  return (
    <div className="border border-(--neon-green)/50 p-2">
      <h3 className="text-xl text-(--gold) mb-2">{tittel}</h3>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

// Prints that are not riddle pieces (props, keepsakes, tools).
const OVRIG =
  /gravskilt|fortskilt|serviettfugl|losepengebrev|diplom|frakt|ferdskriver|flylogg|testark|rodfilter|runetavle|operasjonsbrett|krystallkort/;
/** The H piece a print carries: the first one naming a card, sheet or slip. */
export const utskriftBit = (
  hjemme: { id: string; tekst: string }[],
  navn: string,
) => {
  // «dag09-krystallark» → «krys»: the piece that names the printed thing wins.
  const ord = navn.replace(/^dag\d+-/, "").slice(0, 4);
  return (
    hjemme.find((b) => b.tekst.toLowerCase().includes(ord))?.id ??
    hjemme.find((b) =>
      /kort|ark\b|arket|lapp|strimmel|stjerne|fugl|A[3-7]/i.test(b.tekst),
    )?.id ??
    hjemme[0]?.id
  );
};

/** First sheet of a print, scaled down; a click opens it 1:1. Parent-only route, server-rendered. */
function Miniatyr({ navn }: { navn: string }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const src = `${utskriftHref(navn)}?bare=1`;
  return (
    <>
      <button
        type="button"
        onClick={() => dlg.current?.showModal()}
        className="block w-40 h-[226px] overflow-hidden border border-(--neon-green) bg-white shrink-0"
        title={`Vis ${utskriftTittel(navn)} i full størrelse`}
      >
        <iframe
          src={src}
          title={utskriftTittel(navn)}
          loading="lazy"
          tabIndex={-1}
          className="pointer-events-none origin-top-left border-0"
          style={{ width: 794, height: 1123, transform: "scale(0.2015)" }}
        />
      </button>
      <dialog
        ref={dlg}
        className="m-auto w-[min(860px,96vw)] h-[92vh] p-0 bg-black border-2 border-(--gold) backdrop:bg-black/80"
        onClick={(e) => e.target === dlg.current && dlg.current?.close()}
      >
        <div className="flex justify-between items-center p-2 text-(--gold)">
          <span>{utskriftTittel(navn)}</span>
          <button
            type="button"
            className="min-h-11 px-3 border border-(--gold)"
            onClick={() => dlg.current?.close()}
          >
            Lukk
          </button>
        </div>
        {/* 1:1, scrolls inside */}
        <iframe
          src={src}
          title={utskriftTittel(navn)}
          className="w-full h-[calc(92vh-60px)] bg-white border-0"
        />
      </dialog>
    </>
  );
}

/** strek/oppsett-dagNN.png (medier.json oppsett/dagNN, from gaater «Oppsettskisse»); nothing while missing. */
function Oppsettskisse({ dag }: { dag: number }) {
  const [finnes, setFinnes] = useState(true);
  const fil = `strek/oppsett-dag${String(dag).padStart(2, "0")}.png`;
  if (!finnes) return null;
  return (
    <figure className="w-48 md:w-56 shrink-0" data-testid="oppsettskisse">
      <LysbordBilde
        gruppe="skisser"
        src={`/media/${fil}`}
        alt="Oppsettskisse"
        vurderId={fil}
        className="w-full bg-white"
        onError={() => setFinnes(false)}
      />
      <figcaption className="text-sm">Oppsettskisse</figcaption>
      <Vurder id={fil} />
    </figure>
  );
}

const kort = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

/** Word-wrap to at most `linjer` lines of `bredde` characters; the last is cut with «…». */
function brytt(s: string, bredde: number, linjer: number) {
  const ut: string[] = [];
  let rest = s.trim();
  while (rest && ut.length < linjer) {
    if (rest.length <= bredde || ut.length === linjer - 1) {
      ut.push(kort(rest, bredde));
      break;
    }
    let i = rest.lastIndexOf(" ", bredde);
    if (i < bredde / 2) i = bredde;
    ut.push(rest.slice(0, i));
    rest = rest.slice(i).trim();
  }
  return ut;
}

const VB = 900;

/** Pieces → steps → answer, with the references the steps make (dashed = guessed). */
function Flytdiagram({
  k,
  steg,
  vis,
  kode,
  t,
  utskrifter,
}: {
  k: ReturnType<typeof gaatekart>;
  steg: string[];
  vis: boolean;
  kode?: string;
  t: (s: string) => string;
  utskrifter: string[];
}) {
  const biter = [...k.hjemme, ...k.skjerm];
  const { kanter, ubrukt, stegUten } = diagramKanter(steg, k.hjemme, k.skjerm);
  // Hover, focus or tap on a card: its edges and neighbours stay lit, the rest dims.
  const [aktiv, setAktiv] = useState<string | null>(null);
  const [tips, setTips] = useState<{
    x: number;
    y: number;
    tekst: string;
  } | null>(null);
  const RAD = 46;
  const H = 40;
  const bitY = (i: number) => 20 + i * RAD;
  const stegRad = (biter.length * RAD) / Math.max(steg.length, 1);
  const stegY = (i: number) => 20 + i * stegRad + (stegRad - H) / 2;
  const h = Math.max(biter.length, steg.length) * RAD + 20;
  const merket = new Set(utskrifter.map((u) => utskriftBit(k.hjemme, u)));
  const rens = (x: string) =>
    skjulRad(t(x), vis)
      .replace(/\*\*(.+?)\*\*/g, (_, y: string) =>
        vis ? y : "▢".repeat(y.length),
      )
      .replace(/`/g, "");
  const lit = new Set<string>();
  if (aktiv) {
    lit.add(aktiv);
    for (const e of kanter) {
      if (aktiv === `b:${e.bit}` || aktiv === `s:${e.steg}`) {
        lit.add(`b:${e.bit}`);
        lit.add(`s:${e.steg}`);
      }
    }
  }
  const dim = (id: string) => (aktiv && !lit.has(id) ? 0.2 : 1);
  const kortProps = (id: string, x: number, y: number, tekst: string) => ({
    tabIndex: 0,
    role: "button" as const,
    "aria-label": tekst,
    style: { cursor: "pointer", outline: "none" },
    opacity: dim(id),
    onPointerEnter: () => {
      setAktiv(id);
      setTips({ x, y, tekst });
    },
    onPointerLeave: () => {
      setAktiv(null);
      setTips(null);
    },
    onFocus: () => {
      setAktiv(id);
      setTips({ x, y, tekst });
    },
    onBlur: () => {
      setAktiv(null);
      setTips(null);
    },
  });
  return (
    <div className="mb-3" data-testid="gaate-diagram">
      <h3 className="text-xl text-(--gold) mb-1">Flyt</h3>
      <div className="overflow-x-auto">
        <div className="relative min-w-[560px]">
          <svg
            viewBox={`0 0 ${VB} ${h}`}
            className="w-full font-retro"
            role="group"
            aria-label={`Brikker til steg til svar. ${ubrukt.length} brikker brukes ikke.`}
          >
            {kanter.map((e) => {
              const i = biter.findIndex((b) => b.id === e.bit);
              const y1 = bitY(i) + H / 2,
                y2 = stegY(e.steg) + H / 2;
              const paa =
                aktiv && lit.has(`b:${e.bit}`) && lit.has(`s:${e.steg}`)
                  ? aktiv === `b:${e.bit}` || aktiv === `s:${e.steg}`
                  : false;
              return (
                <path
                  key={`${e.steg}-${e.bit}`}
                  d={`M260 ${y1} C300 ${y1} 290 ${y2} 330 ${y2}`}
                  fill="none"
                  stroke={
                    e.bit.startsWith("H") ? "var(--gold)" : "var(--cold-blue)"
                  }
                  strokeWidth={paa ? 3 : 1.5}
                  strokeDasharray={e.sikker ? undefined : "5 4"}
                  opacity={aktiv ? (paa ? 1 : 0.1) : 0.8}
                />
              );
            })}
            {steg.map((_, i) => (
              <path
                key={i}
                d={`M670 ${stegY(i) + H / 2} C695 ${stegY(i) + H / 2} 695 ${h / 2} 720 ${h / 2}`}
                fill="none"
                stroke="var(--neon-green)"
                strokeWidth={1}
                opacity={aktiv ? 0.1 : 0.5}
              />
            ))}
            {biter.map((b, i) => {
              const rod = ubrukt.includes(b.id);
              const farge = b.id.startsWith("H")
                ? "var(--gold)"
                : "var(--cold-blue)";
              const full =
                b.id === "S0"
                  ? "NisseMail i dag"
                  : b.tekst
                    ? rens(b.tekst)
                    : (b.hvor ?? "");
              const [l1, l2] = brytt(full, 30, 2);
              const id = `b:${b.id}`;
              return (
                <g
                  key={b.id}
                  {...kortProps(id, 255, bitY(i), `${b.id} ${full}`)}
                >
                  <rect
                    x={4}
                    y={bitY(i)}
                    width={256}
                    height={H}
                    fill="black"
                    stroke={rod ? "var(--christmas-red)" : farge}
                    strokeWidth={lit.has(id) ? 3 : rod ? 2 : 1}
                  />
                  <rect x={4} y={bitY(i)} width={5} height={H} fill={farge} />
                  <text x={14} y={bitY(i) + 16} fontSize={14} fill={farge}>
                    {b.id}
                    <tspan
                      fill={rod ? "var(--christmas-red)" : "var(--neon-green)"}
                    >
                      {" "}
                      {l1}
                    </tspan>
                  </text>
                  {l2 && (
                    <text
                      x={14}
                      y={bitY(i) + 32}
                      fontSize={14}
                      fill={rod ? "var(--christmas-red)" : "var(--neon-green)"}
                      opacity={0.75}
                    >
                      {l2}
                    </text>
                  )}
                  {merket.has(b.id) && (
                    <a href="#utskrifter">
                      <text
                        x={238}
                        y={bitY(i) + 16}
                        fontSize={14}
                        fill="var(--gold)"
                      >
                        ⎙
                      </text>
                    </a>
                  )}
                </g>
              );
            })}
            {steg.map((s, i) => {
              const rod = stegUten.includes(i);
              const [l1, l2] = brytt(`${i + 1}) ${rens(s)}`, 46, 2);
              const farge = rod ? "var(--christmas-red)" : "var(--neon-green)";
              const id = `s:${i}`;
              return (
                <g
                  key={i}
                  {...kortProps(id, 330, stegY(i), `${i + 1}) ${rens(s)}`)}
                >
                  <rect
                    x={330}
                    y={stegY(i)}
                    width={340}
                    height={H}
                    fill="black"
                    stroke={farge}
                    strokeWidth={lit.has(id) ? 3 : rod ? 2 : 1}
                  />
                  <text x={338} y={stegY(i) + 16} fontSize={14} fill={farge}>
                    {l1}
                  </text>
                  {l2 && (
                    <text
                      x={338}
                      y={stegY(i) + 32}
                      fontSize={14}
                      fill={farge}
                      opacity={0.75}
                    >
                      {l2}
                    </text>
                  )}
                </g>
              );
            })}
            <rect
              x={720}
              y={h / 2 - 20}
              width={170}
              height={40}
              fill="black"
              stroke="var(--gold)"
              strokeWidth={2}
            />
            <text
              x={805}
              y={h / 2 + 7}
              fontSize={20}
              textAnchor="middle"
              fill="var(--gold)"
            >
              {vis && kode ? kode : "SVAR ▢▢▢"}
            </text>
          </svg>
          {tips && (
            <div
              role="tooltip"
              className="pointer-events-none absolute z-10 max-w-xs border-2 border-(--gold) bg-black p-2 text-sm text-(--neon-green)"
              style={{
                left: `${(tips.x / VB) * 100}%`,
                top: `${(tips.y / h) * 100}%`,
                transform: "translate(0, -105%)",
              }}
            >
              {tips.tekst}
            </div>
          )}
        </div>
      </div>
      {(ubrukt.length > 0 || stegUten.length > 0) && (
        <p
          className="text-(--christmas-red) text-sm"
          data-testid="gaate-ubrukt"
        >
          {ubrukt.length > 0 &&
            `${ubrukt.length} ${ubrukt.length === 1 ? "brikke brukes" : "brikker brukes"} ikke: ${ubrukt.join(", ")}. `}
          {stegUten.length > 0 &&
            `Steg uten brikke: ${stegUten.map((i) => i + 1).join(", ")}.`}
        </p>
      )}
      <p className="text-xs opacity-60">
        Stiplet linje: usikker kobling (bare ett felles ord). Hold over eller
        trykk på et kort for å følge linjene.
      </p>
    </div>
  );
}

const FARGE: Record<Kilde, string> = {
  hus: "border-(--gold) bg-(--gold) text-black",
  skjerm: "border-(--cold-blue) bg-(--cold-blue) text-black",
  resonnert: "border-gray-500 bg-gray-700 text-white",
  ukjent: "border-dashed border-gray-500 text-gray-400",
};

/** Where each character of the code comes from; parent-only, under «Vis fasit». */
function Losningstavle({
  kode,
  k,
  steg,
  t,
}: {
  kode: string;
  k: ReturnType<typeof gaatekart>;
  steg: string[];
  t: (s: string) => string;
}) {
  const l = losningstavle(kode, steg, k.hjemme, k.skjerm);
  const sitat = l.lukk?.sitat
    ? `«${t(l.lukk.sitat).slice(0, 70)}${l.lukk.sitat.length > 70 ? "…" : ""}»`
    : "";
  return (
    <div
      data-testid="losningstavle"
      className="border-2 border-(--neon-green) p-2 mt-3"
    >
      <h3 className="text-xl text-(--gold)">Løsningstavle</h3>
      <div className="flex flex-wrap gap-1 my-2">
        {l.celler.map((c, i) =>
          c.tegn === " " ? (
            <span key={i} className="w-3" />
          ) : (
            <span
              key={i}
              className={`flex flex-col items-center justify-center w-10 h-12 border-2 ${FARGE[c.kilde]}`}
              title={c.kilde === "ukjent" ? "kilde ukjent" : c.kilde}
            >
              <span className="text-2xl leading-none">{c.tegn}</span>
              <span className="text-xs leading-none">
                {c.bit ?? (c.kilde === "ukjent" ? "?" : "")}
              </span>
            </span>
          ),
        )}
      </div>
      <p>
        Barna har etter brikkene:{" "}
        <span className="tracking-widest">{l.kjent}</span>
      </p>
      {l.lukk && (
        <p className="text-sm">
          Steg {l.lukk.steg}
          {l.lukk.biter.length > 0 && ` · ${l.lukk.biter.join(", ")}`}
          {sitat && `: ${sitat}`} → {kode}
        </p>
      )}
      <p className="text-sm">
        Hjemme gir {l.hus} av {l.lengde}, skjermen {l.skjerm} av {l.lengde},
        resten resonnert
      </p>
      <p className="text-xs opacity-60">
        Gull: hjemme · blå: skjermen · grå: resonnert · stiplet: kilde ukjent
      </p>
      {l.varsler.map((v) => (
        <p
          key={v.tekst}
          className={
            v.niva === "rod" ? "text-(--christmas-red)" : "text-amber-400"
          }
        >
          {v.tekst}
        </p>
      ))}
    </div>
  );
}

/** Where each piece of the day's riddle is, at home and in the app. `t` hides the code. */
export function Gaatekart({
  vid,
  k,
  d,
  epost,
  vis,
  t,
  kode,
}: {
  /** The day's code, from the parent-only API; shown in «Fasit» when `vis`. */
  kode?: string;
  vid: string;
  k: ReturnType<typeof gaatekart>;
  d: NonNullable<ReturnType<typeof kveldDag>>;
  epost: string;
  vis: boolean;
  t: (s: string) => string;
}) {
  const ids = (s: string) =>
    k.skjerm
      .filter(
        (b) =>
          (b.kilde === "julius" && /Julius|video/i.test(s)) ||
          (b.kilde === "fil" && s.includes(b.hvor.split("/").at(-1)!)) ||
          (b.kilde === "ps" && /PS/.test(s)) ||
          (b.kilde === "symbol" && /symbol|kort/i.test(s)) ||
          (b.kilde === "epost" && /e-post/i.test(s)),
      )
      .map((b) => b.id);
  const bit = (b: Bit) => (
    <li key={b.id} className="border-l-4 border-(--cold-blue) pl-2">
      <p>
        <b className="text-(--gold)">{b.id}</b> {b.hvor}
        {b.naar && <span className="text-sm"> · {b.naar}</span>}
      </p>
      {b.merk ? (
        <>
          <p className="text-sm whitespace-pre-wrap">
            {t(b.tekst)
              .split(/(?<=[.!?])\s+/)
              .map((x, i) => (
                <span key={i}>
                  {b.merk!.some((m) => t(m) === x) ? (
                    <mark className="bg-(--gold) text-black">{x}</mark>
                  ) : (
                    x
                  )}{" "}
                </span>
              ))}
          </p>
          {/* app-tekster: the mail tells what happened and who does what next. */}
          <p className="text-sm opacity-80">
            Gir: hva som skjedde i natt, og hvem gjør hva videre
          </p>
        </>
      ) : b.kilde === "epost" && b.kildeDag === d.dag ? (
        <p className="text-sm whitespace-pre-wrap">
          <Merket tekst={t(epost)} sitat={b.sitat} />
        </p>
      ) : (
        <p className="text-sm">«{t(b.tekst)}»</p>
      )}
      {!b.kilde && (
        <p className="text-sm text-(--christmas-red)">
          Sjekk teksten: sitatet fra gåteplanen er ikke funnet i appen.
        </p>
      )}
    </li>
  );

  return (
    <section id="kart" className={box}>
      <h2 className="text-2xl text-(--gold) mb-2">Gåtekart</h2>
      {k.husProsent !== null && (
        <div className="mb-3">
          <div
            className="flex h-4 border border-(--neon-green)"
            role="img"
            aria-label={`Hjemme ${k.husProsent} %, i NisseKomm ${100 - k.husProsent} %`}
          >
            <div
              className="bg-(--gold)"
              style={{ width: `${k.husProsent}%` }}
            />
            <div className="bg-(--cold-blue) flex-1" />
          </div>
          <p className="text-sm">
            Hjemme {k.husProsent} % · {t(k.andel)}
          </p>
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-3 items-start">
        <div className="flex-1 min-w-0 w-full">
          <p className="sm:hidden text-sm opacity-80">
            Flytdiagrammet vises på større skjerm.
          </p>
          <div className="hidden sm:block">
            <Flytdiagram
              k={k}
              steg={d.slikLoses}
              vis={vis}
              kode={kode}
              t={t}
              utskrifter={d.utskrifter.filter((u) => !OVRIG.test(u))}
            />
          </div>
        </div>
        <Oppsettskisse dag={d.dag} />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Kolonne tittel="Hjemme (fra Rampenissen)">
          {k.hjemme.map((b) => (
            <li key={b.id} className="border-l-4 border-(--gold) pl-2">
              <b className="text-(--gold)">{b.id}</b>{" "}
              <Bokstaver tekst={t(b.tekst)} vis={vis} />
            </li>
          ))}
          {d.utskrifter.map((u) => (
            <li
              key={u}
              id={u === d.utskrifter[0] ? "utskrifter" : undefined}
              className="text-sm flex gap-2 items-start scroll-mt-4"
            >
              <Miniatyr navn={u} />
              <span>
                ⎙{" "}
                <Link href={utskriftHref(u)} className="underline">
                  {utskriftTittel(u)}
                </Link>
                {OVRIG.test(u) ? (
                  <span className="block opacity-60">
                    øvrig (ikke en brikke)
                  </span>
                ) : (
                  <span className="block">
                    bærer {utskriftBit(k.hjemme, u)}
                  </span>
                )}
              </span>
            </li>
          ))}
        </Kolonne>
        <Kolonne tittel="I NisseKomm">
          {k.skjerm.length === 0 && <li>Ingen brikke på skjermen.</li>}
          {k.skjerm.map(bit)}
        </Kolonne>
      </div>
      <h3 className="text-xl text-(--gold) mt-3">Slik løses den</h3>
      <ol className="list-decimal pl-6 space-y-1">
        {d.slikLoses.map((s) => (
          <li key={s}>
            {ids(s).length > 0 && (
              <span className="text-(--gold)">[{ids(s).join(", ")}] </span>
            )}
            {/* Parentheses in gaater hold the blind alleys. */}
            {t(s)
              .split(/(\([^)]*\))/)
              .map((x, i) =>
                i % 2 ? (
                  <span key={i} className="opacity-60">
                    {x}
                  </span>
                ) : (
                  <Bokstaver key={i} tekst={x} vis={vis} />
                ),
              )}
          </li>
        ))}
      </ol>
      {d.reserve && (
        <p className="opacity-60 mt-2">
          <b>Reserve:</b> {t(d.reserve)}
        </p>
      )}
      <details id="hint" className="mt-3 scroll-mt-4">
        <summary className="text-xl text-(--gold) cursor-pointer min-h-11">
          Hint ({d.hint.length})
        </summary>
        <p>Gi ett hint om gangen, og vent litt før neste.</p>
        <ol className="list-decimal pl-6 space-y-2">
          {d.hint.map((s) => {
            // «[…]» at the end says where in the house or the app the step points.
            const [si, hvor] = t(s).split(/\s*\[(.*)\]$/);
            return (
              <li key={s}>
                {si}
                {hvor && (
                  <span className="block text-sm opacity-60">{hvor}</span>
                )}
              </li>
            );
          })}
        </ol>
        <p>
          <b>{fyll("Hanna (hvis hun vil):")}</b> {t(d.yngst)}
        </p>
        <h4 className="text-lg text-(--christmas-red)">Hvis noe er borte</h4>
        <p>{t(d.reserve)}</p>
      </details>
      {vis && kode && (
        <Losningstavle kode={kode} k={k} steg={d.slikLoses} t={t} />
      )}
      {vis && kode && (
        <div
          id="fasit"
          data-testid="gaate-fasit"
          className="border-2 border-(--gold) p-2 mt-3 scroll-mt-4"
        >
          <h3 className="text-xl text-(--gold)">Fasit</h3>
          <p>
            Kode: <strong className="text-(--gold)">{kode}</strong>
          </p>
          <p className="text-sm">{fasitKjede(d.slikLoses, kode)}</p>
        </div>
      )}
      <Vurder id={vid} />
    </section>
  );
}
