import { Frostrune } from "@/components/ui/Frostrune";
import { klipphjorner, skjultRune } from "@/lib/runeorden";
import { Utskrift } from "../Utskrift";
import { Iskrystall, Klipphjorne } from "../dager01-12/felles";

// Cinnamon, turmeric, saffron, clove. Same look, no names; "_" is ❄.
const KORT = ["__N__", "__R______", "__F___", "__L___"];
// Saffron is the real skeleton: its ❄ cells carry a rune only when new. F (visible) is new: a cut-off
// corner, bottom right; the cells sit high on every card so the corner never clips them).
const RUNER: (string[] | undefined)[] = [
  undefined,
  undefined,
  ["S", "A", "F", "R", "A", "N"],
  undefined,
];
const POSE = ["kanel", "gurkemeie", "safran", "nellik (eller pepper)"];

const SKJULT = RUNER.map((r, k) =>
  r?.map((l, i) => (KORT[k][i] === "_" ? skjultRune(13, l) : undefined)),
);
const HJORNE = KORT.map((m, k) =>
  klipphjorner(
    13,
    [...m].map((c, i) => (c === "_" ? SKJULT[k]?.[i] : c)),
  ).find(Boolean),
);

function Frostlapp({
  m,
  runer,
  hjorne,
}: {
  m: string;
  runer?: (string | undefined)[];
  hjorne?: string;
}) {
  const b = Math.min(13, 86 / m.length - 1);
  return (
    <div className="h-full relative flex flex-col items-center pt-[4mm] gap-[3mm] font-retro">
      {hjorne && <Klipphjorne letter={hjorne} hjorne="br" />}
      <div className="text-[5mm] tracking-widest flex items-center gap-[2mm]">
        <Iskrystall size={16} /> FROSTLAPP <Iskrystall size={16} />
      </div>
      <div className="flex gap-[1mm]">
        {m.split("").map((c, i) => (
          <div
            key={i}
            className="relative h-[18mm] border-[0.6mm] border-black flex items-center justify-center text-[9mm]"
            style={{ width: `${b}mm` }}
          >
            <span className="absolute bottom-0 left-[0.5mm] text-[2.5mm] text-gray-400">
              {i + 1}
            </span>
            {c === "_" ? <Iskrystall size={Math.round(b * 2.6)} /> : c}
            {(c !== "_" || runer?.[i]) && (
              <span
                className="absolute top-[0.5mm] right-[0.5mm]"
                data-skjult={c === "_" || undefined}
              >
                <Frostrune letter={c === "_" ? runer![i]! : c} size={10} />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dag13Krydderkort() {
  return (
    <Utskrift
      navn="dag13-krydderkort"
      papir="tykt"
      deler={[
        {
          str: "A7",
          antall: KORT.length,
          forside: (i) => (
            <Frostlapp m={KORT[i]} runer={SKJULT[i]} hjorne={HJORNE[i]} />
          ),
        },
      ]}
      instruks={{
        hjorne: true,
        klipp: "fire kort.",
        hvor: `Kvelden før dag 13: ett kort i hver zip-pose på servietten ved Rampenissen, lussekatten ved. Rad for rad på arket: ${POSE.join(", ")}.`,
      }}
    />
  );
}
