import { Utskrift } from "../Utskrift";

const STEG = [
  "Brett servietten på skrå til en trekant.",
  "Brett de to spissene i bunnen opp mot toppen.",
  "Brett hele fuglen på midten, så vingene møtes.",
  "Brett vingene ned, én på hver side.",
  "Knekk nebbet ned i den ene spissen.",
  "Sett fuglen på bordet. Gi den et navn.",
];

export default function Dag14Serviettfugl() {
  return (
    <Utskrift
      navn="dag14-serviettfugl"
      papir="vanlig"
      deler={[
        {
          str: "A5",
          forside: () => (
            <div className="h-full p-[8mm] flex flex-col gap-[5mm] font-retro">
              <h2 className="text-[9mm] leading-none text-center">
                SLIK BRETTER DU EN SERVIETTFUGL
              </h2>
              <ol className="text-[6mm] leading-snug space-y-[3mm] list-decimal pl-[8mm]">
                {STEG.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <p className="mt-auto text-right text-[5mm]">
                – Rampenissen (mine er skjevere)
              </p>
            </div>
          ),
        },
      ]}
      instruks={{
        klipp: "langs den stiplede linjen.",
        hvor: "Valgfritt, kvelden 13. des.: ved papirbåten i vasken, sammen med en serviett.",
      }}
    />
  );
}
