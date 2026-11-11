/**
 * Small pixel plate of Snøfall over the chapter list: one mark per chapter at
 * its first scene, grey with a padlock and «ÅPNER DAG N» until the chapter's
 * day (GTA-style, no navigation). The drawn plate below is the fallback; the
 * generated one is medier.json «spill-piksel/kart».
 */
import { useState } from "react";
import { Icon } from "@/lib/icons";
import { mediaUrl } from "@/lib/media";
import type { EventyrSave } from "@/lib/storage";
import { KAPITLER, erLaastOpp } from "./kapitler";

// Percent of the plate, matching the prompt's layout: pond left, square
// centre, Julius' house right, gate at the bottom.
const STED: Record<number, [number, number]> = {
  1: [50, 56],
  2: [13, 44],
  3: [78, 32],
  4: [52, 82],
};

export function Kartplate({
  dag,
  save,
}: {
  dag: number;
  save: EventyrSave | null;
}) {
  const [bildeFeil, setBildeFeil] = useState(false);
  return (
    <div
      data-testid="kartplate"
      className="relative aspect-16/7 border-2 border-(--brass) overflow-hidden bg-[#0b1733]"
    >
      <svg
        aria-hidden
        viewBox="0 0 160 70"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        className="absolute inset-0 w-full h-full"
      >
        <rect width="160" height="70" fill="#0b1733" />
        <rect y="8" width="160" height="5" fill="#1d5c4a" opacity="0.6" />
        <rect y="11" width="160" height="2" fill="#4fb08a" opacity="0.5" />
        <path
          d="M0 30 20 18 36 28 52 14 70 26 92 12 112 24 130 10 160 26V70H0Z"
          fill="#23386b"
        />
        <path d="M44 20 52 14 60 20Z M122 16 130 10 138 16Z" fill="#e8f1fb" />
        <rect y="30" width="160" height="40" fill="#dbe8f4" />
        <rect y="30" width="160" height="2" fill="#f6fbff" />
        <rect x="8" y="40" width="30" height="14" fill="#6fa9d6" />
        <rect x="10" y="42" width="26" height="10" fill="#8ec2e8" />
        <rect x="23" y="26" width="2" height="16" fill="#8a7a5a" />
        <rect x="19" y="26" width="10" height="2" fill="#8a7a5a" />
        <rect x="30" y="38" width="4" height="2" fill="#f0c04a" />
        <rect x="62" y="46" width="36" height="12" fill="#c9d6e2" />
        <rect x="58" y="34" width="10" height="12" fill="#8c3b2e" />
        <rect x="60" y="30" width="6" height="4" fill="#3c2a1e" />
        <rect x="70" y="36" width="8" height="10" fill="#6b4a2f" />
        <rect x="80" y="24" width="6" height="22" fill="#9a8a6a" />
        <rect x="81" y="27" width="4" height="4" fill="#f0c04a" />
        <rect x="90" y="36" width="10" height="10" fill="#8c3b2e" />
        <rect x="104" y="34" width="10" height="10" fill="#3f6b4a" />
        <rect x="124" y="30" width="18" height="12" fill="#5a3a2a" />
        <rect x="122" y="26" width="22" height="4" fill="#3c2a1e" />
        <rect x="127" y="34" width="3" height="3" fill="#f0c04a" />
        <rect x="135" y="34" width="3" height="3" fill="#f0c04a" />
        <rect x="146" y="38" width="14" height="14" fill="#2a3d6a" />
        <rect x="150" y="44" width="6" height="8" fill="#0b1733" />
        <rect
          x="150"
          y="40"
          width="6"
          height="4"
          fill="#7fc8e8"
          opacity="0.7"
        />
        <rect y="62" width="160" height="4" fill="#9aa3ad" />
        <rect x="80" y="56" width="10" height="10" fill="#6b4a2f" />
        <rect x="83" y="59" width="4" height="7" fill="#0b1733" />
        <rect x="56" y="64" width="4" height="4" fill="#f0c04a" />
        <rect x="62" y="64" width="4" height="4" fill="#f0c04a" />
      </svg>
      {!bildeFeil && (
        // eslint-disable-next-line @next/next/no-img-element -- media dir, not optimised
        <img
          src={mediaUrl("spill/piksel/kart.png")}
          alt=""
          onError={() => setBildeFeil(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ imageRendering: "pixelated" }}
        />
      )}
      {KAPITLER.map((k) => {
        const laast = !erLaastOpp(k, dag);
        const ferdig = save?.flags.includes(k.slutt);
        const [x, y] = STED[k.n];
        const navn = k.scener.find((s) => s.id === k.start)?.navn ?? k.tittel;
        return (
          <div
            key={k.n}
            className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center leading-none ${laast ? "text-gray-400" : "text-(--gold)"}`}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {laast ? (
              <Icon name="lock" size={20} color="gray" />
            ) : (
              <span
                className={`block w-3 h-3 border-2 border-black ${ferdig ? "bg-(--gold)" : "bg-(--neon-green)"}`}
              />
            )}
            <span className="mt-0.5 px-1 bg-black/70 text-sm md:text-base whitespace-nowrap">
              {navn}
            </span>
            {laast && (
              <span className="px-1 bg-black/70 text-xs md:text-sm whitespace-nowrap">
                ÅPNER DAG {k.dag}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
