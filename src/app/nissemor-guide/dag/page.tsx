"use client";

import Link from "next/link";
import { getCurrentDay, getCurrentMonth } from "@/lib/date-utils";
import { GameEngine } from "@/lib/game-engine";
import { GuideSide, morgendagen, useSesong, useSynk } from "../_kveld/felles";

function Dager() {
  useSynk();
  const idag =
    getCurrentMonth() === 12 && getCurrentDay() <= 24 ? getCurrentDay() : 0;
  const iKveld = morgendagen();
  const sesong = useSesong();
  if (!sesong) return <p>Laster …</p>;
  return (
    <ol className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {sesong.dager.map((d) => {
        const lost = GameEngine.isQuestCompleted(d.dag);
        const status = lost
          ? "løst"
          : d.dag === idag
            ? "i dag"
            : d.dag === iKveld
              ? "i kveld"
              : d.dag < idag
                ? "ikke løst"
                : "kommer";
        return (
          <li key={d.dag}>
            <Link
              href={`/nissemor-guide/dag/${d.dag}${d.dag === iKveld ? "#kveld" : ""}`}
              className={`block min-h-11 p-2 border-2 h-full hover:bg-(--neon-green)/20 ${
                lost
                  ? "border-(--gold) text-(--gold)"
                  : d.dag === idag || d.dag === iKveld
                    ? "border-(--cold-blue)"
                    : "border-(--neon-green)"
              }`}
            >
              <span className="text-2xl">{d.dag}</span> · {status}
              {/* The title's first part never holds the code. */}
              <span className="block">{d.tittel.split(" · ")[0]}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export default function DagerSide() {
  return (
    <GuideSide>
      <h1 className="text-4xl font-bold text-(--gold) text-center">DAGER</h1>
      <Link
        href="/nissemor-guide/dag/kart"
        className="block min-h-11 p-2 border-2 border-(--gold) text-center"
      >
        Gåtekart for hele sesongen
      </Link>
      <Dager />
    </GuideSide>
  );
}
