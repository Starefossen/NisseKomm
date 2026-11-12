"use client";

import Link from "next/link";
import { GuideSide, Kort, useSesong, type Sesong } from "../_kveld/felles";
import { SIDER_01_12 } from "./_print/dager01-12";
import { SIDER_13_24 } from "./_print/dager13-24";
import { FERDIGE, UTSKRIFTER, utskriftHref } from "./filer";

const laget = (navn: string) =>
  navn in FERDIGE || navn in SIDER_01_12 || navn in SIDER_13_24;

function grupper(dager: Sesong["dager"]) {
  const perDag = dager
    .map((d) => ({ tittel: `Dag ${d.dag}`, filer: d.utskrifter }))
    .filter((g) => g.filer.length);
  const brukt = new Set<string>(perDag.flatMap((g) => g.filer));
  return [
    ...perDag,
    {
      tittel: "Andre",
      filer: UTSKRIFTER.filter((u) => !brukt.has(u)) as string[],
    },
  ].filter((g) => g.filer.length);
}

function Liste() {
  const sesong = useSesong();
  if (!sesong) return <p>Laster …</p>;
  return grupper(sesong.dager).map((g) => (
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
  ));
}

export default function PrintoutPage() {
  return (
    <GuideSide>
      <h1 className="text-4xl font-bold text-(--gold) text-center">
        UTSKRIFTER
      </h1>
      <Liste />
    </GuideSide>
  );
}
