/**
 * Weather Configuration for SnøfallTV Module
 *
 * Defines 24-day weather progression, sun/moon cycles, andKulde/darkness effects
 * for the Snøfall live camera feeds.
 */

export type WeatherCondition =
  | "clear" // No precipitation, clear skies
  | "light-snow" // Light snowfall, ~20 particles
  | "snow" // Moderate snowfall, ~50 particles
  | "heavy-snow" // Heavy snowfall, ~80 particles
  | "storm" // Blizzard conditions, ~120 particles + whiteout
  | "darkness"; // Kulde interference overlay (Days 7-20)

export interface DailyWeather {
  day: number;
  condition: WeatherCondition;
  temperature: number; // Celsius
  description: string; // Norwegian description
  storyEvent?: string; // Optional narrative context
}

export const SUN_TIMES = {
  sunriseStart: { hour: 7, minute: 0 },
  sunriseFull: { hour: 8, minute: 0 },
  sunsetStart: { hour: 17, minute: 0 },
  sunsetFull: { hour: 18, minute: 0 },
  twilightDuration: 60,
} as const;

export const TEMPERATURE_COLORS = {
  extremeCold: { threshold: -15, led: "blue" as const },
  cold: { threshold: -8, led: "green" as const },
  mild: { threshold: Infinity, led: "gold" as const },
} as const;

export const MORKET_INTENSITY = {
  day7: 0.15,
  day8: 0.25,
  day9: 0.3,
  day10: 0.35,
  day11: 0.45,
  day12: 0.3,
  day13: 0.2,
  day14: 0.25,
  day15: 0.2,
  day16: 0.3,
  day17: 0.6,
  day18: 0.55,
  day19: 0.5,
  day20: 0.45,
  day21: 0.0,
} as const;

export const DAILY_WEATHER: DailyWeather[] = [
  {
    day: 1,
    condition: "clear",
    temperature: -8,
    description:
      "Klart vær over Snøfall. Direktelinjen til Landås er koblet opp.",
    storyEvent: "Direktesending fra Snøfall TV åpnet",
  },
  {
    day: 2,
    condition: "light-snow",
    temperature: -10,
    description:
      "Lett snøfall. Spenningsfall i verkstedet etter IQs espressotest.",
    storyEvent: "Sikringsfeil i IQs verksted-lab (Kanal 2)",
  },
  {
    day: 3,
    condition: "storm",
    temperature: -18,
    description: "VOLDSOM SNØSTORM! Iskrystaller legger seg på kameralinsen.",
    storyEvent: "Snøstorm og optisk prisme-test",
  },
  {
    day: 4,
    condition: "snow",
    temperature: -12,
    description: "Moderat snøfall og tett tåke rundt reinsdyrstallen.",
  },
  {
    day: 5,
    condition: "clear",
    temperature: -6,
    description:
      "Klart og kaldt over fjellene. Fri sikt for brevfuglene mot Ulriken.",
  },
  {
    day: 6,
    condition: "light-snow",
    temperature: -9,
    description: "Stille desemberkveld med varme lykter på Snøfall torg.",
  },
  {
    day: 7,
    condition: "darkness",
    temperature: -19,
    description:
      "unormalt prisme-fall og kraftig høyfrekvent skurring på 90.0 MHz.",
    storyEvent: "⚠️ SPØKELSESKODE 'KULDE' DETEKTERT PÅ 90.0 MHz",
  },
  {
    day: 8,
    condition: "heavy-snow",
    temperature: -16,
    description: "Tung snø. Kulde forstyrrer kretskortene i verkstedet.",
  },
  {
    day: 9,
    condition: "snow",
    temperature: -20,
    description: "Kontinuerlig snøfall med sekskantede iskrystaller.",
  },
  {
    day: 10,
    condition: "light-snow",
    temperature: -17,
    description: "Kulde forsøker å tappe fargespekteret ut av TV-sendingen.",
    storyEvent: "Fargekalibrering (R-G-B-GULL) kreves",
  },
  {
    day: 11,
    condition: "storm",
    temperature: -24,
    description:
      "KRITISK BLIZZARD! Hovedantennen er jammet av Kulde på 90.0 MHz.",
    storyEvent: "⚠️ ANTENNEKRISE - Nødfrekvens 75.0 MHz må aktiveres",
  },
  {
    day: 12,
    condition: "snow",
    temperature: -15,
    description:
      "Snøfallet roer seg når julemelodien sendes ut over 100.0 MHz.",
  },
  {
    day: 13,
    condition: "light-snow",
    temperature: -11,
    description: "Luciadagen lyser opp torget i Snøfall gjennom snøføyken.",
    storyEvent: "Luciatoget varmer opp torget",
  },
  {
    day: 14,
    condition: "clear",
    temperature: -10,
    description: "Klarvær. Brevfugl-tårnet sender origami-meldinger.",
  },
  {
    day: 15,
    condition: "light-snow",
    temperature: -9,
    description:
      "Lett snø utenfor mens Fargesamlerens karamellkolbe koker i laben.",
  },
  {
    day: 16,
    condition: "snow",
    temperature: -14,
    description: "Snødrev rundt verkstedet mens samlebåndet går løpsk.",
    storyEvent: "⚠️ SORTERINGSKRISE på Kanal 4",
  },
  {
    day: 17,
    condition: "darkness",
    temperature: -23,
    description:
      "Satellittlinken fryser, men kraftig grønt nordlys bærer TV-signalet!",
    storyEvent: "🌌 NORDLYS-BROEN AKTIV OVER SNØFALL",
  },
  {
    day: 18,
    condition: "heavy-snow",
    temperature: -20,
    description: "Kastevind og turbulens i høyden mellom Snøfall og Ulriken.",
  },
  {
    day: 19,
    condition: "storm",
    temperature: -22,
    description: "Storm ved stallen mens høyekspress-gulrotsentrifugen kjører.",
  },
  {
    day: 20,
    condition: "heavy-snow",
    temperature: -19,
    description: "Tett snødrev under trykktesten av overlydssleden.",
  },
  {
    day: 21,
    condition: "clear",
    temperature: -12,
    description:
      "✨ BRANNMUR AKTIV! Spøkelseskoden Kulde er renset ut av nettet!",
    storyEvent: "🎉 SEIER! Krystallklar TV-sending gjenopprettet",
  },
  {
    day: 22,
    condition: "clear",
    temperature: -7,
    description:
      "Strålende polarhimmel over Snøfall. Navn skrives inn i gullboken.",
  },
  {
    day: 23,
    condition: "light-snow",
    temperature: -6,
    description: "Stille julesnø legger seg over takene i Snøfall.",
  },
  {
    day: 24,
    condition: "clear",
    temperature: -4,
    description: "🎄 JULAFTEN! Stjerneklart flyvær fra Snøfall til Landås!",
    storyEvent: "🎅 JULAFTEN - Sleden er klar for avgang",
  },
];

export function getWeatherForDay(day: number): DailyWeather {
  const clampedDay = Math.max(1, Math.min(24, day));
  return DAILY_WEATHER[clampedDay - 1];
}

export function getMorketIntensity(day: number): number {
  if (day < 7 || day > 20) return 0;

  const intensityMap: Record<number, number> = {
    7: MORKET_INTENSITY.day7,
    8: MORKET_INTENSITY.day8,
    9: MORKET_INTENSITY.day9,
    10: MORKET_INTENSITY.day10,
    11: MORKET_INTENSITY.day11,
    12: MORKET_INTENSITY.day12,
    13: MORKET_INTENSITY.day13,
    14: MORKET_INTENSITY.day14,
    15: MORKET_INTENSITY.day15,
    16: MORKET_INTENSITY.day16,
    17: MORKET_INTENSITY.day17,
    18: MORKET_INTENSITY.day18,
    19: MORKET_INTENSITY.day19,
    20: MORKET_INTENSITY.day20,
  };

  return intensityMap[day] ?? 0;
}

export function getSunProgress(currentTime: Date): number {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const sunriseMinutes =
    SUN_TIMES.sunriseFull.hour * 60 + SUN_TIMES.sunriseFull.minute;
  const sunsetMinutes =
    SUN_TIMES.sunsetStart.hour * 60 + SUN_TIMES.sunsetStart.minute;

  if (totalMinutes < sunriseMinutes || totalMinutes > sunsetMinutes) {
    return -1;
  }

  const daylightDuration = sunsetMinutes - sunriseMinutes;
  const minutesSinceSunrise = totalMinutes - sunriseMinutes;

  return minutesSinceSunrise / daylightDuration;
}

export function getMoonProgress(currentTime: Date): number {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const sunsetMinutes =
    SUN_TIMES.sunsetFull.hour * 60 + SUN_TIMES.sunsetFull.minute;
  const sunriseMinutes =
    SUN_TIMES.sunriseStart.hour * 60 + SUN_TIMES.sunriseStart.minute;

  if (totalMinutes >= sunriseMinutes && totalMinutes < sunsetMinutes) {
    return -1;
  }

  const nightDuration = 24 * 60 - (sunsetMinutes - sunriseMinutes);

  let minutesSinceSunset: number;
  if (totalMinutes >= sunsetMinutes) {
    minutesSinceSunset = totalMinutes - sunsetMinutes;
  } else {
    minutesSinceSunset = 24 * 60 - sunsetMinutes + totalMinutes;
  }

  return minutesSinceSunset / nightDuration;
}

export function getTwilightPhase(currentTime: Date): "dawn" | "dusk" | null {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const dawnStart =
    SUN_TIMES.sunriseStart.hour * 60 + SUN_TIMES.sunriseStart.minute;
  const dawnEnd =
    SUN_TIMES.sunriseFull.hour * 60 + SUN_TIMES.sunriseFull.minute;

  const duskStart =
    SUN_TIMES.sunsetStart.hour * 60 + SUN_TIMES.sunsetStart.minute;
  const duskEnd = SUN_TIMES.sunsetFull.hour * 60 + SUN_TIMES.sunsetFull.minute;

  if (totalMinutes >= dawnStart && totalMinutes < dawnEnd) {
    return "dawn";
  }

  if (totalMinutes >= duskStart && totalMinutes < duskEnd) {
    return "dusk";
  }

  return null;
}

export function getTwilightProgress(currentTime: Date): number {
  const phase = getTwilightPhase(currentTime);
  if (!phase) return 0;

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  if (phase === "dawn") {
    const dawnStart =
      SUN_TIMES.sunriseStart.hour * 60 + SUN_TIMES.sunriseStart.minute;
    const minutesSinceDawn = totalMinutes - dawnStart;
    return minutesSinceDawn / SUN_TIMES.twilightDuration;
  }

  if (phase === "dusk") {
    const duskStart =
      SUN_TIMES.sunsetStart.hour * 60 + SUN_TIMES.sunsetStart.minute;
    const minutesSinceDusk = totalMinutes - duskStart;
    return minutesSinceDusk / SUN_TIMES.twilightDuration;
  }

  return 0;
}

export function getBaseImage(
  weather: WeatherCondition,
  isDaytime: boolean,
): "day" | "night" | "storm" {
  if (weather === "storm") {
    return "storm";
  }
  return isDaytime ? "day" : "night";
}

export function getTwilightBrightness(
  currentTime: Date,
  isDaytime: boolean,
): number {
  const phase = getTwilightPhase(currentTime);

  if (!phase) {
    return isDaytime ? 1.0 : 0.75;
  }

  const progress = getTwilightProgress(currentTime);

  if (phase === "dawn") {
    return 0.6 + 0.6 * progress;
  }

  if (phase === "dusk") {
    return 1.2 - 0.6 * progress;
  }

  return 1.0;
}

export function getTwilightHueRotate(currentTime: Date): number {
  const phase = getTwilightPhase(currentTime);
  if (!phase) return 0;
  const progress = getTwilightProgress(currentTime);
  return Math.sin(progress * Math.PI) * 20;
}

export function getTemperatureLEDColor(
  temperature: number,
): "blue" | "green" | "gold" {
  if (temperature < TEMPERATURE_COLORS.extremeCold.threshold) {
    return TEMPERATURE_COLORS.extremeCold.led;
  }
  if (temperature < TEMPERATURE_COLORS.cold.threshold) {
    return TEMPERATURE_COLORS.cold.led;
  }
  return TEMPERATURE_COLORS.mild.led;
}

export function getParticleCount(condition: WeatherCondition): number {
  const counts: Record<WeatherCondition, number> = {
    clear: 0,
    "light-snow": 20,
    snow: 50,
    "heavy-snow": 80,
    storm: 120,
    darkness: 35,
  };

  return counts[condition];
}

export function getStaticIntensity(
  condition: WeatherCondition,
  isInCrisis: boolean,
): number {
  let intensity = 0.9;

  if (condition === "storm") {
    intensity = 1.2;
  } else if (condition === "heavy-snow") {
    intensity = 1.1;
  } else if (condition === "darkness") {
    intensity = 1.15;
  }

  if (isInCrisis) {
    intensity += 0.1;
  }

  return Math.min(1.3, intensity);
}
