"use client";
import { Vurder } from "../../vurdering";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { diagramKanter } from "@/lib/gaate-diagram";
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
      <a
        href={`/media/${fil}`}
        target="_blank"
        rel="noreferrer"
        title="Åpne i full størrelse"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- MEDIA_DIR, not in the build */}
        <img
          src={`/media/${fil}`}
          alt="Oppsettskisse"
          className="w-full bg-white"
          onError={() => setFinnes(false)}
        />
      </a>
      <figcaption className="text-sm">Oppsettskisse</figcaption>
      <Vurder id={fil} />
    </figure>
  );
}

const kort = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

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
  const RAD = 40;
  const bitY = (i: number) => 20 + i * RAD;
  const stegRad = (biter.length * RAD) / Math.max(steg.length, 1);
  const stegY = (i: number) => 20 + i * stegRad + (stegRad - RAD) / 2;
  const h = Math.max(biter.length, steg.length) * RAD + 20;
  const merket = new Set(utskrifter.map((u) => utskriftBit(k.hjemme, u)));
  const ren = (s: string) =>
    kort(
      skjulRad(t(s), vis)
        .replace(/\*\*(.+?)\*\*/g, (_, x: string) =>
          vis ? x : "▢".repeat(x.length),
        )
        .replace(/`/g, ""),
      48,
    );
  return (
    <div className="mb-3" data-testid="gaate-diagram">
      <h3 className="text-xl text-(--gold) mb-1">Flyt</h3>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 900 ${h}`}
          className="min-w-[520px] w-full font-retro"
          role="img"
          aria-label={`Brikker til steg til svar. ${ubrukt.length} brikker brukes ikke.`}
        >
          {kanter.map((e) => {
            const i = biter.findIndex((b) => b.id === e.bit);
            const y1 = bitY(i) + 15,
              y2 = stegY(e.steg) + 15;
            return (
              <path
                key={`${e.steg}-${e.bit}`}
                d={`M250 ${y1} C300 ${y1} 290 ${y2} 340 ${y2}`}
                fill="none"
                stroke={
                  e.bit.startsWith("H") ? "var(--gold)" : "var(--cold-blue)"
                }
                strokeWidth={1.5}
                strokeDasharray={e.sikker ? undefined : "5 4"}
                opacity={0.8}
              />
            );
          })}
          {steg.map((_, i) => (
            <path
              key={i}
              d={`M660 ${stegY(i) + 15} C690 ${stegY(i) + 15} 690 ${h / 2} 720 ${h / 2}`}
              fill="none"
              stroke="var(--neon-green)"
              strokeWidth={1}
              opacity={0.5}
            />
          ))}
          {biter.map((b, i) => {
            const rod = ubrukt.includes(b.id);
            const farge = b.id.startsWith("H")
              ? "var(--gold)"
              : "var(--cold-blue)";
            return (
              <g key={b.id}>
                <rect
                  x={4}
                  y={bitY(i)}
                  width={246}
                  height={30}
                  fill="black"
                  stroke={rod ? "var(--christmas-red)" : farge}
                  strokeWidth={rod ? 2 : 1}
                />
                <rect x={4} y={bitY(i)} width={5} height={30} fill={farge} />
                <text x={14} y={bitY(i) + 20} fontSize={15} fill={farge}>
                  {b.id}
                  <tspan
                    fill={rod ? "var(--christmas-red)" : "var(--neon-green)"}
                  >
                    {" "}
                    {kort(
                      b.id === "S0"
                        ? "NisseMail i dag"
                        : b.tekst
                          ? ren(b.tekst)
                          : (b.hvor ?? ""),
                      27,
                    )}
                  </tspan>
                </text>
                {merket.has(b.id) && (
                  <a href="#utskrifter">
                    <text
                      x={232}
                      y={bitY(i) + 20}
                      fontSize={15}
                      fill="var(--gold)"
                    >
                      ⎙<title>Utskrift</title>
                    </text>
                  </a>
                )}
              </g>
            );
          })}
          {steg.map((s, i) => {
            const rod = stegUten.includes(i);
            return (
              <g key={i}>
                <rect
                  x={340}
                  y={stegY(i)}
                  width={320}
                  height={30}
                  fill="black"
                  stroke={rod ? "var(--christmas-red)" : "var(--neon-green)"}
                  strokeWidth={rod ? 2 : 1}
                />
                <text
                  x={348}
                  y={stegY(i) + 20}
                  fontSize={15}
                  fill={rod ? "var(--christmas-red)" : "var(--neon-green)"}
                >
                  {i + 1}) {ren(s)}
                  <title>{t(s)}</title>
                </text>
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
        Stiplet linje: usikker kobling (bare ett felles ord).
      </p>
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
          <Flytdiagram
            k={k}
            steg={d.slikLoses}
            vis={vis}
            kode={kode}
            t={t}
            utskrifter={d.utskrifter.filter((u) => !OVRIG.test(u))}
          />
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
          <b>Hanna (hvis hun vil):</b> {t(d.hanna)}
        </p>
        <h4 className="text-lg text-(--christmas-red)">Hvis noe er borte</h4>
        <p>{t(d.reserve)}</p>
      </details>
      {vis && kode && (
        <div
          data-testid="gaate-fasit"
          className="border-2 border-(--gold) p-2 mt-3"
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
