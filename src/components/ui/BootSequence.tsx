"use client";

import { useEffect, useRef, useState } from "react";

interface BootSequenceProps {
  onComplete: () => void;
  duration?: number; // Duration in seconds
}

export function BootSequence({ onComplete, duration = 2 }: BootSequenceProps) {
  const [progress, setProgress] = useState(0);
  const done = useRef(onComplete);
  useEffect(() => {
    done.current = onComplete;
  });

  useEffect(() => {
    if (duration === 0) {
      onComplete();
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => Math.min(100, prev + 100 / (duration * 10)));
    }, 100);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  // Not inside the updater: React may run updaters twice (StrictMode).
  useEffect(() => {
    if (progress < 100) return;
    const t = setTimeout(() => done.current(), 300);
    return () => clearTimeout(t);
  }, [progress]);

  if (duration === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-(--crt-bg) flex items-center justify-center z-50"
      style={{ animation: "flicker-in 1s ease-out" }}
    >
      <div className="w-[600px] max-w-[90%] space-y-6">
        {/* Boot message */}
        <div className="text-(--neon-green) text-2xl tracking-wider font-retro text-center">
          <div className="mb-2">ENISSEKJERNE 3.8]</div>
          <div className="text-lg">LASTER...</div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-8 border-4 border-(--neon-green) bg-black">
          <div
            className="h-full bg-(--neon-green) transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress percentage */}
        <div className="text-(--neon-green) text-xl text-center tracking-wider">
          {Math.floor(progress)}%
        </div>
      </div>
    </div>
  );
}
