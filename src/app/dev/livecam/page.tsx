"use client";

import { mediaUrl } from "@/lib/media";
import { Suspense, useState } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { LiveCam } from "@/components/windows/snofall-tv/LiveCam";

function LiveCamDev() {
  // Query params let a headless browser screenshot a given state.
  const params = useSearchParams();
  const [frost, setFrost] = useState(Number(params.get("frost") ?? 0));
  const [hijack, setHijack] = useState(params.get("hijack") === "1");

  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="min-h-screen bg-black text-(--neon-green) flex flex-col items-center gap-6 p-6 font-retro">
      <h1 className="text-2xl">LiveCam: effektprøve</h1>
      <div className="w-full max-w-5xl aspect-video border-4 border-(--neon-green)">
        <LiveCam
          src={params.get("src") ?? mediaUrl("video/tv/verksted-iq-inne.mp4")}
          label="K2 IQS VERKSTED"
          frost={frost}
          hijack={hijack}
          gray={params.get("gray") === "1"}
          frozen={params.get("frozen") === "1"}
          warm={params.get("warm") === "1"}
          flicker={params.get("flicker") === "1"}
          signature={params.get("signature") === "1"}
        />
      </div>
      <div className="flex flex-wrap items-center gap-8 text-lg">
        <label className="flex items-center gap-3">
          Frostnivå
          <input
            type="range"
            min={0}
            max={100}
            value={frost}
            onChange={(e) => setFrost(Number(e.target.value))}
            className="w-64 accent-(--neon-green)"
          />
          <span className="w-12 tabular-nums">{frost} %</span>
        </label>
        <label className="flex items-center gap-3 min-h-11">
          <input
            type="checkbox"
            checked={hijack}
            onChange={(e) => setHijack(e.target.checked)}
            className="w-5 h-5 accent-(--neon-green)"
          />
          Kulde-kapring
        </label>
      </div>
    </main>
  );
}

// useSearchParams needs a Suspense boundary to prerender.
export default function LiveCamDevPage() {
  return (
    <Suspense>
      <LiveCamDev />
    </Suspense>
  );
}
