import { Utskrift } from "../Utskrift";
import { Kort } from "./felles";

// Read from the bow: ❄ O ❄ ❄ L ❄ ❄; O and L only as runes, ❄ cards with the NORDLYS rune in the corner.
const KORT = [null, "O", null, null, "L", null, null];
const ORD = "NORDLYS";

export default function Dag17Baandkort() {
  return (
    <Utskrift
      navn="dag17-baandkort"
      papir="tykt"
      deler={[
        {
          str: { b: 48, h: 56 },
          antall: KORT.length,
          forside: (i) => (
            <Kort
              bokstav={KORT[i]}
              tegn={ORD[i]}
              vis="tegn"
              nr={i + 1}
              stor={14}
            />
          ),
        },
      ]}
      instruks={{
        klipp: "sju små kort, nummerert svakt i hjørnet.",
        hvor: "Kvelden 16. des.: merk 1,5 m grønt gavebånd med sju sølvmerker med lik avstand og tegn en sløyfe før merke 1. Teip kort 1–7 ved merkene fra sløyfen. Bind båndet rundt Rampenissen og stolen med én enkel sløyfe.",
      }}
    />
  );
}
