import { klipphjorner } from "@/lib/runeorden";
import { Utskrift } from "../Utskrift";
import { Iskrystall, Klipphjorne, Prikker } from "./felles";

// Thread order from the TV: ❄ I ❄ N ❄ ❄; then the two loose cards in the river.
const KORT = [null, "I", null, "N", null, null, "E", "T"];
const TRAAD = 6;
// Every rune is new on day 1, so every card gets a cut-off corner (Meta 1).
const HJORNE = klipphjorner(1, [..."SIGNALET"]);

function Forside({ vis, rune }: { vis: string | null; rune?: string }) {
  return (
    <div className="h-full relative flex items-center justify-center font-retro text-[40mm] leading-none">
      {rune && <Klipphjorne letter={rune} />}
      {vis ?? <Iskrystall size={150} />}
    </div>
  );
}

export default function Dag01Tradkort() {
  return (
    <Utskrift
      navn="dag01-tradkort"
      papir="tykt"
      tosidig
      deler={[
        {
          str: "A7",
          antall: KORT.length,
          forside: (i) => <Forside vis={KORT[i]} rune={HJORNE[i]} />,
          bakside: (i) =>
            i < TRAAD ? (
              <div className="h-full flex items-center justify-center">
                <Prikker n={i + 1} />
              </div>
            ) : null,
        },
      ]}
      instruks={{
        hjorne: true,
        klipp:
          "åtte kort langs de stiplede linjene. Kort 1–6 har prikker bak (1–6); E og T har ingen.",
        hvor: "Søndag 29. november: klyp kort 1–6 på 4 m rødt garn i rekkefølge fra TV-enden (krystall, I, krystall, N, krystall, krystall), første 40 cm fra TV-en, så cirka 55 cm mellom. Mandag kveld: tråden fra TV-foten til Rampenissens arm, kortene opp. E og T løse mellom klementinene i elva, uten klype.",
      }}
    />
  );
}
