"use client";

import Link from "next/link";
import { useState } from "react";
import { GuideSide, useSesong } from "../../_kveld/felles";

const celle = "border border-(--neon-green)/50 p-1 align-top text-sm";

/** All 24 riddles on one page: where the pieces are and how long setup takes. */
function Kart() {
  const sesong = useSesong();
  const [vis, setVis] = useState(false);
  if (!sesong) return <p>Laster …</p>;
  // Bold letters and the code stay hidden until «Vis fasit».
  const skjul = (s: string, kode: string) =>
    vis
      ? s.replace(/\*\*/g, "")
      : s
          .replace(/\*\*(.+?)\*\*/g, (_, x: string) => "•".repeat(x.length))
          .replace(new RegExp(kode, "gi"), "•".repeat(kode.length));
  return (
    <>
      <button
        type="button"
        onClick={() => setVis(!vis)}
        className={`min-h-11 px-3 border-2 border-(--neon-green) ${vis ? "bg-(--gold) text-black" : ""}`}
      >
        {vis ? "Skjul fasit" : "Vis fasit"}
      </button>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-(--gold)">
              {[
                "Dag",
                "Hjemme",
                "Mail",
                "Julius",
                "NisseNet/PS/symbol",
                "Kode",
                "Oppsett",
              ].map((h) => (
                <th key={h} className={celle}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sesong.kart.map((r) => (
              <tr key={r.dag}>
                <td className={celle}>
                  <Link
                    href={`/nissemor-guide/dag/${r.dag}#kart`}
                    className="underline"
                  >
                    {r.dag}. {r.tittel}
                  </Link>
                </td>
                <td className={celle}>{skjul(r.hjemme, r.kode)}</td>
                {[r.epost, r.julius, r.annet].map((l, i) => (
                  <td key={i} className={celle}>
                    {l.join(" · ") || "–"}
                  </td>
                ))}
                <td className={`${celle} text-(--gold)`}>
                  {vis ? r.kode : "•".repeat(r.kode.length)}
                </td>
                <td className={celle}>{r.oppsett}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function KartSide() {
  return (
    <GuideSide>
      <h1 className="text-4xl font-bold text-(--gold) text-center">GÅTEKART</h1>
      <Kart />
    </GuideSide>
  );
}
