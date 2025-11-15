/**
 * Weather Configuration System for SnøfallTV
 *
 * Defines 24 daily weather conditions with realistic North Pole parameters:
 * - Weather states: clear, light-snow, snow, heavy-snow, storm, darkness
 * - Static temperatures: -22°C to -4°C (realistic Norwegian winter)
 * - Sun times: 10:30am sunrise, 2:30pm sunset (realistic for North Pole December)
 * - Twilight transitions: 30-minute gradual lighting changes
 * - Story integration: Mørket darkness arc, storm events, antenna crisis
 */

export type WeatherCondition =
  | "clear"           // No precipitation, clear skies
  | "light-snow"      // Light snowfall, ~20 particles
  | "snow"            // Moderate snowfall, ~50 particles
  | "heavy-snow"      // Heavy snowfall, ~80 particles
  | "storm"           // Blizzard conditions, ~120 particles + whiteout
  | "darkness";       // Mørket overlay (Days 7-20)

export interface DailyWeather {
  day: number;
  condition: WeatherCondition;
  temperature: number; // Celsius
  description: string; // Norwegian description
  storyEvent?: string; // Optional narrative context
}

/**
 * North Pole Sun Times (realistic December conditions)
 * - Extended daylight period (9 hours)
 * - Extended twilight transitions (1 hour each)
 * - Gradual morning and evening transitions
 */
export const SUN_TIMES = {
  // Main daylight period
  sunriseStart: { hour: 7, minute: 0 },    // Dawn begins
  sunriseFull: { hour: 8, minute: 0 },     // Full daylight
  sunsetStart: { hour: 17, minute: 0 },    // Dusk begins
  sunsetFull: { hour: 18, minute: 0 },     // Full darkness

  // Twilight duration (60 minutes each)
  twilightDuration: 60, // minutes
} as const;

/**
 * Temperature LED Color Thresholds
 * Used to color-code temperature displays
 */
export const TEMPERATURE_COLORS = {
  extremeCold: { threshold: -15, led: "blue" as const },    // < -15°C
  cold: { threshold: -8, led: "green" as const },           // -15°C to -8°C
  mild: { threshold: Infinity, led: "gold" as const },      // > -8°C
} as const;

/**
 * Mørket Darkness Progression
 * Purple-tinted overlay intensity increases gradually over story arc (Days 7-21)
 *
 * Story Arc:
 * - Day 7: Orakelet's first warning - subtle darkness begins
 * - Days 8-10: Gradual intensification
 * - Day 11: Antenna crisis + 40% intensity peak
 * - Days 12-16: Temporary retreat (recovery period)
 * - Day 17: Mørket returns stronger (60% peak)
 * - Days 18-20: Sustained pressure before climax
 * - Day 21: Rudolf's red nose defeats Mørket - instant clearing
 */
export const MORKET_INTENSITY = {
  day7: 0.15,   // 15% - Initial warning from Orakelet
  day8: 0.25,   // 25% - Growing presence
  day9: 0.30,   // 30% - Heavy snow under influence
  day10: 0.35,  // 35% - SnøfallTV activated to monitor
  day11: 0.40,  // 40% - Escalation + antenna crisis
  day12: 0.35,  // 35% - Slight retreat after crisis
  day13: 0.30,  // 30% - Lucia brings light
  day14: 0.25,  // 25% - Further retreat
  day15: 0.20,  // 20% - Recovery period
  day16: 0.25,  // 25% - Slight return
  day17: 0.60,  // 60% - PEAK - Mørket's last major push
  day18: 0.55,  // 55% - Sustained darkness
  day19: 0.50,  // 50% - Building to climax
  day20: 0.45,  // 45% - Final night before Rudolf
  day21: 0.00,  // 0% - Rudolf's victory, instant clearing
} as const;

/**
 * 24-Day Weather Configuration
 * Tied to mission events and story progression
 */
export const DAILY_WEATHER: DailyWeather[] = [
  // Week 1: December 1-7 (Introduction & Mørket Warning)
  {
    day: 1,
    condition: "clear",
    temperature: -8,
    description: "Klart vær, perfekt start på julekalenderen",
    storyEvent: "Kalenderen begynner"
  },
  {
    day: 2,
    condition: "light-snow",
    temperature: -10,
    description: "Lett snøfall, romantisk julestemning",
  },
  {
    day: 3,
    condition: "storm",
    temperature: -18,
    description: "VOLDSOM SNØSTORM! Kunne knapt se hånden foran meg",
    storyEvent: "Stor snøstorm - se Rampenissens mail"
  },
  {
    day: 4,
    condition: "snow",
    temperature: -12,
    description: "Moderat snøfall etter stormen",
  },
  {
    day: 5,
    condition: "clear",
    temperature: -6,
    description: "Klart og kaldt, stjerneklar natt",
  },
  {
    day: 6,
    condition: "light-snow",
    temperature: -9,
    description: "Fin snø, ideelt for julestemning",
  },
  {
    day: 7,
    condition: "snow",
    temperature: -15,
    description: "Merkelig mørk snø... Orakelet advarer om en trussel",
    storyEvent: "Mørket oppdages første gang - subtil begynnelse"
  },

  // Week 2: December 8-14 (Mørket Escalation & Antenna Crisis)
  {
    day: 8,
    condition: "heavy-snow",
    temperature: -16,
    description: "Tung snø, Mørket vokser i styrke",
  },
  {
    day: 9,
    condition: "snow",
    temperature: -20,
    description: "Kontinuerlig snøfall, Mørket styrkes",
  },
  {
    day: 10,
    condition: "light-snow",
    temperature: -17,
    description: "Lett snø, men Mørket tynger luften. SnøfallTV aktiveres for overvåkning",
    storyEvent: "SnøfallTV modul låses opp"
  },
  {
    day: 11,
    condition: "storm",
    temperature: -22,
    description: "KRITISK STORM! Antennen ødelagt, Mørket eskalerer",
    storyEvent: "⚠️ ANTENNA CRISIS - Signal lost, Mørket 40%"
  },
  {
    day: 12,
    condition: "snow",
    temperature: -19,
    description: "Snøfall letter, antenne reparert. Mørket trekker seg tilbake",
  },
  {
    day: 13,
    condition: "light-snow",
    temperature: -13,
    description: "Lucia bringer lys i mørket. Lett snøfall",
    storyEvent: "Luciadagen - lyset bekjemper mørket"
  },
  {
    day: 14,
    condition: "clear",
    temperature: -11,
    description: "Klarvær, Brevfugl-mysteriet løst. Midlertidig fred",
  },

  // Week 3: December 15-21 (Recovery & Mørket Return)
  {
    day: 15,
    condition: "light-snow",
    temperature: -10,
    description: "Lett snø, Mørket hviler seg før siste angrep",
  },
  {
    day: 16,
    condition: "snow",
    temperature: -12,
    description: "Snøfall, inventar-kaos. Mørket lurer igjen",
    storyEvent: "Inventory crisis - systemer forstyrret"
  },
  {
    day: 17,
    condition: "heavy-snow",
    temperature: -21,
    description: "MØRKET SLÅR TILBAKE! 60% intensitet, tung snø",
    storyEvent: "⚠️ KRITISK: Mørket på sitt kraftigste (60%)"
  },
  {
    day: 18,
    condition: "heavy-snow",
    temperature: -20,
    description: "Tung snø, Mørket holder grepet sterkt",
  },
  {
    day: 19,
    condition: "storm",
    temperature: -22,
    description: "Storm, klimakset nærmer seg. Rudolf forbereder seg",
  },
  {
    day: 20,
    condition: "heavy-snow",
    temperature: -19,
    description: "Siste natt av Mørkets makt. I morgen kommer lyset",
  },
  {
    day: 21,
    condition: "clear",
    temperature: -14,
    description: "✨ RUDOLF BESEIRER MØRKET! Hans røde nese skinner gjennom mørket",
    storyEvent: "🎉 SEIER! Rudolf's lysnese bryter Mørkets makt - instant klarvær"
  },

  // Week 4: December 22-24 (Celebration & Christmas Eve)
  {
    day: 22,
    condition: "clear",
    temperature: -7,
    description: "Strålende klarvær! Seier feires. Ditt navn registreres i historien",
    storyEvent: "📝 Name registration - bli en del av Snøfalls historie"
  },
  {
    day: 23,
    condition: "light-snow",
    temperature: -6,
    description: "Magisk lett snø. Ditt navn står på Snill-listen!",
    storyEvent: "⭐ Ditt navn vises i Julius' offisielle Snill & Slem liste"
  },
  {
    day: 24,
    condition: "clear",
    temperature: -4,
    description: "🎄 JULAFTEN! Perfekt klarvær. Julius flyr snart!",
    storyEvent: "🎅 JULAFTEN - Julius' store reise begynner"
  },
];

/**
 * Get weather for specific day (1-24)
 */
export function getWeatherForDay(day: number): DailyWeather {
  // Clamp day to valid range
  const clampedDay = Math.max(1, Math.min(24, day));

  // Return weather config for day (array is 0-indexed)
  return DAILY_WEATHER[clampedDay - 1];
}

/**
 * Get Mørket darkness intensity for specific day
 * Returns 0 for days without Mørket, opacity value (0-1) for affected days
 * Gradual progression matching story arc (Days 7-21)
 */
export function getMorketIntensity(day: number): number {
  if (day < 7 || day > 20) return 0; // Outside Mørket arc

  // Map specific days to intensity levels
  const intensityMap: Record<number, number> = {
    7: MORKET_INTENSITY.day7,     // 0.15
    8: MORKET_INTENSITY.day8,     // 0.25
    9: MORKET_INTENSITY.day9,     // 0.30
    10: MORKET_INTENSITY.day10,   // 0.35
    11: MORKET_INTENSITY.day11,   // 0.40
    12: MORKET_INTENSITY.day12,   // 0.35
    13: MORKET_INTENSITY.day13,   // 0.30
    14: MORKET_INTENSITY.day14,   // 0.25
    15: MORKET_INTENSITY.day15,   // 0.20
    16: MORKET_INTENSITY.day16,   // 0.25
    17: MORKET_INTENSITY.day17,   // 0.60 PEAK
    18: MORKET_INTENSITY.day18,   // 0.55
    19: MORKET_INTENSITY.day19,   // 0.50
    20: MORKET_INTENSITY.day20,   // 0.45
  };

  return intensityMap[day] ?? 0;
}

/**
 * Calculate sun position based on current time
 * Returns progress (0-1) through the day's sun arc
 * - 0: Sunrise position (eastern horizon)
 * - 0.5: Noon position (highest point)
 * - 1: Sunset position (western horizon)
 */
export function getSunProgress(currentTime: Date): number {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // Sunrise: 07:45 (465 minutes)
  const sunriseMinutes = SUN_TIMES.sunriseFull.hour * 60 + SUN_TIMES.sunriseFull.minute;
  // Sunset: 15:30 (930 minutes)
  const sunsetMinutes = SUN_TIMES.sunsetStart.hour * 60 + SUN_TIMES.sunsetStart.minute;

  // Before sunrise or after sunset: sun not visible
  if (totalMinutes < sunriseMinutes || totalMinutes > sunsetMinutes) {
    return -1; // Not visible
  }

  // Calculate progress through daylight period (0 to 1)
  const daylightDuration = sunsetMinutes - sunriseMinutes;
  const minutesSinceSunrise = totalMinutes - sunriseMinutes;

  return minutesSinceSunrise / daylightDuration;
}

/**
 * Calculate moon position based on current time
 * Moon is visible during night hours (opposite of sun)
 * Returns progress (0-1) through the night's moon arc
 */
export function getMoonProgress(currentTime: Date): number {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // Moon visible from sunset (16:30) to sunrise (06:45 next day)
  const sunsetMinutes = SUN_TIMES.sunsetFull.hour * 60 + SUN_TIMES.sunsetFull.minute;
  const sunriseMinutes = SUN_TIMES.sunriseStart.hour * 60 + SUN_TIMES.sunriseStart.minute;

  // During daytime: moon not visible
  if (totalMinutes >= sunriseMinutes && totalMinutes < sunsetMinutes) {
    return -1; // Not visible
  }

  // Calculate progress through night period
  // Night is from 16:30 (990 min) to 06:45 (405 min) = 14.25 hours = 855 minutes
  const nightDuration = (24 * 60) - (sunsetMinutes - sunriseMinutes);

  let minutesSinceSunset: number;
  if (totalMinutes >= sunsetMinutes) {
    // After sunset today
    minutesSinceSunset = totalMinutes - sunsetMinutes;
  } else {
    // Before sunrise (early morning)
    minutesSinceSunset = (24 * 60) - sunsetMinutes + totalMinutes;
  }

  return minutesSinceSunset / nightDuration;
}

/**
 * Check if currently in twilight transition period
 * Returns "dawn", "dusk", or null
 */
export function getTwilightPhase(currentTime: Date): "dawn" | "dusk" | null {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // Dawn: 06:45-07:45
  const dawnStart = SUN_TIMES.sunriseStart.hour * 60 + SUN_TIMES.sunriseStart.minute;
  const dawnEnd = SUN_TIMES.sunriseFull.hour * 60 + SUN_TIMES.sunriseFull.minute;

  // Dusk: 15:30-16:30
  const duskStart = SUN_TIMES.sunsetStart.hour * 60 + SUN_TIMES.sunsetStart.minute;
  const duskEnd = SUN_TIMES.sunsetFull.hour * 60 + SUN_TIMES.sunsetFull.minute;

  if (totalMinutes >= dawnStart && totalMinutes < dawnEnd) {
    return "dawn";
  }

  if (totalMinutes >= duskStart && totalMinutes < duskEnd) {
    return "dusk";
  }

  return null;
}

/**
 * Calculate twilight progress (0-1) during transition periods
 * Returns how far through the twilight transition we are
 * 0 = start of transition, 1 = end of transition
 */
export function getTwilightProgress(currentTime: Date): number {
  const phase = getTwilightPhase(currentTime);
  if (!phase) return 0;

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  if (phase === "dawn") {
    const dawnStart = SUN_TIMES.sunriseStart.hour * 60 + SUN_TIMES.sunriseStart.minute;
    const minutesSinceDawn = totalMinutes - dawnStart;
    return minutesSinceDawn / SUN_TIMES.twilightDuration;
  }

  if (phase === "dusk") {
    const duskStart = SUN_TIMES.sunsetStart.hour * 60 + SUN_TIMES.sunsetStart.minute;
    const minutesSinceDusk = totalMinutes - duskStart;
    return minutesSinceDusk / SUN_TIMES.twilightDuration;
  }

  return 0;
}

/**
 * Determine which base image to use
 * Returns "day", "night", or "storm"
 */
export function getBaseImage(weather: WeatherCondition, isDaytime: boolean): "day" | "night" | "storm" {
  // Storm weather always uses storm image
  if (weather === "storm") {
    return "storm";
  }

  // Otherwise use day/night based on time
  return isDaytime ? "day" : "night";
}

/**
 * Calculate brightness filter value during twilight
 * Returns CSS brightness value (0.6 to 1.2)
 */
export function getTwilightBrightness(currentTime: Date, isDaytime: boolean): number {
  const phase = getTwilightPhase(currentTime);

  if (!phase) {
    // Not in twilight - return default brightness
    return isDaytime ? 1.0 : 0.7;
  }

  const progress = getTwilightProgress(currentTime);

  if (phase === "dawn") {
    // Transition from night (0.6) to day (1.2)
    return 0.6 + (0.6 * progress);
  }

  if (phase === "dusk") {
    // Transition from day (1.2) to night (0.6)
    return 1.2 - (0.6 * progress);
  }

  return 1.0;
}

/**
 * Calculate hue-rotate filter value during twilight
 * Returns CSS hue-rotate value in degrees (0-30)
 * Adds warm orange/yellow tint during sunrise/sunset
 */
export function getTwilightHueRotate(currentTime: Date): number {
  const phase = getTwilightPhase(currentTime);

  if (!phase) {
    return 0; // No hue shift outside twilight
  }

  const progress = getTwilightProgress(currentTime);

  // Peak warmth at middle of twilight (progress = 0.5)
  // Use sine curve for smooth transition: sin(progress * π)
  const warmth = Math.sin(progress * Math.PI) * 20; // 0 to 20 degrees

  return warmth;
}

/**
 * Get LED color for temperature display
 */
export function getTemperatureLEDColor(temperature: number): "blue" | "green" | "gold" {
  if (temperature < TEMPERATURE_COLORS.extremeCold.threshold) {
    return TEMPERATURE_COLORS.extremeCold.led;
  }
  if (temperature < TEMPERATURE_COLORS.cold.threshold) {
    return TEMPERATURE_COLORS.cold.led;
  }
  return TEMPERATURE_COLORS.mild.led;
}

/**
 * Get particle count for weather condition
 */
export function getParticleCount(condition: WeatherCondition): number {
  const counts: Record<WeatherCondition, number> = {
    "clear": 0,
    "light-snow": 20,
    "snow": 50,
    "heavy-snow": 80,
    "storm": 120,
    "darkness": 30, // Light snow during darkness
  };

  return counts[condition];
}

/**
 * Get static noise intensity for weather/crisis conditions
 * Returns baseFrequency value for SVG feTurbulence
 */
export function getStaticIntensity(
  condition: WeatherCondition,
  isInCrisis: boolean
): number {
  // Base intensity
  let intensity = 0.9;

  // Increase during storms
  if (condition === "storm") {
    intensity = 1.2;
  }

  // Increase during heavy snow
  if (condition === "heavy-snow") {
    intensity = 1.1;
  }

  // Increase during Mørket darkness
  if (condition === "darkness") {
    intensity = 1.15;
  }

  // Further increase during crisis
  if (isInCrisis) {
    intensity += 0.1;
  }

  // Cap at 1.3
  return Math.min(1.3, intensity);
}
