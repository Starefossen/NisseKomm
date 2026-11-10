"use client";

import Link from "next/link";
import { utskriftHref } from "../printout/filer";
import {
  Avkrysning,
  GuideSide,
  Kort,
  fyll,
  hentDag,
  morgendagen,
  useAvkrysning,
  type Dag,
} from "../_kveld/felles";

function Kveld({ d }: { d: Dag }) {
  const { krysset, veksle } = useAvkrysning(`kveld-${d.dag}`);
  const punkter = [
    ...d.utskrifter.map((u) => `Skriv ut ${u}`),
    `Gåten: ${fyll(d.iKveld)}`,
    `Rampestreken: ${fyll(d.strek.tekst)}`,
  ];
  return (
    <>
      <h1 className="text-4xl font-bold text-(--gold) text-center">
        I KVELD: KLAR TIL DAG {d.dag}
      </h1>
      <p className="text-center">
        {fyll(d.tittel)} ·{" "}
        <Link
          href={`/nissemor-guide/fasit?dag=${d.dag}`}
          className="underline text-(--cold-blue)"
        >
          fasit
        </Link>
      </p>

      <Kort tittel="Sjekkliste for kvelden" farge="border-(--gold)">
        <Avkrysning punkter={punkter} krysset={krysset} veksle={veksle} />
      </Kort>

      <Kort tittel={`Rampestrek (${d.strek.minutter} min, ${d.strek.type})`}>
        <p>{fyll(d.strek.tekst)}</p>
        <p>
          <b>Materialer:</b> {d.strek.materialer}
        </p>
        <p>
          <b>Bærer dagens brikke:</b> {d.strek.brikke}
        </p>
      </Kort>

      <Kort tittel={`Gåten (${d.oppsett})`}>
        <p>
          <b>Gjør i kveld:</b> {fyll(d.iKveld)}
        </p>
        <p>
          <b>Slik skal det se ut:</b> {fyll(d.brikkeH)}
        </p>
        <p>
          <b>Materialer:</b> {fyll(d.materialer)}
        </p>
      </Kort>

      <Kort tittel="Utskrifter" farge="border-(--cold-blue)">
        <ul className="list-disc pl-6">
          {d.utskrifter.map((u) => (
            <li key={u}>
              <Link href={utskriftHref(u)} className="underline">
                {u}
              </Link>
            </li>
          ))}
        </ul>
        <p className="opacity-80">{fyll(d.utskrifterTekst)}</p>
      </Kort>
    </>
  );
}

export default function IKveldSide() {
  const dag = morgendagen();
  const d = dag ? hentDag(dag) : undefined;
  return (
    <GuideSide>
      {d ? (
        <Kveld key={d.dag} d={d} />
      ) : (
        <Kort tittel="I kveld">
          <p>Ingen luke i morgen.</p>
          <Link href="/nissemor-guide/forberedelser" className="underline">
            Se forberedelsene
          </Link>
        </Kort>
      )}
    </GuideSide>
  );
}
