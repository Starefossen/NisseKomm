"use client";

import Link from "next/link";
import { GuideSide, Kort } from "../_kveld/felles";
import { SIDER_01_12 } from "./_print/dager01-12";
import { SIDER_17_24 } from "./_print/dager17-24";
import {
  FERDIGE,
  UTSKRIFTER,
  utskriftDag,
  utskriftHref,
  utskriftTittel,
} from "./filer";

const laget = (navn: string) =>
  navn in FERDIGE || navn in SIDER_01_12 || navn in SIDER_17_24;

const dager = [...new Set(UTSKRIFTER.map((u) => utskriftDag(u) ?? 0))].sort(
  (a, b) => a - b,
);

export default function PrintoutPage() {
  return (
    <GuideSide>
      <h1 className="text-4xl font-bold text-(--gold) text-center">
        UTSKRIFTER
      </h1>
      {dager.map((dag) => (
        <Kort key={dag} tittel={dag ? `Dag ${dag}` : "Hele sesongen"}>
          <ul className="grid sm:grid-cols-2 gap-x-4">
            {UTSKRIFTER.filter((u) => (utskriftDag(u) ?? 0) === dag).map(
              (navn) => (
                <li key={navn}>
                  <Link
                    href={utskriftHref(navn)}
                    className="min-h-11 flex items-center gap-2"
                  >
                    <span className="underline">{utskriftTittel(navn)}</span>
                    {laget(navn) ? (
                      <span className="text-(--gold)">klar</span>
                    ) : (
                      <span className="text-(--cold-blue)">mangler</span>
                    )}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </Kort>
      ))}
    </GuideSide>
  );
}
