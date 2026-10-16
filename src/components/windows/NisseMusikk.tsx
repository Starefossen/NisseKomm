"use client";

import { useState, useEffect, useRef } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";

interface Track {
  id: number;
  title: string;
  subtitle: string;
  src: string;
  defaultDuration: string;
}

const PLAYLIST: Track[] = [
  {
    id: 1,
    title: "Bjelleklang (8-Bit Chiptune)",
    subtitle: "Jingle Bells — Snøfall Radio 90.0 MHz",
    src: "/music/Jingle Bells (8-Bit Version).mp3",
    defaultDuration: "1:57",
  },
  {
    id: 2,
    title: "Rudolf er Rød på Nesen (8-Bit)",
    subtitle: "Rudolph the Red-Nosed Reindeer",
    src: "/music/Rudolph the Red Nosed Reindeer (8-Bit Version).mp3",
    defaultDuration: "1:57",
  },
  {
    id: 3,
    title: "Kranser og Kristtorn (8-Bit)",
    subtitle: "Deck the Halls — Verksted-Mix",
    src: "/music/Deck the Halls (8-Bit Version).mp3",
    defaultDuration: "1:08",
  },
  {
    id: 4,
    title: "Vinter-Eventyrland (8-Bit)",
    subtitle: "Winter Wonderland — Krystallhagen",
    src: "/music/Winter Wonderland (8-Bit Version).mp3",
    defaultDuration: "1:43",
  },
  {
    id: 5,
    title: "La Det Snø, La Det Snø (8-Bit)",
    subtitle: "Let It Snow! — Brevfugl-Tårnet",
    src: "/music/Let It Snow, Let It Snow, Let It Snow (8-Bit Version).mp3",
    defaultDuration: "2:03",
  },
  {
    id: 6,
    title: "Kanefart gjennom Snøfall (8-Bit)",
    subtitle: "Sleigh Ride — Slede-Ekspert",
    src: "/music/Sleigh Ride (8-Bit Version).mp3",
    defaultDuration: "2:04",
  },
  {
    id: 7,
    title: "Dans rundt Juletreet (8-Bit)",
    subtitle: "Rockin' Around the Christmas Tree",
    src: "/music/Rockin' Around the Christmas Tree (8-Bit Version).mp3",
    defaultDuration: "1:58",
  },
  {
    id: 8,
    title: "Feliz Navidad (8-Bit)",
    subtitle: "Globale Nisse-Frekvenser",
    src: "/music/Feliz Navidad (8-Bit Version).mp3",
    defaultDuration: "2:08",
  },
  {
    id: 9,
    title: "Jeg Så Mamma Kysse Nissen (8-Bit)",
    subtitle: "I Saw Mommy Kissing Santa Claus",
    src: "/music/I Saw Mommy Kissing Santa Claus (8-Bit Version).mp3",
    defaultDuration: "2:24",
  },
  {
    id: 10,
    title: "Alt Jeg Ønsker til Jul (8-Bit)",
    subtitle: "All I Want for Christmas Is You",
    src: "/music/All I Want for Christmas Is You (8-Bit Version).mp3",
    defaultDuration: "4:14",
  },
  {
    id: 11,
    title: "Siste Jul (8-Bit Synth)",
    subtitle: "Last Christmas — Nordlys-Utgave",
    src: "/music/Last Christmas (8-Bit Version).mp3",
    defaultDuration: "3:46",
  },
  {
    id: 12,
    title: "Ha en Riktig God og Glitrende Jul (8-Bit)",
    subtitle: "Have Yourself a Merry Little Christmas",
    src: "/music/Have Yourself a Merry Little Christmas (8-Bit Version).mp3",
    defaultDuration: "3:50",
  },
];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

interface NisseMusikkProps {
  onClose: () => void;
}

export function NisseMusikk({ onClose }: NisseMusikkProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const track = PLAYLIST[currentTrack];

  useEffect(() => {
    const audio = new Audio(encodeURI(PLAYLIST[0].src));
    audio.volume = 0.5;
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setCurrentTrack((prev) => (prev + 1) % PLAYLIST.length);
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

    const targetSrc = encodeURI(track.src);
    if (!audio.src.endsWith(targetSrc)) {
      audio.src = targetSrc;
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
    setCurrentTrack((prev) => (prev + 1) % PLAYLIST.length);
  };

  const handlePrevious = () => {
    SoundManager.playSound("click");
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    setCurrentTime(0);
    setCurrentTrack((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
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

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    const nextTime = ratio * duration;
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

  const progressPercent =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <RetroWindow title="NISSEMUSIKK - 8-BIT JUKEBOX" onClose={onClose}>
      <div className="p-6 h-full overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b-4 border-(--neon-green)/30">
          <Icons.Music size={32} color="blue" />
          <div className="flex-1">
            <div className="text-2xl font-bold tracking-wider">
              SNØFALL RADIO // 8-BIT ARKIV
            </div>
            <div className="text-sm opacity-70">
              12 EKTE CHIPTUNE-JULESANGER • LYDBØLGE-GENERATOR MOT KULDE
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
            <span className="text-(--gold) text-xs tracking-wider">
              {isPlaying ? "SENDER LYDBØLGER" : "KLAR"}
            </span>
          </div>
        </div>

        {/* Now Playing Display */}
        <div className="border-4 border-(--neon-green) bg-black p-6 space-y-4">
          <div className="text-center space-y-1">
            <div className="text-xs text-(--cold-blue) tracking-wider">
              {isPlaying ? "NÅ SPILLER PÅ 90.0 MHz" : "VALGT SPOR"}
            </div>
            <div className="text-2xl text-(--neon-green) font-bold tracking-wider">
              {track.title}
            </div>
            <div className="text-xs text-(--cold-blue)/80">
              {track.subtitle}
            </div>
            <div className="text-xs text-(--neon-green)/60 pt-1">
              Spor {currentTrack + 1} av {PLAYLIST.length}
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
            <div
              onClick={handleSeek}
              title="Klikk for å spole"
              className="h-3 bg-(--neon-green)/20 border border-(--neon-green) cursor-pointer relative"
            >
              <div
                className="h-full bg-(--neon-green) transition-all duration-150"
                style={{
                  width: `${progressPercent}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-(--neon-green)/70 font-mono">
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
              className="p-3 border-2 border-(--cold-blue) hover:bg-(--cold-blue)/20 transition-all cursor-pointer"
            >
              <Icons.SkipBack size={22} color="blue" />
            </button>

            <button
              onClick={handlePlayPause}
              title={isPlaying ? "Pause" : "Spill av"}
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
            <span className="text-xs font-mono text-(--neon-green) w-10 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        {/* Playlist */}
        <div className="border-2 border-(--neon-green)/30 space-y-0">
          <div className="p-2 bg-(--neon-green)/10 border-b-2 border-(--neon-green)/30 flex justify-between items-center">
            <div className="text-sm tracking-wider text-(--neon-green) font-bold">
              SPILLELISTE ({PLAYLIST.length} SPOR)
            </div>
            <div className="text-xs text-(--cold-blue)">8-BIT AUDIO ENGINE</div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {PLAYLIST.map((t, index) => (
              <button
                key={t.id}
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
                  <span className="text-xs opacity-70 w-6 font-mono">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="text-sm tracking-wider font-bold">
                      {t.title}
                    </div>
                    <div className="text-xs opacity-60">{t.subtitle}</div>
                  </div>
                  {index === currentTrack && isPlaying && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-(--neon-green) text-black font-bold">
                      SPILLER
                    </span>
                  )}
                </div>
                <span className="text-xs opacity-70 font-mono">
                  {t.defaultDuration}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Acoustic Shield Telemetry (Day 12 Clue Integration) */}
        <div className="p-4 border-2 border-(--cold-blue)/40 bg-(--cold-blue)/5 text-(--cold-blue) text-xs space-y-1">
          <div className="font-bold flex items-center justify-between">
            <span>🔊 IQs LYDBØLGE-SKJOLD // AKUSTISK TELEMETRI</span>
            <span className="text-(--gold) font-mono">DEL 2: O - D - I</span>
          </div>
          <div className="opacity-80">
            Chiptune-frekvensene rister løs krystall-isen fra Kulde! Kombiner
            første del fra kjøkkenet med{" "}
            <span className="text-(--gold) font-bold">O - D - I</span> fra
            musikk-arkivet for å kalibrere lydbølge-skjoldet (Dag 12).
          </div>
        </div>
      </div>
    </RetroWindow>
  );
}
