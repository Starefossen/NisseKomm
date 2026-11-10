"use client";

import Link from "next/link";
import { useState } from "react";
import { GuideSettings } from "@/components/nissemor/GuideSettings";
import { GameEngine } from "@/lib/game-engine";
import { getCurrentDay, getCurrentMonth } from "@/lib/date-utils";
import { GuideSide, Kort } from "../_kveld/felles";

function Feilforsok() {
  const dag =
    getCurrentMonth() === 12 && getCurrentDay() <= 24 ? getCurrentDay() : null;
  const [antall, setAntall] = useState(() =>
    dag ? GameEngine.getFailedAttempts(dag) : 0,
  );
  if (!dag) return <p>Ingen luke i dag.</p>;
  return (
    <>
      <p>
        Feil koder i dag (dag {dag}): {antall}. Etter tre feil viser terminalen
        et tips fra Julius.
      </p>
      <button
        onClick={() => {
          GameEngine.resetFailedAttempts(dag);
          setAntall(0);
        }}
        className="px-4 min-h-11 border-2 border-(--cold-blue) text-(--cold-blue) hover:bg-(--cold-blue)/20"
      >
        Nullstill feilforsøk
      </button>
    </>
  );
}

export default function InnstillingerSide() {
  return (
    <GuideSide>
      <h1 className="text-4xl font-bold text-(--gold) text-center">
        INNSTILLINGER
      </h1>
      <GuideSettings />
      <Kort tittel="Feil koder" farge="border-(--cold-blue)">
        <Feilforsok />
      </Kort>
      <Kort tittel="Simulering">
        {/* Slot for the Simulering tools (built separately). */}
        <p className="opacity-80">Kommer snart.</p>
      </Kort>
      <Kort tittel="Mer">
        <ul className="list-disc pl-6">
          <li>
            <Link href="/nissemor-guide/merker" className="underline">
              Merker
            </Link>
          </li>
          <li>
            <Link href="/nissemor-guide/symboler" className="underline">
              Symbolkort med QR-koder
            </Link>
          </li>
        </ul>
      </Kort>
    </GuideSide>
  );
}
