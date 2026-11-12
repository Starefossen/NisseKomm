import { Utskrift } from "../Utskrift";

/** Tent sign: fold across the middle; the top half is upside down so both sides read. */
export function Skilt({
  navn,
  linjer,
  hvor,
  stein = false,
}: {
  navn: string;
  linjer: string[];
  hvor: string;
  stein?: boolean;
}) {
  const side = (snu: boolean) => (
    <div
      className={`h-1/2 flex items-center justify-center p-[8mm] ${snu ? "rotate-180" : ""}`}
    >
      <div
        className={`w-full h-full border-[2mm] border-double border-black flex flex-col items-center justify-center gap-[6mm] text-center font-retro ${stein ? "rounded-t-[40mm]" : ""}`}
      >
        {linjer.map((l) => (
          <div key={l} className="text-[16mm] leading-none">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <Utskrift
      navn={navn}
      papir="tykt"
      deler={[
        {
          str: "A4",
          forside: () => (
            <div className="h-full flex flex-col">
              {side(true)}
              <div className="border-t-[0.3mm] border-dashed border-gray-500" />
              {side(false)}
            </div>
          ),
        },
      ]}
      instruks={{
        brett: "på tvers langs midtstreken, så skiltet står som et telt.",
        hvor,
      }}
    />
  );
}
