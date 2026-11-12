/*
 * All rampestrek sketches, 12 per A4 sheet, for sharing with family and
 * friends: only the sketch and a short title, never codes.
 * PNG: `mise run strekark` screenshots each [data-strekark] sheet.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { harRolle } from "@/lib/auth-server";
import { mediaDir } from "@/lib/media-server";
import { Oppfrisk } from "../[fil]/Oppfrisk";
import { Utskrift } from "../_print/Utskrift";
import { STREK_TITLER } from "./titler";

export const dynamic = "force-dynamic";

const fil = (n: number) => `strek/dag${String(n).padStart(2, "0")}.png`;

export default async function Rampestreker() {
  if (!(await harRolle("parent")))
    return (
      <GuideAuth>
        <Oppfrisk />
      </GuideAuth>
    );
  const finnes = STREK_TITLER.map((_, i) =>
    existsSync(path.join(mediaDir(), fil(i + 1))),
  );
  return (
    <div className="min-h-screen bg-(--dark-crt) p-8 print:min-h-0 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <GuideNavigation />
      </div>
      <Utskrift
        navn="rampestreker"
        papir="vanlig"
        farge
        deler={[
          {
            str: "A4",
            antall: 2,
            forside: (a) => (
              <div
                data-strekark={a + 1}
                className="h-full bg-white p-[6mm] flex flex-col font-sans"
              >
                <h2 className="text-center text-[6mm] font-bold mb-[4mm]">
                  Rampenissens rampestreker 2026 · {a + 1}/2
                </h2>
                <div className="grid grid-cols-3 grid-rows-4 gap-x-[5mm] gap-y-[3mm] flex-1">
                  {STREK_TITLER.slice(a * 12, a * 12 + 12).map((t, j) => {
                    const n = a * 12 + j + 1;
                    return (
                      <figure key={n} className="flex flex-col items-center">
                        {finnes[n - 1] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/media/${fil(n)}`}
                            alt=""
                            className="w-[52mm] h-[52mm] object-cover border border-gray-400"
                          />
                        ) : (
                          <div className="w-[52mm] h-[52mm] border border-gray-300 flex items-center justify-center text-gray-400 text-[4mm]">
                            Skisse kommer
                          </div>
                        )}
                        <figcaption className="text-[3.5mm] mt-[1mm] text-center">
                          Dag {n} · {t}
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </div>
            ),
          },
        ]}
        instruks={{
          hvor: "Til deling med familie og venner: bare skissene og en kort tittel, ingen koder. PNG: mise run strekark.",
        }}
      />
    </div>
  );
}
