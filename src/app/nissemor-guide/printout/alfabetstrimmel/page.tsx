import { RUNE_ALPHABET } from "@/components/ui/Frostrune";
import { Ark, Klipp, Utskrift } from "../_print/Utskrift";

const RUTE = "w-[6.4mm]";

export default function Alfabetstrimmel() {
  return (
    <Utskrift
      tittel="Alfabetstrimmelen og trehopperen"
      papir="1 ark, tykt papir"
      merknad="Brukes dag 5 (ved brevfuglen) og igjen dag 22. To strimler og to hoppere: én til bruk, én i reserve. Hopperen er nøyaktig tre ruter bred; den har verken tall eller piler."
    >
      <Ark>
        <div className="flex flex-col gap-[10mm] items-center mt-[10mm]">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-[6mm] items-center">
              <Klipp className="flex">
                {RUNE_ALPHABET.map((l) => (
                  <div
                    key={l}
                    className={`${RUTE} h-[18mm] border-r border-black last:border-r-0 flex items-center justify-center text-[6mm]`}
                  >
                    {l}
                  </div>
                ))}
              </Klipp>
              <Klipp className="flex">
                {[0, 1, 2].map((j) => (
                  <div
                    key={j}
                    className={`${RUTE} h-[24mm] border-r border-black last:border-r-0`}
                  />
                ))}
              </Klipp>
            </div>
          ))}
        </div>
      </Ark>
    </Utskrift>
  );
}
