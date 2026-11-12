import { Utskrift } from "../Utskrift";
import { Rodstoy } from "./Rodstoy";

const TETTHET = [40, 70, 110];

export default function Dag10Testark() {
  return (
    <Utskrift
      navn="dag10-testark"
      papir="vanlig"
      farge
      deler={[
        {
          str: { b: 194, h: 100 },
          forside: () => (
            <div className="h-full p-[5mm] font-sans flex flex-col gap-[3mm]">
              <div className="text-[5mm] font-bold">Testark rødfilter</div>
              <div className="flex-1 grid grid-cols-3 gap-[4mm]">
                {TETTHET.map((t) => (
                  <div key={t} className="flex flex-col gap-[1mm]">
                    <div className="flex-1 border-[0.3mm] border-gray-400 text-[30mm] leading-none font-retro">
                      <Rodstoy tetthet={t}>X</Rodstoy>
                    </div>
                    <div className="text-center text-[4mm]">Tetthet {t}</div>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
      ]}
      instruks={{
        hvor: "I november: se på arket uten og med rødfilteret, i dagslys eller under en vanlig lampe. Velg tettheten der X-en er skjult uten filter og lett å lese med. Ser du den uten filter, legg ett lag cellofan til, eller bruk side 2 av fargekortene og tegn selv.",
      }}
    />
  );
}
