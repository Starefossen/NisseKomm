"use client";

import { MEDIA_MANIFEST, mediaUrl, type MediaManifestEntry } from "@/lib/media";
import { useState, useEffect, useRef } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";
import { GameEngine } from "@/lib/game-engine";
import { getAdventDay, getCurrentDay, getCurrentMonth } from "@/lib/date-utils";
import { TIDBITS, visible } from "@/lib/tidbits";

export interface Track {
  id: number;
  title: string;
  subtitle: string;
  src: string;
  defaultDuration: string;
}

export const PLAYLIST: Track[] = MEDIA_MANIFEST.filter(
  (entry): entry is MediaManifestEntry & { title: string } =>
    typeof entry !== "string" &&
    entry.path.startsWith("music/") &&
    Boolean(entry.title),
).map((entry, index) => ({
  id: index + 1,
  title: entry.title,
  subtitle: entry.subtitle ?? "",
  src: mediaUrl(entry.path),
  defaultDuration: entry.defaultDuration ?? "0:00",
}));

/** A track uploaded via the guide's media page: title from the file name. */
export const uploadedTrack = (path: string, id: number): Track => ({
  id,
  title: path.replace(/^music\//, "").replace(/\.mp3$/i, ""),
  subtitle: "Opplastet spor",
  src: mediaUrl(path),
  defaultDuration: "–:––",
});

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

interface NisseMusikkProps {
  onClose: () => void;
  /** Start playing at once: the day 12 thaw (storyboard «Intensitetskurven»). */
  autoPlay?: boolean;
}

export function NisseMusikk({ onClose, autoPlay = false }: NisseMusikkProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playlist, setPlaylist] = useState(PLAYLIST);
  const lengthRef = useRef(PLAYLIST.length);

  useEffect(() => {
    const skjult = TIDBITS.musikk.skjultSpor;
    const hidden =
      visible([skjult], getAdventDay()).length > 0 &&
      GameEngine.isQuestCompleted(skjult.etterLøstDag)
        ? fetch(mediaUrl(skjult.path), { method: "HEAD" })
            .then((r) => r.ok)
            .catch(() => false)
        : Promise.resolve(false);
    Promise.all([
      fetch("/api/musikk").then((r) => (r.ok ? r.json() : [])),
      hidden,
    ])
      .then(([paths, found]: [string[], boolean]) => {
        const list = [
          ...PLAYLIST,
          ...paths.map((p, i) => uploadedTrack(p, PLAYLIST.length + i + 1)),
        ];
        if (found)
          list.push({
            ...uploadedTrack(skjult.path, list.length + 1),
            title: skjult.tittel,
            subtitle: skjult.tekst,
          });
        lengthRef.current = list.length;
        setPlaylist(list);
      })
      .catch(() => {});
  }, []);

  const track = playlist[currentTrack];
  // Day 12: Kulde has frozen the jukebox until the day's code is in.
  const frozen =
    getCurrentMonth() === 12 &&
    getCurrentDay() === 12 &&
    !GameEngine.isQuestCompleted(12);

  useEffect(() => {
    const audio = new Audio(PLAYLIST[0].src);
    audio.volume = 0.5;
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setCurrentTrack((prev) => (prev + 1) % lengthRef.current);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // mediaUrl already encodes; encoding again turns %20 into %2520 and 404s.
    if (!audio.src.endsWith(track.src)) {
      audio.src = track.src;
      audio.load();
    }

    if (isPlaying) {
      SoundManager.stopJingle();
      audio.play().catch((err) => {
        console.warn("NisseMusikk playback blocked:", err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying, track.src]);

  const handlePlayPause = () => {
    SoundManager.playSound("click");
    setIsPlaying((prev) => !prev);
  };

  const handleNext = () => {
    SoundManager.playSound("click");
    setCurrentTime(0);
    setCurrentTrack((prev) => (prev + 1) % playlist.length);
  };

  const handlePrevious = () => {
    SoundManager.playSound("click");
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    setCurrentTime(0);
    setCurrentTrack((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  const handleTrackSelect = (index: number) => {
    SoundManager.playSound("click");
    if (index === currentTrack) {
      setIsPlaying((prev) => !prev);
    } else {
      setCurrentTime(0);
      setCurrentTrack(index);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const nextTime = parseFloat(e.target.value);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVolume = parseFloat(e.target.value);
    setVolume(nextVolume);
    if (audioRef.current) {
      audioRef.current.volume = nextVolume;
    }
  };

  return (
    <RetroWindow title="NISSEMUSIKK - 8-BIT JUKEBOX" onClose={onClose}>
      <div
        className={`relative h-full ${frozen ? "overflow-hidden" : "overflow-y-auto"}`}
      >
        {frozen && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-(--cold-blue)/30 backdrop-blur-sm border-4 border-(--cold-blue) text-(--cold-blue)">
            <div className="text-5xl font-bold tracking-widest">FROSSET</div>
            <div className="text-base opacity-80">
              Rim over spilleren. Ingen lyd før dagens kode er inne.
            </div>
          </div>
        )}
        {/* inert: the overlay hides the controls, keyboard must not reach them either */}
        <div className="p-4 space-y-4" inert={frozen}>
          {/* Header */}
          <div className="flex items-center gap-4 pb-4 border-b-4 border-(--neon-green)/30">
            <Icons.Music size={32} color="blue" />
            <div className="flex-1">
              <div className="text-2xl font-bold tracking-wider">
                SNØFALL RADIO // 8-BIT ARKIV
              </div>
              <div className="text-base opacity-70">
                VARMEKILDEN • Musikk holder linjen varm når det er kaldt
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 border-2 border-(--gold) bg-(--gold)/20">
              <div
                className={`w-2 h-2 rounded-full ${
                  isPlaying
                    ? "bg-(--neon-green) animate-ping"
                    : "bg-(--gold) animate-pulse-led"
                }`}
              ></div>
              <span className="text-(--gold) text-base tracking-wider">
                {isPlaying ? "SENDER LYDBØLGER" : "KLAR"}
              </span>
            </div>
          </div>

          {/* Now Playing Display */}
          <div className="border-4 border-(--neon-green) bg-black p-4 space-y-3">
            <div className="text-center space-y-1">
              <div className="text-base text-(--cold-blue) tracking-wider">
                {isPlaying ? "NÅ SPILLER PÅ 90,0 MHz" : "VALGT SPOR"}
              </div>
              <div className="text-2xl text-(--neon-green) font-bold tracking-wider">
                {track.title}
              </div>
              <div className="text-base text-(--cold-blue)/80">
                {track.subtitle}
              </div>
              <div className="text-base text-(--neon-green)/60 pt-1">
                Spor {currentTrack + 1} av {playlist.length}
              </div>
            </div>

            {/* Visualizer (animated bars) */}
            <div className="flex items-end justify-center gap-1.5 h-16 px-4">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2.5 bg-(--neon-green) transition-all duration-150"
                  style={{
                    height: isPlaying
                      ? `${22 + ((i * 19 + Math.floor(currentTime * 4)) % 5) * 18}%`
                      : "12%",
                    opacity: isPlaying ? 0.9 : 0.35,
                  }}
                ></div>
              ))}
            </div>

            {/* Seekable Progress Bar */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="1"
                value={Math.min(currentTime, duration || 0)}
                onChange={handleSeek}
                disabled={!duration}
                aria-label="Spol i sporet"
                aria-valuetext={formatTime(currentTime)}
                className="w-full min-h-11 accent-(--neon-green) cursor-pointer"
              />
              <div className="flex justify-between text-base text-(--neon-green)/70 font-retro">
                <span>{formatTime(currentTime)}</span>
                <span>
                  {duration > 0 ? formatTime(duration) : track.defaultDuration}
                </span>
              </div>
            </div>
          </div>

          {/* Player Controls & Volume */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-2 border-(--neon-green)/30 bg-black/50 p-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevious}
                title="Forrige spor"
                aria-label="Forrige spor"
                className="p-3 border-2 border-(--cold-blue) hover:bg-(--cold-blue)/20 transition-all cursor-pointer"
              >
                <Icons.SkipBack size={22} color="blue" />
              </button>

              <button
                onClick={handlePlayPause}
                title={isPlaying ? "Pause" : "Spill av"}
                aria-label={isPlaying ? "Pause" : "Spill av"}
                className="p-3.5 border-4 border-(--neon-green) hover:bg-(--neon-green)/20 transition-all cursor-pointer"
              >
                {isPlaying ? (
                  <Icons.Pause size={28} color="green" />
                ) : (
                  <Icons.Play size={28} color="green" />
                )}
              </button>

              <button
                onClick={handleNext}
                title="Neste spor"
                aria-label="Neste spor"
                className="p-3 border-2 border-(--cold-blue) hover:bg-(--cold-blue)/20 transition-all cursor-pointer"
              >
                <Icons.SkipForward size={22} color="blue" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3">
              <Icons.Volume size={20} color="green" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                aria-label="Volum"
                className="w-28 accent-(--neon-green) cursor-pointer"
              />
              <span className="text-base font-retro text-(--neon-green) w-10 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          {/* Playlist */}
          <div className="border-2 border-(--neon-green)/30 space-y-0">
            <div className="p-2 bg-(--neon-green)/10 border-b-2 border-(--neon-green)/30 flex justify-between items-center">
              <div className="text-base tracking-wider text-(--neon-green) font-bold">
                SPILLELISTE ({playlist.length} SPOR)
              </div>
              <div className="text-base text-(--cold-blue)">
                8-BIT AUDIO ENGINE
              </div>
            </div>
            <div>
              {playlist.map((t, index) => (
                <button
                  key={t.id}
                  aria-current={index === currentTrack ? "true" : undefined}
                  onClick={() => handleTrackSelect(index)}
                  className={`
                  w-full p-3 text-left flex items-center justify-between cursor-pointer
                  border-b border-(--neon-green)/10 transition-all
                  ${
                    index === currentTrack
                      ? "bg-(--neon-green)/20 text-(--neon-green)"
                      : "hover:bg-(--neon-green)/10 text-(--neon-green)/70 hover:text-(--neon-green)"
                  }
                `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base opacity-70 w-6 font-retro">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="text-base tracking-wider font-bold">
                        {t.title}
                      </div>
                      <div className="text-base opacity-60">{t.subtitle}</div>
                    </div>
                    {index === currentTrack && isPlaying && (
                      <span className="px-1.5 py-0.5 text-base bg-(--neon-green) text-black font-bold">
                        SPILLER
                      </span>
                    )}
                  </div>
                  <span className="text-base opacity-70 font-retro">
                    {t.defaultDuration}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </RetroWindow>
  );
}
