import { Utskrift } from "../Utskrift";

const TEKST = "GI OSS ALLE PEPPERKAKENE. ELLERS.";
const FONTER = ["font-serif", "font-sans", "font-mono", "font-retro"];

export default function Dag17Losepengebrev() {
  return (
    <Utskrift
      navn="dag17-losepengebrev"
      papir="vanlig"
      deler={[
        {
          str: "A4",
          forside: () => (
            <div className="h-full p-[12mm] flex flex-col justify-center gap-[20mm]">
              <div
                className="flex flex-wrap gap-x-[8mm] gap-y-[6mm] justify-center"
                aria-label={TEKST}
              >
                {TEKST.split(" ").map((ord, w) => (
                  <span key={w} className="flex gap-[1mm]">
                    {ord.split("").map((c, i) => {
                      const k = w * 7 + i;
                      return (
                        <span
                          key={i}
                          className={`${FONTER[k % 4]} text-[14mm] font-bold px-[1mm] border border-black ${k % 3 ? "bg-white" : "bg-gray-200"}`}
                          style={{
                            transform: `rotate(${((k * 37) % 15) - 7}deg)`,
                          }}
                        >
                          {c}
                        </span>
                      );
                    })}
                  </span>
                ))}
              </div>
              <p className="text-right text-[9mm] font-serif italic">
                – Kosedyrene
              </p>
            </div>
          ),
        },
      ]}
      instruks={{
        hvor: "Valgfritt, kvelden 16. des.: ved Rampenissen på stolen, sammen med den håndskrevne lappen.",
      }}
    />
  );
}
