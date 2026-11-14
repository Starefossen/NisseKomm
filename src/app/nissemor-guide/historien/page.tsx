"use client";

import Link from "next/link";
import { GuideSide, Kort, useSesong } from "../_kveld/felles";
import { slug, Vurder } from "../vurdering";
import { Markdown } from "./markdown";

function Historien() {
  const sesong = useSesong();
  if (!sesong) return <p>Laster …</p>;
  return (
    <>
      {sesong.historien.map((h) => (
        <Kort key={h.tittel} tittel={h.tittel}>
          {h.deler.map((d, i) => (
            <Markdown key={i} tekst={d} />
          ))}
          <Vurder id={`historien/${slug(h.tittel)}`} />
        </Kort>
      ))}
      <Kort tittel="Figurene">
        <ul className="space-y-1">
          {sesong.figurer.map((f) => (
            <li key={f.id}>
              <Link
                href={`/nissemor-guide/bibliotek#${f.id}`}
                className="underline text-(--gold) inline-block min-h-11 py-2"
              >
                {f.navn}
              </Link>
              {f.om && `: ${f.om}`}
            </li>
          ))}
        </ul>
      </Kort>
    </>
  );
}

export default function HistorienSide() {
  return (
    <GuideSide>
      <h1 className="text-4xl font-bold text-(--gold) text-center">
        HISTORIEN
      </h1>
      <p>
        Dette er bakgrunnen for sesongen, hentet fra historie- og
        storyboard-dokumentene. Hver dag står i Dager.
      </p>
      <Link
        href="/nissemor-guide/sesong"
        className="block min-h-11 p-2 border-2 border-(--gold) text-center"
      >
        Sesongkart: hele desember på én side
      </Link>
      <Historien />
    </GuideSide>
  );
}
