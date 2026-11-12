import { Utskrift } from "../Utskrift";

const LINJER = ["† HER HVILER RAMPEN.", "HAN SPISTE 11."];
// Brikke H, dag 13 (gaater): Rampenissen's note, no code word.
const LAPP =
  "Siste ord: Ett av krydderne i posene var i bollene. Jeg smakte på alle fire for å finne ut hvilket. Ikke gjør det. – R";

const Side = () => (
  <div className="h-full flex flex-col items-center justify-center gap-[6mm] font-retro text-[14mm] leading-none text-center border-[2mm] border-double border-black">
    {LINJER.map((l) => (
      <div key={l}>{l}</div>
    ))}
    <div className="font-sans text-[5mm] leading-snug italic px-[10mm]">
      {LAPP}
    </div>
  </div>
);

export default function Dag13Gravskilt() {
  return (
    <Utskrift
      navn="dag13-gravskilt"
      papir="tykt"
      deler={[
        {
          str: { b: 194, h: 160 },
          forside: () => (
            <div className="h-full p-[4mm] flex flex-col">
              <div className="h-1/2 rotate-180">
                <Side />
              </div>
              <div className="h-1/2">
                <Side />
              </div>
            </div>
          ),
        },
      ]}
      instruks={{
        klipp: "skiltet langs den stiplede linjen.",
        brett: "på midten, så teksten står på begge sider som et telt.",
        hvor: "Rampestreken dag 13 (§8): ved Rampenissen på servietten, ved de fire krydderposene.",
      }}
    />
  );
}
