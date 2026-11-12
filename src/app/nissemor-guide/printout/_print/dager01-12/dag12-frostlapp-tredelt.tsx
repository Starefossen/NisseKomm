import { Utskrift } from "../Utskrift";
import { Prikker, Ruter } from "./felles";

// Order comes only from the sound, so the cells carry no numbers. The mug piece is the decoy: rune only at A.
// The glass pieces carry the code rune on their ❄ cell too.
const BITER = [
  { hvor: "dypeste glass", celler: [null, "E"], runer: ["M", "E"], prikker: 1 },
  {
    hvor: "midterste glass",
    celler: [null, "O"],
    runer: ["L", "O"],
    prikker: 2,
  },
  {
    hvor: "lyseste glass",
    celler: [null, null],
    runer: ["D", "I"],
    prikker: 3,
  },
  { hvor: "kruset", celler: [null, "A"], runer: undefined, prikker: 0 },
];

export default function Dag12FrostlappTredelt() {
  return (
    <Utskrift
      navn="dag12-frostlapp-tredelt"
      papir="tykt"
      tosidig
      deler={[
        {
          str: "A7",
          antall: BITER.length,
          forside: (i) => (
            <div className="h-full flex items-center justify-center font-retro">
              <Ruter
                celler={BITER[i].celler}
                runer={BITER[i].runer}
                storrelse="w-[28mm] h-[40mm]"
              />
            </div>
          ),
          bakside: (i) =>
            BITER[i].prikker > 0 && (
              <div className="h-full flex items-center justify-center">
                <Prikker n={BITER[i].prikker} />
              </div>
            ),
        },
      ]}
      instruks={{
        klipp: "fire biter. De tre ekte har prikker 1–3 bak; kruset har ingen.",
        hvor: `Kvelden før dag 12: teip bitene nederst på utsiden med forsiden inn. Rad for rad på arket: ${BITER.map((b) => b.hvor).join(", ")}.`,
      }}
    />
  );
}
