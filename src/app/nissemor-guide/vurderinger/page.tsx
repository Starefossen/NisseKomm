"use client";

import Link from "next/link";
import { GuideSide, Kort } from "../_kveld/felles";
import { useVurderinger, vurderingHref } from "../vurdering";

/** Everything not approved (media and guide sections), newest first. */
function Liste() {
  const alle = useVurderinger();
  if (!alle) return <p>Laster … (bare på hjemmenettet)</p>;
  const apne = Object.entries(alle)
    .filter(
      ([, v]) =>
        v.vurdering !== "godkjent" && (v.vurdering !== "ok" || v.notat),
    )
    .sort(([, a], [, b]) =>
      (b.oppdatert ?? "").localeCompare(a.oppdatert ?? ""),
    );
  if (apne.length === 0) return <p>Ingenting venter. Alt er godkjent.</p>;
  return (
    <ul className="space-y-2">
      {apne.map(([id, v]) => (
        <li key={id} className="border-b border-(--neon-green)/30 pb-2">
          <Link
            href={vurderingHref(id)}
            className="underline text-(--gold) inline-block min-h-11 py-2 break-all"
          >
            {id}
          </Link>{" "}
          <span
            className={
              v.vurdering === "lag_paa_nytt"
                ? "text-(--christmas-red)"
                : v.vurdering === "ok"
                  ? "text-amber-300"
                  : "text-(--cold-blue)"
            }
          >
            {v.vurdering === "lag_paa_nytt"
              ? "Lag på nytt"
              : v.vurdering === "ok"
                ? "◐ OK (lærdom)"
                : "Bare notat"}
          </span>
          {v.notat && <p>{v.notat}</p>}
        </li>
      ))}
    </ul>
  );
}

export default function VurderingerSide() {
  return (
    <GuideSide>
      <h1 className="text-4xl font-bold text-(--gold) text-center">
        VURDERINGER
      </h1>
      <Kort tittel="Ikke godkjent">
        <Liste />
      </Kort>
    </GuideSide>
  );
}
