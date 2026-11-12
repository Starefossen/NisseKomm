import { skjultRune } from "@/lib/runeorden";
import { Utskrift } from "../Utskrift";
import { Kort, Prikker, midt } from "./felles";

// By size rank (1 = largest): 2 = U, 4 = B, the rest ❄ (no new runes on day 20). Runes only.
const KORT = [null, "U", null, "B", null];
const ORD = ["T", "U", "R", "B", "O"];

export default function Dag20Putekort() {
  return (
    <Utskrift
      navn="dag20-putekort"
      papir="tykt"
      tosidig
      deler={[
        {
          str: "A7",
          antall: KORT.length,
          forside: (i) => (
            <Kort bokstav={KORT[i]} tegn={skjultRune(20, ORD[i])} vis="tegn" />
          ),
          bakside: (i) => midt(<Prikker n={i + 1} />),
        },
      ]}
      instruks={{
        klipp:
          "fem kort. Prikkene bak er størrelsen: 1 prikk under den største puta, 5 under den minste.",
        hvor: "Kvelden 19. des.: fem puter i ulik størrelse hulter til bulter i fortet. Kortet med 2 prikker (tegn U) under den nest største, 4 prikker (tegn B) under den fjerde største, iskrystallene under de andre. Grønt måne-kort under den minste.",
      }}
    />
  );
}
