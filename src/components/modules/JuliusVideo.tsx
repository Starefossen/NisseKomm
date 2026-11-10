"use client";

import { mediaUrl } from "@/lib/media";
import { useRef, useState } from "react";
import { GameEngine } from "@/lib/game-engine";
import { getCurrentDay } from "@/lib/date-utils";
import transcripts from "@/data/julius_videoer.json";

interface JuliusVideoProps {
  day: number;
  /** Called once the video has been played to the end */
  onWatched?: () => void;
  /** Past days in Dagbok pass "none" so a long list doesn't fetch every file */
  preload?: "none" | "metadata";
}

export function JuliusVideo({
  day,
  onWatched,
  preload = "metadata",
}: JuliusVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [watched, setWatched] = useState(() =>
    GameEngine.isJuliusVideoWatched(day),
  );
  const [missing, setMissing] = useState(false);

  if (day > getCurrentDay()) {
    return (
      <div className="p-4 border-2 border-(--gray) text-(--gray) text-center">
        Ikke sendt ennå.
      </div>
    );
  }

  const isToday = day === getCurrentDay();
  const transcript = transcripts.find((t) => t.dag === day)?.transkripsjon;
  const ps = GameEngine.isQuestCompleted(day)
    ? GameEngine.getJuliusPs(day)
    : undefined;
  const src = mediaUrl(`video/julius/dag-${String(day).padStart(2, "0")}.mp4`);

  const markWatched = () => {
    if (!watched) {
      GameEngine.markJuliusVideoWatched(day);
      setWatched(true);
      onWatched?.();
    }
  };

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play();
  };

  return (
    <div className="space-y-3">
      {isToday && !watched && (
        <div className="flex items-center gap-2 text-(--christmas-red) font-bold text-lg">
          <span
            className="w-3 h-3 rounded-full bg-(--christmas-red) animate-pulse"
            aria-hidden
          />
          NY MELDING FRA JULIUS
        </div>
      )}

      {missing ? (
        <div className="aspect-video w-full border-4 border-(--gold)/60 bg-black flex items-center justify-center text-(--gold) text-xl animate-pulse">
          SIGNALET ER SVAKT …
        </div>
      ) : (
        <video
          ref={videoRef}
          key={src}
          src={src}
          controls
          playsInline
          preload={preload}
          className="aspect-video w-full border-4 border-(--gold)/60 bg-black"
          onEnded={markWatched}
          onError={() => {
            // A failed load is not a viewing: the transcript stands in, the red dot stays
            setMissing(true);
          }}
        />
      )}

      {watched && !missing && (
        <button
          onClick={replay}
          className="min-h-11 px-4 border-2 border-(--neon-green) text-(--neon-green) hover:bg-(--neon-green)/20"
        >
          SE IGJEN
        </button>
      )}

      {(watched || missing) && transcript && (
        <p className="text-(--neon-green)/90 leading-relaxed">«{transcript}»</p>
      )}

      {ps && (
        <div className="border-2 border-(--gold)/60 p-3">
          <div className="text-(--gold) font-bold">PS fra Julius</div>
          <p className="text-(--gold)/90">{ps}</p>
        </div>
      )}
    </div>
  );
}
