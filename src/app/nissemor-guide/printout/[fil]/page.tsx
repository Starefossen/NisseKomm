/*
 * A printout, rendered on the server for a parent session only: the cards
 * carry the day's solution, so none of it may land in a client chunk
 * (scripts/sjekk-klientkoder.mjs).
 */
import { permanentRedirect } from "next/navigation";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { harRolle } from "@/lib/auth-server";
import { UTSKRIFTER, utskriftTittel } from "../filer";
import { SIDER_01_12 } from "../_print/dager01-12";
import { SIDER_17_24 } from "../_print/dager17-24";
import { Oppfrisk } from "./Oppfrisk";

export const dynamic = "force-dynamic";

// Renamed so the printout list in client code does not spell a day code.
const FLYTTET: Record<string, string> = {
  "dag08-kretskort": "dag08-lamper",
  "dag16-sorteringslapper": "dag16-hyllelapper",
};

export default async function Utskriftside({
  params,
}: {
  params: Promise<{ fil: string }>;
}) {
  if (!(await harRolle("parent")))
    return (
      <GuideAuth>
        <Oppfrisk />
      </GuideAuth>
    );
  const { fil } = await params;
  if (FLYTTET[fil])
    permanentRedirect(`/nissemor-guide/printout/${FLYTTET[fil]}`);
  const Side = SIDER_01_12[fil] ?? SIDER_17_24[fil];
  if (Side)
    return (
      <div className="min-h-screen bg-(--dark-crt) p-8 print:min-h-0 print:bg-white print:p-0">
        <div className="max-w-4xl mx-auto mb-6 print:hidden">
          <GuideNavigation />
        </div>
        <Side />
      </div>
    );
  // ponytail: placeholder for printouts not yet designed; each gets its own page when made
  const kjent = (UTSKRIFTER as readonly string[]).includes(fil);
  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-retro p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <GuideNavigation />
        <h1 className="text-4xl font-bold text-center">
          {utskriftTittel(fil)}
        </h1>
        <p className="text-xl text-center opacity-80">
          {kjent
            ? "Denne utskriften er ikke laget ennå. Se docs/gaater-2026.md for innholdet."
            : "Fant ingen utskrift med dette navnet."}
        </p>
      </div>
    </div>
  );
}
