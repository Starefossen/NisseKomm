import { Utskrift } from "../Utskrift";

const SYMBOLDAGER = [3, 6, 9, 12, 15, 18, 20, 22, 23];
const MILEPAELER = [1, 7, 12, 15, 21, 24];

// Boxes, lines and layout are inline styles so the board keeps its shape even
// if the print loses the stylesheet; only fonts and text sizes use Tailwind.
const L = (w: number, s = "solid") => `${w}mm ${s} #000`;

/** 194 × 550 mm (A3 as 2 × A4); leaves a 158 × 220 mm field for the A5 rune board. */
function Brett() {
  return (
    <div
      className="font-retro"
      style={{
        height: "100%",
        boxSizing: "border-box",
        padding: "6mm",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        border: L(2, "double"),
      }}
    >
      <h1 className="text-[13mm] leading-none tracking-widest text-center mt-[4mm]">
        OPERASJON DIREKTELINJEN
      </h1>
      <p className="text-[6mm] mb-[8mm]">
        SNØFALL · LINJE 90,0 MHz · K12 · H9 · H5
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 48mm)",
          gap: "5mm",
        }}
      >
        {SYMBOLDAGER.map((d) => (
          <div
            key={d}
            style={{
              width: "48mm",
              height: "48mm",
              boxSizing: "border-box",
              border: L(1),
              position: "relative",
            }}
          >
            <span
              className="text-[6mm]"
              style={{ position: "absolute", top: "1mm", left: "2mm" }}
            >
              {d}. DES
            </span>
          </div>
        ))}
      </div>
      <h2 className="text-[8mm] mt-[10mm] mb-[3mm]">MILEPÆLER</h2>
      <div style={{ position: "relative", display: "flex", gap: "6mm" }}>
        <div
          style={{
            position: "absolute",
            top: "10.5mm",
            left: "11mm",
            right: "11mm",
            borderTop: L(1),
          }}
        />
        {MILEPAELER.map((d) => (
          <div
            key={d}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: "22mm",
                height: "22mm",
                boxSizing: "border-box",
                borderRadius: "50%",
                border: L(1),
                background: "#fff",
              }}
            />
            <span className="text-[6mm]">{d}</span>
          </div>
        ))}
      </div>
      <div
        className="text-[8mm] text-gray-400"
        style={{
          marginTop: "auto",
          marginBottom: "4mm",
          width: "158mm",
          height: "220mm",
          boxSizing: "border-box",
          border: L(0.8, "dashed"),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        RUNETAVLE HER
      </div>
    </div>
  );
}

export default function Operasjonsbrett() {
  return (
    <Utskrift
      navn="operasjonsbrett"
      papir="tykt"
      deler={[{ str: "A3", forside: () => <Brett /> }]}
      instruks={{
        brett: "i fire når det er limt, så det får plass i ferdskriveren.",
        hvor: "I ferdskriveren med runetavla og et ark med seks runde gullklistremerker, kvelden 30. november. Etter koden dag 1 henges det opp ved skjermen, runetavla limes i feltet nederst, og sirkel 1 får sitt klistremerke. Symbolkortene festes i rutene med datoene.",
      }}
    />
  );
}
