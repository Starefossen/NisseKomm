import { PrintPage, CutCard } from "../PrintPage";
import { Ark, Prikker, Ruter, bakside } from "./felles";

// Order comes only from the sound, so the cells carry no numbers. The mug piece is the decoy.
const BITER: {
  hvor: string;
  celler: (string | null)[];
  prikker: number;
}[] = [
  { hvor: "dypeste glass", celler: [null, "E"], prikker: 1 },
  {
    hvor: "midterste glass",
    celler: [null, "O"],
    prikker: 2,
  },
  {
    hvor: "lyseste glass",
    celler: [null, null],
    prikker: 3,
  },
  { hvor: "kruset", celler: [null, "A"], prikker: 0 },
];

export default function Dag12FrostlappTredelt() {
  return (
    <PrintPage
      title="Dag 12 – frostlappen i tre biter"
      paper="1 ark, tykt papir (side 2 er prikkene bak; skriv ut tosidig, vend på langsiden)"
      note={
        <ul className="list-disc pl-6">
          {BITER.map((b, i) => (
            <li key={i}>
              Bit {i + 1} (rad for rad): {b.hvor}
            </li>
          ))}
        </ul>
      }
    >
      <Ark>
        <div className="grid grid-cols-2 gap-[6mm] mt-[10mm] justify-items-center">
          {BITER.map((b, i) => (
            <CutCard
              key={i}
              className="w-[80mm] h-[60mm] flex items-center justify-center"
            >
              <Ruter celler={b.celler} storrelse="w-[28mm] h-[40mm]" />
            </CutCard>
          ))}
        </div>
      </Ark>
      <Ark>
        <div className="grid grid-cols-2 gap-[6mm] mt-[10mm] justify-items-center">
          {bakside(BITER, 2).map((b, i) => (
            <CutCard
              key={i}
              className="w-[80mm] h-[60mm] flex items-center justify-center"
            >
              {b && b.prikker > 0 ? <Prikker n={b.prikker} /> : null}
            </CutCard>
          ))}
        </div>
      </Ark>
    </PrintPage>
  );
}
