import { skjultRune } from "@/lib/runeorden";
import { Utskrift } from "../Utskrift";
import { Iskrystall, Kort, midt } from "./felles";

// Spines from the left: only book 2 shows R. Book 5 (the gate) holds U · 7.
// Every spine carries its code rune; the «Feil bok» card is a decoy (none).
const RYGG = [null, "R", null, null, null, null, null, null];
const ORD = ["B", "R", "A", "N", "N", "M", "U", "R"];

export default function Dag21Portkort() {
  return (
    <Utskrift
      navn="dag21-portkort"
      papir="tykt"
      deler={[
        {
          str: { b: 24, h: 80 },
          antall: RYGG.length,
          forside: (i) => (
            <Kort
              bokstav={RYGG[i]}
              tegn={skjultRune(21, ORD[i])}
              nr={i + 1}
              stor={14}
            />
          ),
        },
        {
          str: "A7",
          forside: () =>
            midt(
              <div className="flex items-center gap-[3mm] font-retro text-[24mm] leading-none">
                <div className="w-[34mm] h-[50mm] relative">
                  <Kort bokstav="U" stor={24} />
                </div>
                · 7
              </div>,
            ),
        },
        {
          str: "A7",
          forside: () => (
            <div className="h-full flex flex-col items-center justify-center gap-[3mm] font-retro text-center px-[4mm]">
              <Iskrystall size={90} />
              <p className="text-[6mm] leading-tight">
                Feil bok. Hvor satte Julius sirkelen?
              </p>
            </div>
          ),
        },
      ]}
      instruks={{
        klipp:
          "åtte smale ryggkort (tall svakt nederst), kortet U · 7 og iskrystallkortet «Feil bok».",
        hvor: "Kvelden 20. des.: åtte bøker som lav mur foran skjermen, ryggkort 1–8 teipet fra venstre. U · 7 inne i bok 5. «Feil bok» inne i bok 3, som står på gløtt. Grytelokket og vispen inntil.",
      }}
    />
  );
}
