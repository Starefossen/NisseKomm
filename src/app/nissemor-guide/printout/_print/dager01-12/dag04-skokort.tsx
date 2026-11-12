import { Frostrune } from "@/components/ui/Frostrune";
import { klipphjorner, skjultRune } from "@/lib/runeorden";
import { Utskrift } from "../Utskrift";
import { Iskrystall, Klipphjorne, Prikker } from "./felles";

// Shoes counted clockwise from Rampenissen: shoe 3 M, shoe 5 A, the rest ❄.
const SKO = [null, null, "M", null, "A", null, null];
const ORD = ["K", "O", "M", "P", "A", "S", "S"];
// Visible letters keep their rune; ❄ shoes only a new one (K, O), in a cut-off corner.
const RUNE = ORD.map((l, i) => SKO[i] ?? skjultRune(4, l));
const HJORNE = klipphjorner(4, RUNE);

export default function Dag04Skokort() {
  return (
    <Utskrift
      navn="dag04-skokort"
      papir="tykt"
      tosidig
      deler={[
        {
          str: "A7",
          antall: SKO.length,
          forside: (i) => (
            <div className="h-full relative flex items-center justify-center font-retro text-[30mm] leading-none">
              {HJORNE[i] ? (
                <Klipphjorne letter={HJORNE[i]!} />
              ) : (
                RUNE[i] && (
                  <span className="absolute top-[3mm] right-[3mm]">
                    <Frostrune letter={RUNE[i]!} size={36} />
                  </span>
                )
              )}
              {SKO[i] ?? <Iskrystall size={110} />}
            </div>
          ),
          bakside: (i) => (
            <div className="h-full flex items-center justify-center">
              <Prikker n={i + 1} />
            </div>
          ),
        },
      ]}
      instruks={{
        hjorne: true,
        klipp:
          "sju kort. Prikkene bak (1–7) teller med klokka fra start og er bare reserve.",
        hvor: "Kvelden før dag 4: sju sko i ring i gangen, pappas sko med Rampenissen som start. Kort 1 i pappas sko, så 2–7 videre med klokka. Kosedyr i ring utenfor.",
      }}
    />
  );
}
