"use client";

import type { ReactNode } from "react";
import { Frostrune, RuneText } from "@/components/ui/Frostrune";
import { CutCard, NewSheet, PrintPage } from "./PrintPage";
import { Iskrystall } from "./dager01-12/felles";

/*
 * Printables for days 13–24 and the §8 prank signs, per docs/gaater-2026.md.
 * Runes go only on letters that are visible anyway: a rune on a ❄ square would
 * let a child who keeps the rune board read the whole answer.
 */

const RETRO = "font-retro uppercase";

/** Frostlapp skeleton: "_" is a ❄ square, any other char is shown with its rune. */
function Skjelett({ m }: { m: string }) {
  return (
    <div className="flex gap-1">
      {m.split("").map((c, i) => (
        <div
          key={i}
          className="relative w-9 h-11 border-2 border-black flex items-center justify-center text-2xl"
        >
          <span className="absolute top-0 left-0.5 text-[9px] text-gray-400">
            {i + 1}
          </span>
          {c === "_" ? (
            <Iskrystall size={24} />
          ) : (
            <>
              {c}
              <span className="absolute bottom-0 right-0.5">
                <Frostrune letter={c} size={7} />
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/** Empty numbered squares the kids fill in. */
function Rutekort({ n }: { n: number }) {
  return (
    <CutCard className={`${RETRO} col-span-full gap-2`}>
      <div className="text-lg tracking-widest">▓ NISSEKOMM ▸ RUTEKORT ▓</div>
      <div className="flex gap-1">
        {Array.from({ length: n }, (_, i) => (
          <div
            key={i}
            className="relative w-12 h-14 border-4 border-black text-xs text-gray-500 p-0.5"
          >
            {i + 1}
          </div>
        ))}
      </div>
    </CutCard>
  );
}

function Big({ children }: { children: ReactNode }) {
  return <div className={`${RETRO} text-6xl font-bold`}>{children}</div>;
}

const Grid = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-3 gap-3">{children}</div>
);

const Prikker = ({ n }: { n: number }) => (
  <div className="flex gap-2 text-3xl" aria-label={`${n} prikker`}>
    {"●".repeat(n)}
  </div>
);

/** Card with only a rune (no letter), for days the board must be used. */
const RuneKort = ({ l, size = 48 }: { l: string; size?: number }) => (
  <Frostrune letter={l} size={size} />
);

/** Second sheet for duplex printing: each row reversed so backs line up. */
function Bakside({ rader }: { rader: ReactNode[][] }) {
  return (
    <NewSheet>
      <p className="text-sm italic mb-2 print:hidden">
        Bakside: skriv ut tosidig (vend langs langsiden).
      </p>
      <Grid>{rader.flatMap((r) => [...r].reverse())}</Grid>
    </NewSheet>
  );
}

function Dag13() {
  const kort = ["__N__", "__R______", "__F___", "__L___"];
  return (
    <PrintPage
      title="DAG 13 · KRYDDERKORT"
      note="Fire like kort uten navn, i rekkefølgen kanel, gurkemeie, krydderet med tråder, nellik."
    >
      <div className="grid grid-cols-2 gap-4">
        {kort.map((m) => (
          <CutCard key={m} className={`${RETRO} h-40 gap-2`}>
            <div className="tracking-widest flex items-center gap-2">
              <Iskrystall size={16} /> FROSTLAPP <Iskrystall size={16} />
            </div>
            <Skjelett m={m} />
          </CutCard>
        ))}
      </div>
    </PrintPage>
  );
}

function Dag14Brettark() {
  // Two windows in the bottom-right quarter. Letters sit mirrored across the
  // vertical fold, digits mirrored across the horizontal fold, so each shows
  // through its window only when that fold is made and held against light.
  const vinduer = [
    { x: 25, y: 30, bokstav: "R", tall: "2" },
    { x: 65, y: 60, bokstav: "G", tall: "4" },
  ];
  return (
    <PrintPage
      title="DAG 14 · BRETTEARK"
      note="Vanlig 80 g papir. Test gjennomlys med mobillykt i november. Rull arket sammen i papirbåten."
    >
      <div className={`${RETRO} relative h-[260mm] border-2 border-black`}>
        <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-black" />
        <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-black" />
        <p className="absolute top-2 left-0 right-0 text-center text-2xl">
          Brett. Hold en lykt bak.
        </p>
        {/* Decoy scribbles */}
        <svg className="absolute inset-0 w-full h-full" aria-hidden>
          {[
            [10, 15, 30, 22],
            [60, 12, 80, 30],
            [15, 70, 35, 85],
            [70, 80, 90, 72],
            [55, 40, 62, 45],
            [20, 40, 40, 38],
          ].map(([a, b, c, d], i) => (
            <line
              key={i}
              x1={`${a}%`}
              y1={`${b}%`}
              x2={`${c}%`}
              y2={`${d}%`}
              stroke="#999"
              strokeWidth={2}
            />
          ))}
        </svg>
        {vinduer.map((v) => (
          <div key={v.bokstav}>
            <div
              className="absolute w-12 h-14 border-2 border-black"
              style={{
                left: `${50 + v.x / 2 - 1}%`,
                top: `${50 + v.y / 2 - 1}%`,
              }}
            />
            <span
              className="absolute text-5xl text-gray-500 -scale-x-100"
              style={{
                left: `${100 - (50 + v.x / 2) - 3}%`,
                top: `${50 + v.y / 2}%`,
              }}
            >
              {v.bokstav}
            </span>
            <span
              className="absolute text-5xl text-gray-500 -scale-y-100"
              style={{
                left: `${50 + v.x / 2}%`,
                top: `${100 - (50 + v.y / 2) - 4}%`,
              }}
            >
              {v.tall}
            </span>
          </div>
        ))}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="relative w-10 h-12 border-2 border-black" />
          ))}
        </div>
      </div>
    </PrintPage>
  );
}

function Dag14Serviettfugl() {
  const steg = [
    "Brett servietten på skrå til en trekant.",
    "Brett de to spissene i bunnen opp mot toppen.",
    "Brett hele fuglen på midten, så vingene møtes.",
    "Brett vingene ned, én på hver side.",
    "Knekk nebbet ned i den ene spissen.",
    "Sett fuglen på bordet. Gi den et navn.",
  ];
  return (
    <PrintPage title="DAG 14 · SERVIETTFUGL (VALGFRI)">
      <div className={`${RETRO} space-y-4 border-4 border-black p-6`}>
        <h2 className="text-4xl text-center">
          ▓ SLIK BRETTER DU EN SERVIETTFUGL ▓
        </h2>
        <ol className="text-2xl space-y-3 list-decimal pl-8 normal-case">
          {steg.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="text-center text-xl">– RAMPENISSEN (MINE ER SKJEVERE)</p>
      </div>
    </PrintPage>
  );
}

function Fotspor({ lang }: { lang: boolean }) {
  return (
    <div className="border-2 border-dashed border-black h-12 flex items-center gap-4 px-3 my-2">
      {Array.from({ length: lang ? 14 : 6 }, (_, i) => (
        <svg key={i} width="18" height="28" aria-hidden>
          <ellipse cx="9" cy={i % 2 ? 18 : 10} rx="6" ry="9" fill="#c8a165" />
        </svg>
      ))}
      {!lang && <span className="text-sm text-gray-500">(slutter her)</span>}
    </div>
  );
}

function Dag15() {
  return (
    <PrintPage
      title="DAG 15 · REDSKAPSKORT"
      note="Side 1 tykt papir: A under gryta, M under sleiva, L under vispen, iskrystall under kjevle og øse. Side 2 vanlig papir: fem fotsporstrimler, de to korte går mot kjevle og øse."
    >
      <Grid>
        {["A", "M", "L"].map((l) => (
          <CutCard key={l} rune={l} className="h-32">
            <Big>{l}</Big>
          </CutCard>
        ))}
        {[1, 2].map((i) => (
          <CutCard key={i} className="h-32">
            <Big>
              <Iskrystall size={56} />
            </Big>
          </CutCard>
        ))}
        <Rutekort n={8} />
      </Grid>
      <NewSheet>
        {[true, true, true, false, false].map((lang, i) => (
          <Fotspor key={i} lang={lang} />
        ))}
      </NewSheet>
    </PrintPage>
  );
}

function Dag16() {
  return (
    <PrintPage
      title="DAG 16 · RYDDELAPPER"
      note="O på fjernkontrollen, E på tannbørsteglasset, I på brødposen, K på ostehøvelen. «2» i TV-benken, «5» på badehyllen, «7» i brødboksen. Rutekortet i brødboksen."
    >
      <Grid>
        {["O", "E", "I", "K"].map((l) => (
          <CutCard key={l} rune={l} className="h-32">
            <Big>{l}</Big>
          </CutCard>
        ))}
        {["2", "5", "7"].map((n) => (
          <CutCard key={n} className="h-32">
            <Big>{n}</Big>
          </CutCard>
        ))}
        <Rutekort n={9} />
      </Grid>
    </PrintPage>
  );
}

function Dag17Baand() {
  const kort = ["", "O", "", "", "L", "", ""];
  return (
    <PrintPage
      title="DAG 17 · BÅNDKORT"
      note="Sju små kort, teipes ved sølvmerkene i rekkefølge fra sløyfen. Kort 2 og 5 har bare tegn."
    >
      <div className="grid grid-cols-7 gap-2">
        {kort.map((l, i) => (
          <CutCard key={i} nr={i + 1} className="h-24">
            {l ? (
              <RuneKort l={l} size={30} />
            ) : (
              <Big>
                <Iskrystall size={56} />
              </Big>
            )}
          </CutCard>
        ))}
      </div>
    </PrintPage>
  );
}

function Dag17Losepenger() {
  const tekst = "GI OSS ALLE PEPPERKAKENE. ELLERS.";
  const fonter = ["font-serif", "font-sans", "font-mono", "font-retro"];
  return (
    <PrintPage title="DAG 17 · LØSEPENGEBREV (VALGFRI)">
      <div className="border-4 border-black p-8 min-h-[200mm] flex flex-col justify-center gap-10">
        <div
          className="flex flex-wrap gap-x-6 gap-y-4 justify-center"
          aria-label={tekst}
        >
          {tekst.split(" ").map((ord, w) => (
            <span key={w} className="flex gap-1">
              {ord.split("").map((c, i) => {
                const k = w * 7 + i;
                return (
                  <span
                    key={i}
                    className={`${fonter[k % 4]} text-5xl font-bold px-1 border border-black ${k % 3 ? "bg-white" : "bg-gray-200"}`}
                    style={{ transform: `rotate(${((k * 37) % 15) - 7}deg)` }}
                  >
                    {c}
                  </span>
                );
              })}
            </span>
          ))}
        </div>
        <p className="text-right text-3xl font-serif italic">– Kosedyrene</p>
      </div>
    </PrintPage>
  );
}

function Dag18() {
  const kort = [
    { l: "U", n: 2 },
    { l: "B", n: 4 },
    { l: "E", n: 7 },
    { l: "", n: 9 },
  ];
  return (
    <PrintPage
      title="DAG 18 · ROSINKORT"
      note="2 rosiner over U, 4 over B, 7 over E, 9 over iskrystallet. Prikkene på baksiden er reserven hvis noen spiser sporet."
    >
      <Grid>
        {kort.map((k) => (
          <CutCard key={k.n} rune={k.l || undefined} className="h-32">
            <Big>{k.l || <Iskrystall size={56} />}</Big>
          </CutCard>
        ))}
        <div />
        <div />
        <Rutekort n={9} />
      </Grid>
      <Bakside
        rader={[
          kort.slice(0, 3).map((k) => (
            <CutCard key={k.n} className="h-32">
              <Prikker n={k.n} />
            </CutCard>
          )),
          [
            <CutCard key={9} className="h-32">
              <Prikker n={9} />
            </CutCard>,
            <div key="a" />,
            <div key="b" />,
          ],
        ]}
      />
    </PrintPage>
  );
}

function Dag19() {
  const lapper = [
    { rom: "STUE", l: "U", n: 2 },
    { rom: "KJØKKEN", l: "O", n: 5 },
    { rom: "GANG", l: "", n: 3 },
  ];
  return (
    <PrintPage
      title="DAG 19 · BEVISLAPPER"
      note="Merkelappene henges på hyssing rundt foliepakkene i stua, kjøkkenet og gangen (romnavnet er bare for deg, klipp det bort). Rutearket under BEVIS-pakken."
    >
      <Grid>
        {lapper.map((p) => (
          <CutCard key={p.n} rune={p.l || undefined} className="h-32 gap-1">
            <Big>
              {p.l || <Iskrystall size={48} />} · {p.n}
            </Big>
            <span className="text-xs text-gray-400 print:hidden">{p.rom}</span>
          </CutCard>
        ))}
        <Rutekort n={6} />
        <CutCard className="col-span-full h-48">
          <div className={`${RETRO} text-8xl font-bold tracking-widest`}>
            BEVIS
          </div>
        </CutCard>
      </Grid>
    </PrintPage>
  );
}

function Dag20() {
  // By size rank: 2nd largest = U, 4th largest = B, the rest ❄.
  const kort = ["", "U", "", "B", ""];
  return (
    <PrintPage
      title="DAG 20 · PUTEKORT"
      note="Prikkene bak er størrelsen: 1 under den største puta, 5 under den minste. Tegnet for U under den nest største, B under den fjerde største."
    >
      <Grid>
        {kort.map((l, i) => (
          <CutCard key={i} className="h-36">
            {l ? (
              <RuneKort l={l} />
            ) : (
              <Big>
                <Iskrystall size={56} />
              </Big>
            )}
          </CutCard>
        ))}
      </Grid>
      <Bakside
        rader={[
          [0, 1, 2].map((i) => (
            <CutCard key={i} className="h-36">
              <Prikker n={i + 1} />
            </CutCard>
          )),
          [
            ...[3, 4].map((i) => (
              <CutCard key={i} className="h-36">
                <Prikker n={i + 1} />
              </CutCard>
            )),
            <div key="x" />,
          ],
        ]}
      />
    </PrintPage>
  );
}

function Dag21() {
  return (
    <PrintPage
      title="DAG 21 · PORTKORT"
      note="Ryggkortene teipes på bok 1–8 fra venstre. Kortet med U · 7 legges inne i bok 5, iskrystallkortet med «Feil bok» inne i bok 3 (den på gløtt)."
    >
      <div className="grid grid-cols-8 gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <CutCard
            key={i}
            nr={i + 1}
            rune={i === 1 ? "R" : undefined}
            className="h-40"
          >
            <Big>{i === 1 ? "R" : <Iskrystall size={56} />}</Big>
          </CutCard>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6">
        <CutCard rune="U" className="h-36">
          <Big>U · 7</Big>
        </CutCard>
        <CutCard className="h-36">
          <Big>
            <Iskrystall size={56} />
          </Big>
          <div className="text-lg">Feil bok. Hvor satte Julius sirkelen?</div>
        </CutCard>
      </div>
    </PrintPage>
  );
}

function Dag22() {
  // Two separate numbers per sock: never a dash between them (reads as minus).
  const kort = [
    ["1a", "15"],
    ["1b", "4"],
    ["2a", "17"],
    ["2b", "7"],
    ["3a", "32"],
    ["3b", "22"],
  ];
  return (
    <PrintPage
      title="DAG 22 · SOKKELAPPER"
      note="Sokk 1 i stua, sokk 2 på kjøkkenet, sokk 3 er Hannas i gangen (med Rampenissen og måne-kortet). To kort i hver sokk."
    >
      <Grid>
        {kort.map(([merke, tall]) => (
          <CutCard key={merke} nr={merke} className="h-32">
            <Big>{tall}</Big>
          </CutCard>
        ))}
        {[1, 2, 3].map((s) => (
          <CutCard key={s} className={`${RETRO} h-32`}>
            <div className="text-xl">SOKK</div>
            <Big>{s}</Big>
          </CutCard>
        ))}
      </Grid>
    </PrintPage>
  );
}

const ROMER = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

function Stjerne({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0" aria-hidden>
        <polygon
          points="50,3 61,38 98,38 68,60 79,95 50,73 21,95 32,60 2,38 39,38"
          fill="none"
          stroke="black"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
      </svg>
      <div className="relative text-4xl font-bold mt-3 flex flex-col items-center">
        {children}
      </div>
    </div>
  );
}

function Dag23() {
  const forside: Record<number, string> = { 5: "R", 8: "K", 10: "A" };
  const nr = Array.from({ length: 12 }, (_, i) => i + 1);
  const rader = [0, 1, 2, 3].map((r) => nr.slice(r * 3, r * 3 + 3));
  return (
    <PrintPage
      title="DAG 23 · STJERNER"
      note="Tosidig. Klipp og tre stjernene i november; heng de laveste i Hannas høyde."
    >
      <div className={`${RETRO} grid grid-cols-3 gap-2 justify-items-center`}>
        {nr.map((n) => (
          <Stjerne key={n}>
            {forside[n] ?? <Iskrystall size={20} />}
            {forside[n] && <Frostrune letter={forside[n]} size={10} />}
          </Stjerne>
        ))}
      </div>
      <NewSheet>
        <div className={`${RETRO} grid grid-cols-3 gap-2 justify-items-center`}>
          {rader.flatMap((r) =>
            [...r]
              .reverse()
              .map((n) => <Stjerne key={n}>{ROMER[n - 1]}</Stjerne>),
          )}
        </div>
      </NewSheet>
    </PrintPage>
  );
}

function Dag24Suvenir() {
  const lapper = [
    { l: "U", n: 2, ting: "perlen" },
    { l: "E", n: 4, ting: "filteret" },
    { l: "G", n: 7, ting: "båndbiten" },
  ];
  const lapp = (p: (typeof lapper)[number], kopi: boolean) => (
    <CutCard key={`${p.l}${kopi}`} className={`${RETRO} h-32 gap-1`}>
      <div className="flex items-center gap-3 text-5xl">
        <RuneKort l={p.l} size={32} /> · {p.n}
      </div>
      {kopi && <div className="text-sm">IQS KOPI</div>}
    </CutCard>
  );
  return (
    <PrintPage
      title="DAG 24 · SUVENIRLAPPER"
      note={`Lappene festes på ${lapper.map((p) => p.ting).join(", ")}. Reservelappene og rutekortet i gullkonvolutten. Bokstavene, hvis tavla mangler et tegn: U, E, G.`}
    >
      <Grid>
        {lapper.map((p) => lapp(p, false))}
        {lapper.map((p) => lapp(p, true))}
        <Rutekort n={8} />
      </Grid>
    </PrintPage>
  );
}

function Dag24Krystall() {
  return (
    <PrintPage
      title="DAG 24 · KRYSTALLKORT"
      note="Legges ved krystallet under treet. Vintervokterens eneste ord til dem, bare i tegn."
    >
      <CutCard className="h-[120mm] gap-8">
        <Iskrystall size={40} />
        <RuneText text="TAKK FOR LYSET" size={36} />
        <Iskrystall size={40} />
      </CutCard>
    </PrintPage>
  );
}

function Skilt({ title, linjer }: { title: string; linjer: string[] }) {
  return (
    <PrintPage
      title={title}
      note="Rampestrek-skilt (§8). Brett på midten så det står."
    >
      <div
        className={`${RETRO} border-8 border-double border-black h-[120mm] flex flex-col items-center justify-center gap-6 text-center`}
      >
        {linjer.map((l) => (
          <div key={l} className="text-7xl font-bold">
            {l}
          </div>
        ))}
      </div>
    </PrintPage>
  );
}

/** Printable name (from filer.ts) → page. */
export const SIDER_13_24: Record<string, () => ReactNode> = {
  "dag13-krydderkort": Dag13,
  "dag13-gravskilt": () => (
    <Skilt
      title="DAG 13 · GRAVSKILT"
      linjer={["† HER HVILER RAMPEN.", "HAN SPISTE 11."]}
    />
  ),
  "dag14-brettark": Dag14Brettark,
  "dag14-serviettfugl": Dag14Serviettfugl,
  "dag15-redskapskort": Dag15,
  "dag16-sorteringslapper": Dag16,
  "dag17-baandkort": Dag17Baand,
  "dag17-losepengebrev": Dag17Losepenger,
  "dag18-rosinkort": Dag18,
  "dag19-bevislapper": Dag19,
  "dag20-putekort": Dag20,
  "dag20-fortskilt": () => (
    <Skilt title="DAG 20 · FORTSKILT" linjer={["KUN FOR SIGMAS.", "6-7."]} />
  ),
  "dag21-portkort": Dag21,
  "dag22-sokkelapper": Dag22,
  "dag23-stjerner": Dag23,
  "dag24-suvenirlapper": Dag24Suvenir,
  "dag24-krystallkort": Dag24Krystall,
};
