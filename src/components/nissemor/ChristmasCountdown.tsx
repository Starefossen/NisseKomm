"use client";

import { useEffect, useState } from "react";

interface CountdownData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isChristmas: boolean;
  urgencyLevel: "calm" | "approaching" | "urgent" | "critical" | "today";
}

function getCountdown(): CountdownData {
  const now = new Date();
  const currentYear = now.getFullYear();
  const christmas = new Date(currentYear, 11, 24, 0, 0, 0); // Dec 24th at midnight

  // If we're past Christmas this year, count to next year
  if (now > christmas) {
    christmas.setFullYear(currentYear + 1);
  }

  const diff = christmas.getTime() - now.getTime();
  const isChristmas = diff <= 0;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  let urgencyLevel: CountdownData["urgencyLevel"] = "calm";
  if (isChristmas) urgencyLevel = "today";
  else if (days === 0) urgencyLevel = "critical";
  else if (days <= 3) urgencyLevel = "urgent";
  else if (days <= 7) urgencyLevel = "approaching";

  return { days, hours, minutes, seconds, isChristmas, urgencyLevel };
}

export function ChristmasCountdown() {
  const [countdown, setCountdown] = useState<CountdownData>(getCountdown());

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const urgencyColors = {
    calm: "border-(--neon-green) bg-(--neon-green)/5",
    approaching: "border-(--cold-blue) bg-(--cold-blue)/5",
    urgent: "border-(--gold) bg-(--gold)/5",
    critical:
      "border-(--christmas-red) bg-(--christmas-red)/10 animate-[pulse-led_1s_ease-in-out_infinite]",
    today:
      "border-(--gold) bg-(--gold)/20 animate-[gold-flash_1s_ease-in-out_infinite]",
  };

  const urgencyText = {
    calm: "God tid!",
    approaching: "Snart jul!",
    urgent: "HASTVERK!",
    critical: "KRITISK HASTVERK!",
    today: "I DAG ER DET JUL!",
  };

  if (countdown.isChristmas) {
    return (
      <div className={`border-4 ${urgencyColors.today} p-6 text-center`}>
        <div className="text-4xl md:text-5xl font-bold text-(--gold) mb-2">
          GOD JUL!
        </div>
        <div className="text-xl md:text-2xl text-(--gold)/90">
          Rampenissen ønsker alle en strålende julaften!
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-4 ${urgencyColors[countdown.urgencyLevel]} p-4 md:p-6`}
    >
      <div className="text-center space-y-4">
        <h3 className="text-lg md:text-xl font-bold text-(--neon-green)/90">
          NEDTELLING TIL JULAFTEN
        </h3>

        <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-md mx-auto">
          <div className="bg-(--dark-crt) border-2 border-(--neon-green)/50 p-2 md:p-3">
            <div className="text-2xl md:text-4xl font-bold text-(--gold)">
              {countdown.days}
            </div>
            <div className="text-xs md:text-sm text-(--neon-green)/70">
              dager
            </div>
          </div>
          <div className="bg-(--dark-crt) border-2 border-(--neon-green)/50 p-2 md:p-3">
            <div className="text-2xl md:text-4xl font-bold text-(--gold)">
              {countdown.hours.toString().padStart(2, "0")}
            </div>
            <div className="text-xs md:text-sm text-(--neon-green)/70">
              timer
            </div>
          </div>
          <div className="bg-(--dark-crt) border-2 border-(--neon-green)/50 p-2 md:p-3">
            <div className="text-2xl md:text-4xl font-bold text-(--gold)">
              {countdown.minutes.toString().padStart(2, "0")}
            </div>
            <div className="text-xs md:text-sm text-(--neon-green)/70">min</div>
          </div>
          <div className="bg-(--dark-crt) border-2 border-(--neon-green)/50 p-2 md:p-3">
            <div className="text-2xl md:text-4xl font-bold text-(--gold)">
              {countdown.seconds.toString().padStart(2, "0")}
            </div>
            <div className="text-xs md:text-sm text-(--neon-green)/70">sek</div>
          </div>
        </div>

        <div
          className={`text-xl md:text-2xl font-bold ${
            countdown.urgencyLevel === "critical" ||
            countdown.urgencyLevel === "urgent"
              ? "text-(--christmas-red)"
              : "text-(--neon-green)"
          }`}
        >
          {urgencyText[countdown.urgencyLevel]}
        </div>
      </div>
    </div>
  );
}
