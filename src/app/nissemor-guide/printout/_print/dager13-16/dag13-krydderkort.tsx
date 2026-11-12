import { Frostrune } from "@/components/ui/Frostrune";
import { Utskrift } from "../Utskrift";
import { Iskrystall } from "../dager01-12/felles";

// Cinnamon, turmeric, saffron, clove. Same look, no names; "_" is ❄.
const KORT = ["__N__", "__R______", "__F___", "__L___"];
const POSE = ["kanel", "gurkemeie", "safran", "nellik (eller pepper)"];

function Frostlapp({ m }: { m: string }) {
  const b = Math.min(13, 86 / m.length - 1);
  return (
    <div className="h-full flex flex-col items-center justify-center gap-[3mm] font-retro">
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
            {c === "_" ? (
              <Iskrystall size={Math.round(b * 2.6)} />
            ) : (
              <>
                {c}
                <span className="absolute top-[0.5mm] right-[0.5mm]">
                  <Frostrune letter={c} size={10} />
                </span>
              </>
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
          forside: (i) => <Frostlapp m={KORT[i]} />,
        },
      ]}
      instruks={{
        klipp: "fire kort.",
        hvor: `Kvelden før dag 13: ett kort i hver zip-pose på servietten ved Rampenissen, lussekatten ved. Rad for rad på arket: ${POSE.join(", ")}.`,
      }}
    />
  );
}
