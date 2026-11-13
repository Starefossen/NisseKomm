"use client";

import { useEffect, useState } from "react";
import { mediaUrl } from "@/lib/media";
import { versionRank, versjonsnavn } from "@/lib/media-status";
import { useVurderinger } from "../vurdering";
import { LysbordBilde } from "../lysbord";

/**
 * New beside old for an image with earlier versions: the newest (-vN, else the
 * plain one) against the next. V flips to one image at a time and switches
 * between them; a click opens the lightbox, where V swaps at the same zoom.
 */
export function BildeVersjoner({
  filer,
  vurderId,
}: {
  filer: string[];
  vurderId?: string;
}) {
  const sortert = [...filer].sort((a, b) => versionRank(b) - versionRank(a));
  const ny = sortert[0];
  const [gammel, setGammel] = useState(sortert[1]);
  const [vis, setVis] = useState<"side" | "ny" | "gammel">("side");
  const alle = useVurderinger();

  useEffect(() => {
    const ned = (ev: KeyboardEvent) => {
      const mal = ev.target as HTMLElement;
      if (
        ev.metaKey ||
        ev.ctrlKey ||
        ev.altKey ||
        ev.key.toLowerCase() !== "v" ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(mal.tagName)
      )
        return;
      ev.preventDefault();
      setVis((v) => (v === "gammel" ? "ny" : "gammel"));
    };
    window.addEventListener("keydown", ned);
    return () => window.removeEventListener("keydown", ned);
  }, []);

  const bilde = (p: string, rolle: string) => {
    const v = alle?.[p];
    return (
      <figure key={p} className="min-w-0 flex-1" data-testid={`bilde-${rolle}`}>
        <figcaption className="text-(--gold)">
          {rolle === "ny" ? "Ny" : "Gammel"}: {versjonsnavn(p)}
          <span className="block text-sm break-all">{p}</span>
        </figcaption>
        <LysbordBilde
          src={mediaUrl(p)}
          alt={p}
          gruppe="versjoner"
          gammel={mediaUrl(p === ny ? gammel : ny)}
          // Only the newest is the element's current version: G on an old one would judge the wrong file.
          vurderId={p === ny ? vurderId : undefined}
          gammelVersjon={p !== ny}
          className="w-full border border-(--neon-green)/40"
        />
        {rolle === "gammel" && (v?.vurdering || v?.notat) && (
          <p className="text-sm" data-testid="gammel-vurdering">
            Vurdert: {v.vurdering ?? "–"}
            {v.notat && ` – «${v.notat}»`}
          </p>
        )}
      </figure>
    );
  };

  return (
    <div className="my-2" data-testid="bildeversjoner" data-vis={vis}>
      <div className="flex flex-wrap items-center gap-2 mb-2 text-base">
        <label className="flex items-center gap-2 min-h-11">
          Sammenlign med
          <select
            value={gammel}
            onChange={(e) => setGammel(e.target.value)}
            className="min-h-11 bg-black border-2 border-(--neon-green) px-2"
          >
            {sortert.slice(1).map((p) => (
              <option key={p} value={p}>
                {versjonsnavn(p)}
              </option>
            ))}
          </select>
        </label>
        {vis !== "side" && (
          <button
            type="button"
            onClick={() => setVis("side")}
            className="min-h-11 px-3 border-2 border-(--neon-green)"
          >
            Side ved side
          </button>
        )}
        <span className="text-(--neon-green)/80">
          V bytt gammel/ny · klikk/F = lysbord
        </span>
      </div>
      <div className="flex gap-2">
        {vis !== "gammel" && bilde(ny, "ny")}
        {vis !== "ny" && bilde(gammel, "gammel")}
      </div>
    </div>
  );
}
