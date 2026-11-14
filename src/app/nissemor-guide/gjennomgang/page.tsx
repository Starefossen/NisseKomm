"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BeslutningVisning } from "./beslutning";
import { GuideSide } from "../_kveld/felles";
import { useData } from "./celle";
import { alleElementer } from "./elementer";
import { SIDE, knapp } from "./felles";
import { Ko } from "./kovisning";
import { Matrise } from "./matrise";
import { Vurdering } from "./vurderingsvisning";

function Gjennomgang() {
  const sp = useSearchParams();
  const id = sp.get("id");
  const oversikt = sp.get("vis") === "oversikt";
  const d = useData();
  if (!d.sesong || !d.vurd || !d.media.files)
    return <p>Laster … (bare på hjemmenettet)</p>;
  // «Vurder dag N →» from the day view: the day's first item, N/P inside the day.
  const dagF = Number(sp.get("dag")) || 0;
  const forsteIDag =
    dagF && !id
      ? alleElementer("dag", d.sesong, d.media.files, d.krypto).find(
          (e) => e.dag === dagF,
        )?.id
      : undefined;
  if (id?.startsWith("beslutning/")) return <BeslutningVisning id={id} />;
  if (id || forsteIDag)
    return <Vurdering id={(id ?? forsteIDag)!} d={d} sesong={d.sesong} />;
  return (
    <>
      <h1 className="text-4xl font-bold text-(--gold) text-center">
        GJENNOMGANG
      </h1>
      <nav className="flex gap-2">
        <Link
          href={SIDE}
          aria-current={!oversikt}
          className={`${knapp} text-xl ${!oversikt ? "border-(--gold) text-(--gold)" : ""}`}
        >
          Kø
        </Link>
        <Link
          href={`${SIDE}?vis=oversikt`}
          aria-current={oversikt}
          className={`${knapp} text-xl ${oversikt ? "border-(--gold) text-(--gold)" : ""}`}
        >
          Oversikt
        </Link>
      </nav>
      {oversikt ? (
        <Matrise d={d} sesong={d.sesong} />
      ) : (
        <Ko d={d} sesong={d.sesong} />
      )}
    </>
  );
}

export default function GjennomgangSide() {
  return (
    <GuideSide>
      <Gjennomgang />
    </GuideSide>
  );
}
