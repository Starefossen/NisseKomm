import { RuneText } from "@/components/ui/Frostrune";
import { Utskrift } from "../Utskrift";
import { Iskrystall } from "./felles";

export default function Dag24Krystallkort() {
  return (
    <Utskrift
      navn="dag24-krystallkort"
      papir="tykt"
      deler={[
        {
          str: "A6",
          forside: () => (
            <div className="h-full flex flex-col items-center justify-center gap-[8mm]">
              <Iskrystall size={60} />
              {["TAKK", "FOR", "LYSET"].map((ord) => (
                <RuneText key={ord} text={ord} size={40} />
              ))}
              <Iskrystall size={60} />
            </div>
          ),
        },
      ]}
      instruks={{
        klipp: "ett kort.",
        hvor: "Kvelden 23. des.: ved krystallet under treet. Vintervokterens eneste ord til barna, bare i tegn («TAKK FOR LYSET»).",
      }}
    />
  );
}
