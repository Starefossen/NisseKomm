"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { getCurrentDay, getCurrentMonth } from "@/lib/date-utils";
import { DAGER } from "../_kveld/data";
import { GuideSide, Kort, fyll, hentDag } from "../_kveld/felles";

function Fasit() {
  const params = useSearchParams();
  const router = useRouter();
  const idag =
    getCurrentMonth() === 12 && getCurrentDay() <= 24 ? getCurrentDay() : 1;
  const d = hentDag(Number(params.get("dag")) || idag) ?? DAGER[0];
  return (
    <>
      <h1 className="text-4xl font-bold text-(--gold) text-center">FASIT</h1>
      <select
        value={d.dag}
        onChange={(e) => router.replace(`?dag=${e.target.value}`)}
        className="w-full min-h-11 bg-(--dark-crt) border-4 border-(--neon-green) p-2"
        aria-label="Velg dag"
      >
        {DAGER.map((x) => (
          <option key={x.dag} value={x.dag}>
            Dag {x.dag}: {fyll(x.tittel)}
          </option>
        ))}
      </select>
      <Kort tittel={`Kode: ${fyll(d.kode)}`} farge="border-(--gold)">
        <p>{fyll(d.mekanikk)}</p>
        <p>
          <b>I huset:</b> {fyll(d.brikkeH)}
        </p>
        <p>
          <b>Fra Julius:</b> {fyll(d.brikkeS)}
        </p>
      </Kort>
      <Kort tittel="Slik løses den">
        <ol className="list-decimal pl-6 space-y-1">
          {d.slikLoses.map((s) => (
            <li key={s}>{fyll(s)}</li>
          ))}
        </ol>
        <p>
          <b>Hanna (hvis hun vil):</b> {fyll(d.hanna)}
        </p>
      </Kort>
      <Kort tittel="Hvis noe er borte" farge="border-(--christmas-red)">
        <p>{fyll(d.reserve)}</p>
      </Kort>
    </>
  );
}

export default function FasitSide() {
  return (
    <GuideSide>
      <Fasit />
    </GuideSide>
  );
}
