"use client";

import Link from "next/link";
import { DAGER } from "../_kveld/data";
import { GuideSide, Kort } from "../_kveld/felles";
import { SIDER_01_12 } from "./_print/dager01-12";
import { SIDER_13_24 } from "./_print/dager13-24";
import { FERDIGE, UTSKRIFTER, utskriftHref } from "./filer";

const laget = (navn: string) =>
  navn in FERDIGE || navn in SIDER_01_12 || navn in SIDER_13_24;

const perDag = DAGER.map((d) => ({
  tittel: `Dag ${d.dag}`,
  filer: d.utskrifter.filter((u) => (UTSKRIFTER as readonly string[]).includes(u)),
})).filter((g) => g.filer.length);
const brukt = new Set(perDag.flatMap((g) => g.filer));
const grupper = [
  ...perDag,
  { tittel: "Andre", filer: UTSKRIFTER.filter((u) => !brukt.has(u)) },
].filter((g) => g.filer.length);

export default function PrintoutPage() {
  return (
    <GuideSide>
      <h1 className="text-4xl font-bold text-(--gold) text-center">
        UTSKRIFTER
      </h1>
      {grupper.map((g) => (
        <Kort key={g.tittel} tittel={g.tittel}>
          <ul className="grid sm:grid-cols-2 gap-x-4">
            {g.filer.map((navn) => (
              <li key={navn}>
                <Link
                  href={utskriftHref(navn)}
                  className="underline min-h-11 flex items-center break-all"
                >
                  {navn}
                  {!laget(navn) && (
                    <span className="ml-2 no-underline text-(--cold-blue)">
                      (ikke laget ennå)
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Kort>
      ))}
    </GuideSide>
  );
}
