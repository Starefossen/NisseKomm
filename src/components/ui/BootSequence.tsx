"use client";

import { useEffect, useState } from "react";

interface BootSequenceProps {
  onComplete: () => void;
  duration?: number; // Duration in seconds
}

export function BootSequence({ onComplete, duration = 2 }: BootSequenceProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (duration === 0) {
      onComplete();
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 100 / (duration * 10);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  if (duration === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-[var(--crt-bg)] flex items-center justify-center z-50"
      style={{ animation: "flicker-in 1s ease-out" }}
    >
      <div className="w-[600px] max-w-[90%] space-y-6">
        {/* Boot message */}
        <div className="text-[var(--neon-green)] text-2xl tracking-wider font-mono text-center">
          <div className="mb-2">ENISSEKJERNE 3.8]</div>
          <div className="text-lg">LASTER...</div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-8 border-4 border-[var(--neon-green)] bg-black">
          <div
            className="h-full bg-[var(--neon-green)] transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress percentage */}
        <div className="text-[var(--neon-green)] text-xl text-center tracking-wider">
          {Math.floor(progress)}%
        </div>
      </div>
    </div>
  );
}
