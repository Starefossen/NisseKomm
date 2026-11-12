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
              <h2 className="text-[8mm] text-center leading-tight">
                SLIK BRETTER DU EN SERVIETTFUGL
              </h2>
              <ol className="text-[6mm] leading-snug space-y-[2mm] list-decimal pl-[7mm]">
                {STEG.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <p className="mt-auto text-center text-[5mm]">
                – RAMPENISSEN (MINE ER SKJEVERE)
              </p>
            </div>
          ),
        },
      ]}
      instruks={{
        klipp: "anvisningen langs den stiplede linjen.",
        hvor: "Valgfri, dag 14: ved papirbåten i vasken. Bare moro, ingen brikke.",
      }}
    />
  );
}
