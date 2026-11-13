"use client";

import { useEffect, useState } from "react";
import { mediaUrl } from "@/lib/media";
import { versionRank, versjonsnavn } from "@/lib/media-status";
import { useVurderinger } from "../vurdering";

/**
 * New beside old for an image with earlier versions: the newest (-vN, else the
 * plain one) against the next. V flips to one image at a time and switches
 * between them; a click zooms to 1:1, nearest-neighbour for pixel art.
 */
export function BildeVersjoner({ filer }: { filer: string[] }) {
  const sortert = [...filer].sort((a, b) => versionRank(b) - versionRank(a));
  const ny = sortert[0];
  const [gammel, setGammel] = useState(sortert[1]);
  const [vis, setVis] = useState<"side" | "ny" | "gammel">("side");
  const [zoom, setZoom] = useState(false);
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
        <div className={zoom ? "overflow-auto max-h-[80vh]" : ""}>
          {/* eslint-disable-next-line @next/next/no-img-element -- MEDIA_DIR */}
          <img
            src={mediaUrl(p)}
            alt={p}
            onClick={() => setZoom((z) => !z)}
            className={`border border-(--neon-green)/40 [image-rendering:pixelated] ${zoom ? "max-w-none cursor-zoom-out" : "w-full cursor-zoom-in"}`}
          />
        </div>
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
          V bytt gammel/ny · klikk = 1:1
        </span>
      </div>
      <div className="flex gap-2">
        {vis !== "gammel" && bilde(ny, "ny")}
        {vis !== "ny" && bilde(gammel, "gammel")}
      </div>
    </div>
  );
}
