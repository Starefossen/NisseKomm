import { Ark, Utskrift } from "../_print/Utskrift";
import { Rodstoy } from "../_print/Rodstoy";

const TETTHET = [40, 70, 110];

export default function Dag10Testark() {
  return (
    <Utskrift
      tittel="Dag 10 – testark for rødfilteret"
      papir="1 ark, vanlig papir, fargeutskrift (testes i november)"
      merknad="Se på arket uten og med rødfilteret. Velg den tettheten der bokstaven er skjult uten filter og lett å lese med. Ser du den uten filter, legg ett lag cellofan til, eller bruk side 2 av fargekortene og tegn selv."
    >
      <Ark stil="forelder">
        <h1 className="text-2xl font-bold mb-4">Testark rødfilter</h1>
        <div className="grid grid-cols-3 gap-4">
          {TETTHET.map((t) => (
            <div key={t} className="flex flex-col gap-2">
              <div className="h-[60mm] border border-gray-400 text-[30mm] leading-none font-['VT323',monospace]">
                <Rodstoy tetthet={t}>X</Rodstoy>
              </div>
              <div className="text-center">Tetthet {t}</div>
            </div>
          ))}
        </div>
        <p className="mt-6">
          Filteret: rødt cellofan i to lag i rammen fra rodfilter-ramme. Hold
          arket i dagslys eller under en vanlig lampe.
        </p>
      </Ark>
    </Utskrift>
  );
}
