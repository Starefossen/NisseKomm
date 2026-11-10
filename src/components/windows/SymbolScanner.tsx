"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { RetroWindow } from "../ui/RetroWindow";
import { Icon } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";
import { GameEngine } from "@/lib/game-engine";

interface SymbolScannerProps {
  onClose: () => void;
}

type CameraState = "starter" | "på" | "av" | "usikker" | "nektet" | "mangler";

type Result = {
  n: number;
  tone: "ny" | "info" | "feil";
  title: string;
  text: string;
  icon?: string;
  color?: string;
};

const CAMERA_TEXT: Record<CameraState, string> = {
  starter: "Starter kameraet …",
  på: "Kameraet er på. Hold kortet stille foran kameraet.",
  av: "Kameraet er av. Skriv koden under QR-koden, eller start kameraet.",
  usikker:
    "Kameraet virker bare på nissekomm.no. Skriv koden under QR-koden i stedet.",
  nektet:
    "NisseKomm fikk ikke bruke kameraet. Skriv koden under QR-koden, eller gi tillatelse i nettleseren og trykk START KAMERA.",
  mangler:
    "Fant ikke noe kamera. Skriv koden under QR-koden på kortet i stedet.",
};

// getUserMedia only exists in a secure context (https or localhost), not on http://<LAN-IP>
function cameraSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

function cameraError(error: unknown): CameraState {
  const text = `${(error as Error)?.name ?? ""} ${String(error)}`;
  if (/NotAllowed|Permission|denied/i.test(text)) return "nektet";
  return "mangler";
}

/**
 * Scans the nine symbol cards (QR) or takes the short code printed under the QR.
 * The camera lives in one effect keyed on `wantCamera`: every run gets its own
 * DOM host and stops its own reader, so strict-mode double mounts and closing
 * the window mid-start never leave the camera on.
 */
export function SymbolScanner({ onClose }: SymbolScannerProps) {
  const [supported] = useState(cameraSupported);
  const [wantCamera, setWantCamera] = useState(supported);
  const [camera, setCamera] = useState<CameraState>(
    supported ? "starter" : "usikker",
  );
  const [result, setResult] = useState<Result | null>(null);
  const [code, setCode] = useState("");
  const [count, setCount] = useState(
    () => GameEngine.getCollectedSymbols().length,
  );
  const hostRef = useRef<HTMLDivElement>(null);
  const lastScan = useRef({ text: "", at: 0 });

  const submit = (raw: string) => {
    const r = GameEngine.collectSymbolByCode(raw);
    setCount(GameEngine.getCollectedSymbols().length);
    if (r.status === "ny" && r.symbol) {
      SoundManager.playSound("success");
      setTimeout(() => SoundManager.playSound("open"), 160);
      setResult({
        n: Date.now(),
        tone: "ny",
        title: "NYTT SYMBOL!",
        text: r.symbol.description,
        icon: r.symbol.symbolIcon,
        color: r.symbol.symbolColor,
      });
    } else if (r.status === "allerede" && r.symbol) {
      SoundManager.playSound("click");
      setResult({
        n: Date.now(),
        tone: "info",
        title: "ALLEREDE SAMLET",
        text: `${r.symbol.description}: ${r.message}`,
        icon: r.symbol.symbolIcon,
        color: r.symbol.symbolColor,
      });
    } else {
      SoundManager.playSound("error");
      setResult({
        n: Date.now(),
        tone: r.status === "for-tidlig" ? "info" : "feil",
        title: r.status === "for-tidlig" ? "IKKE ENNÅ" : "FEIL KODE",
        text: r.message,
      });
    }
    return r.success;
  };

  // Latest submit for the scanner callback, which is bound once per camera start
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!wantCamera || !host) return;
    let cancelled = false;
    const el = document.createElement("div");
    el.id = `qr-${Math.random().toString(36).slice(2)}`;
    el.className = "qr-host";
    host.appendChild(el);
    const reader = new Html5Qrcode(el.id, { verbose: false });

    const started = reader
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (w, h) => {
            const side = Math.floor(Math.min(w, h) * 0.7);
            return { width: side, height: side };
          },
        },
        (text) => {
          // The same card stays in view for many frames; take it once per 3 s
          const now = Date.now();
          if (
            text === lastScan.current.text &&
            now - lastScan.current.at < 3000
          )
            return;
          lastScan.current = { text, at: now };
          submitRef.current(text);
        },
        () => {},
      )
      .then(() => !cancelled && setCamera("på"))
      .catch((error) => {
        console.warn("Kamera startet ikke:", error);
        if (!cancelled) {
          setCamera(cameraError(error));
          setWantCamera(false);
        }
      });

    return () => {
      cancelled = true;
      // Stop after start settles: stopping a pending start leaks the stream
      void started.finally(async () => {
        try {
          if (reader.isScanning) await reader.stop();
          reader.clear();
        } catch {
          // Already stopped
        }
        const stream = el.querySelector("video")?.srcObject;
        if (stream instanceof MediaStream)
          stream.getTracks().forEach((t) => t.stop());
        el.remove();
      });
    };
  }, [wantCamera]);

  const toggleCamera = () => {
    SoundManager.playSound("click");
    setCamera(wantCamera ? "av" : "starter");
    setWantCamera(!wantCamera);
  };

  const resultStyle =
    result?.tone === "ny"
      ? "border-(--gold) bg-(--gold)/20 text-(--gold) animate-[gold-flash_1s_ease-in-out]"
      : result?.tone === "info"
        ? "border-(--cold-blue) bg-(--cold-blue)/10 text-(--cold-blue)"
        : "border-(--christmas-red) bg-(--christmas-red)/20 text-(--christmas-red) animate-[red-shake_0.5s_ease-in-out]";

  return (
    <RetroWindow title="SYMBOLSKANNER" onClose={onClose}>
      <style jsx global>{`
        .qr-host,
        .qr-host > div {
          width: 100% !important;
          height: 100% !important;
          position: relative !important;
        }
        .qr-host video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          position: absolute !important;
          inset: 0 !important;
        }
      `}</style>
      <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
        <div className="flex items-center justify-between gap-4">
          <p
            role="status"
            aria-live="polite"
            data-kamera={camera}
            className={`text-lg ${camera === "nektet" || camera === "mangler" || camera === "usikker" ? "text-(--cold-blue)" : "text-(--neon-green)"}`}
          >
            {CAMERA_TEXT[camera]}
          </p>
          <span className="shrink-0 text-xl text-(--gold)">{count} av 9</span>
        </div>

        {wantCamera && (
          <div
            ref={hostRef}
            className="relative flex-1 min-h-64 border-4 border-(--brass) overflow-hidden bg-black"
          />
        )}

        {result && (
          <div
            key={result.n}
            role="alert"
            className={`border-4 p-4 flex items-center gap-4 ${resultStyle}`}
          >
            {result.icon && (
              <Icon
                name={result.icon}
                size={56}
                color={result.color as "green" | "red" | "blue"}
              />
            )}
            <div>
              <div className="text-2xl font-bold">{result.title}</div>
              <div className="text-lg">{result.text}</div>
            </div>
          </div>
        )}

        <form
          className="flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!code.trim()) return;
            if (submit(code)) setCode("");
          }}
        >
          <label className="sr-only" htmlFor="symbolkode">
            Kode fra symbolkortet
          </label>
          <input
            id="symbolkode"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="KODE FRA KORTET"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={16}
            className="flex-1 min-w-0 min-h-14 px-4 text-2xl tracking-widest font-retro bg-black border-4 border-(--brass) text-(--neon-green) placeholder:text-(--neon-green)/40"
          />
          <button
            type="submit"
            className="min-h-14 min-w-24 px-6 text-2xl font-bold bg-(--neon-green) text-black border-4 border-black"
          >
            SEND
          </button>
        </form>

        {supported && (
          <button
            type="button"
            onClick={toggleCamera}
            className="min-h-14 w-full px-6 text-xl font-bold border-4 border-black text-black bg-(--cold-blue)"
          >
            {wantCamera ? "SLÅ AV KAMERA" : "START KAMERA"}
          </button>
        )}
      </div>
    </RetroWindow>
  );
}
