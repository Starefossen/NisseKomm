"use client";

import { useCallback, useEffect, useState } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { mediaUrl, type MediaStatus } from "@/lib/media";

const TYPES: Record<string, string> = {
  mp4: "video/mp4",
  mp3: "audio/mpeg",
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

const formatSize = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;

function MediaContent() {
  const [files, setFiles] = useState<MediaStatus[] | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/media");
    if (!res.ok) return setUnavailable(true);
    setFiles(await res.json());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    load();
  }, [load]);

  const upload = async (path: string, file: File) => {
    setMessage(`Laster opp ${path} ...`);
    const res = await fetch(
      "/api/media/" + path.split("/").map(encodeURIComponent).join("/"),
      {
        method: "PUT",
        headers: { "Content-Type": TYPES[path.split(".").pop() ?? ""] },
        body: file,
      },
    );
    setMessage(res.ok ? `Lastet opp ${path}` : `Feil: ${await res.text()}`);
    load();
  };

  const missing = files?.filter((f) => f.size === null).length ?? 0;

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-4 md:p-8">
      <GuideNavigation currentPage="media" />
      <div className="max-w-4xl mx-auto">
        <div className="border-8 border-(--neon-green) bg-black p-6 mb-6 text-center">
          <h1 className="text-4xl font-bold tracking-wider">MEDIA</h1>
          {files && (
            <p className="text-xl mt-2">
              {files.length - missing} av {files.length} filer på plass
            </p>
          )}
        </div>

        {unavailable && (
          <p className="text-xl text-(--christmas-red)">
            Opplasting er bare tilgjengelig på hjemmenettet (LAN-modus).
          </p>
        )}
        {message && <p className="text-xl text-(--gold) mb-4">{message}</p>}

        <ul className="space-y-2">
          {files?.map((f) => (
            <li
              key={f.path}
              className="flex flex-wrap items-center gap-4 border-2 border-(--neon-green) p-2"
            >
              <span
                className={
                  f.size === null ? "text-(--christmas-red)" : "text-(--gold)"
                }
              >
                {f.size === null ? "MANGLER" : formatSize(f.size)}
              </span>
              {f.size === null ? (
                <span className="flex-1 break-all">{f.path}</span>
              ) : (
                <a
                  href={mediaUrl(f.path)}
                  target="_blank"
                  className="flex-1 break-all underline"
                >
                  {f.path}
                </a>
              )}
              <input
                type="file"
                accept={TYPES[f.path.split(".").pop() ?? ""]}
                className="min-h-11"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) upload(f.path, file);
                  e.target.value = "";
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function MediaPage() {
  return (
    <GuideAuth>
      <MediaContent />
    </GuideAuth>
  );
}
