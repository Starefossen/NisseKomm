"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GuideSide } from "../_kveld/felles";
import { Markdown } from "../historien/markdown";

type Rapport = { navn: string; tekst: string };

/** Item ids in a report (dag/04/tekster, manus/julius/dag-08#s1, a media path, …). */
const ID =
  /((?:dag\/\d\d\/[a-z]+|manus\/(?:julius|radio)\/dag-\d\d(?:#s\d+)?|(?:video|audio|bilder|spill|strek)\/[\w/.-]+\.(?:mp4|mp3|png|jpe?g)|ugleposten\/k\d|sledeflukt\/[\w-]+|beslutning\/[\w-]+))/g;

const lenk = (s: string) =>
  s.split(ID).map((del, i) =>
    i % 2 ? (
      <Link
        key={i}
        href={`/nissemor-guide/gjennomgang?id=${encodeURIComponent(del)}`}
        className="underline text-(--gold) break-all"
      >
        {del}
      </Link>
    ) : (
      del
    ),
  );

/** The agents' review reports (docs/gjennomganger), newest first. */
export default function Gjennomganger() {
  const [r, setR] = useState<Rapport[] | null | "feil">(null);
  useEffect(() => {
    fetch("/api/guide/gjennomganger")
      .then((x) => (x.ok ? x.json() : Promise.reject()))
      .then(setR, () => setR("feil"));
  }, []);
  return (
    <GuideSide>
      <h1 className="text-4xl font-bold text-(--gold) text-center">
        GJENNOMGANGER
      </h1>
      <p>
        Rapportene agentene har skrevet. Id-er i teksten åpner elementet i{" "}
        <Link
          href="/nissemor-guide/gjennomgang"
          className="underline text-(--gold)"
        >
          Gjennomgang
        </Link>
        .
      </p>
      {r === null ? (
        <p>Laster … (bare på hjemmenettet)</p>
      ) : r === "feil" ? (
        <p className="text-(--christmas-red)">Fikk ikke hentet rapportene.</p>
      ) : (
        r.map((x) => (
          <details
            key={x.navn}
            id={x.navn}
            className="border-2 border-(--neon-green) bg-black mb-3 scroll-mt-4"
          >
            <summary className="min-h-11 flex items-center px-3 cursor-pointer text-xl">
              {x.tekst.match(/^#\s+(.+)$/m)?.[1] ?? x.navn}
              <span className="ml-auto text-sm text-(--neon-green)/80">
                {x.navn.slice(0, 10)}
              </span>
            </summary>
            <div className="p-3 space-y-3">
              <Markdown tekst={x.tekst} inline={lenk} />
            </div>
          </details>
        ))
      )}
    </GuideSide>
  );
}
