import { RUNE_ALPHABET } from "@/components/ui/Frostrune";
import { PrintPage, CutCard } from "../PrintPage";
import { Ark } from "./felles";

// 29 cells must fit the 190 mm printable width with the card padding
const RUTE = "w-[6.2mm]";

export default function Alfabetstrimmel() {
  return (
    <PrintPage
      title="Alfabetstrimmelen og trehopperen"
      paper="1 ark, tykt papir"
      note="Brukes dag 5 (ved brevfuglen) og igjen dag 22. To strimler og to hoppere: én til bruk, én i reserve. Hopperen er nøyaktig tre ruter bred; den har verken tall eller piler."
    >
      <Ark>
        <div className="flex flex-col gap-[10mm] items-center mt-[10mm]">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-[6mm] items-center">
              <CutCard>
                <div className="flex">
                  {RUNE_ALPHABET.map((l) => (
                    <div
                      key={l}
                      className={`${RUTE} h-[18mm] border-r border-black last:border-r-0 flex items-center justify-center text-[6mm]`}
                    >
                      {l}
                    </div>
                  ))}
                </div>
              </CutCard>
              <CutCard>
                <div className="flex">
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      className={`${RUTE} h-[24mm] border-r border-black last:border-r-0`}
                    />
                  ))}
                </div>
              </CutCard>
            </div>
          ))}
        </div>
      </Ark>
    </PrintPage>
  );
}
