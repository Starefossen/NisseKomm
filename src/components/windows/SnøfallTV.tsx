"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { RetroWindow } from "../ui/RetroWindow";
import { LEDIndicator } from "../ui/LEDIndicator";
import { Icons } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";
import { GameEngine } from "@/lib/game-engine";
import { getCurrentDay, getCurrentDate } from "@/lib/date-utils";
import {
  getWeatherForDay,
  getMorketIntensity,
  getSunProgress,
  getMoonProgress,
  getTwilightPhase,
  getTwilightBrightness,
  getTwilightHueRotate,
  getTemperatureLEDColor,
  getParticleCount,
  getStaticIntensity,
  getBaseImage,
  type WeatherCondition,
} from "@/lib/weather-config";

interface SnøfallTVProps {
  onClose: () => void;
  currentDay?: number;
}

type SpeakerId = "JULIUS" | "IQ" | "ORAKELET" | "WINTER";
type ChannelId = 1 | 2 | 3 | 4;
type MiniGameId = "kretskort" | "sorterer" | "slede" | "zapper";

interface VlogEntry {
  day: number;
  speaker: SpeakerId;
  locationLabel: string;
  title: string;
  transcript: string;
  codeHint: string;
  recommendedChannel: ChannelId;
  segmentTag: string;
  teletextCode: string;
  teletextDiagram: string;
}

const VLOG_ENTRIES: VlogEntry[] = [
  {
    day: 1,
    speaker: "JULIUS",
    locationLabel: "SNØFALL HOVEDHUSET",
    title: "Direktelinje til Landås!",
    transcript:
      "Hallo Kristian, Håkon og Hanna! Hører dere meg på Landås? IQ har koblet opp dette nye billedrøret slik at dere kan følge oss direkte fra Snøfall. Sjekk den røde tråden ved TV-en deres (S-I-G) og filen om-snofall.txt (N-A-L)!",
    codeHint: "DEL 1 (Stue): S-I-G + DEL 2 (NisseNet): N-A-L",
    recommendedChannel: 3,
    segmentTag: "CAM 03: VHS-LOGG #01",
    teletextCode: "S-I-G + N-A-L",
    teletextDiagram: "📡 [STUE: RØD TRÅD] ───► [NISSENET: FIL] ───► SIGNAL",
  },
  {
    day: 2,
    speaker: "IQ",
    locationLabel: "VERKSTED-LAB SEKTOR B",
    title: "Tre sikringer i luften!",
    transcript:
      "Eh... hei! Jeg skulle bare koble espressomaskinen på videologg-forsterkeren, og PANG! Finn de tre sikringslappene Rampenissen teipet under stolene ved spisebordet (12V, 16V og 20V) og slå på alle tre sikringene på CAM 2!",
    codeHint: "12V + 16V + 20V = ? Volt (Slå på sikringene på CAM 2!)",
    recommendedChannel: 2,
    segmentTag: "CAM 02: SIKRINGSSKAP",
    teletextCode: "12V + 16V + 20V",
    teletextDiagram:
      "⚡ [SIKRING 1: 12V] + [SIKRING 2: 16V] + [SIKRING 3: 20V] = 48V",
  },
  {
    day: 3,
    speaker: "ORAKELET",
    locationLabel: "NORDLYS-OBSERVATORIET",
    title: "Iskrystaller på linjen",
    transcript:
      "En kald skygge sniker langs datalinjen mellom Nordpolen og Bergen. Den legger igjen krystallmønstre på kameralinsen. Bryt lyset gjennom et PRISME: kombiner P-R-I fra vinduskarmen med S-M-E fra mikroskopfilen!",
    codeHint: "Vinduskarm (P-R-I) + snowflake-patterns.txt (S-M-E)",
    recommendedChannel: 1,
    segmentTag: "CAM 01: PRISME-FILTER",
    teletextCode: "P-R-I + S-M-E",
    teletextDiagram: "🔭 Hvit stråle ──► △ [PRISME] ──► 🌈 R-G-B-GULL",
  },
  {
    day: 4,
    speaker: "JULIUS",
    locationLabel: "REINSDYRSTALLEN",
    title: "Rudolfs retningsutfordring",
    transcript:
      "Rudolf fløy nettopp tre runder rundt sin egen hale i tåken! Følg skotoget til Rampenissen ute i gangen for å finne de fire første bokstavene (K-O-M-P), og legg til mine tre siste bokstaver herfra: A - S - S!",
    codeHint: "Gangen (K-O-M-P) + Videologg (A-S-S)",
    recommendedChannel: 1,
    segmentTag: "CAM 01: STALL-KOMPASS",
    teletextCode: "K-O-M-P + A-S-S",
    teletextDiagram: "🧭 [N: SNØFALL] ◄───► [S: BERGEN / LANDÅS] = KOMPASS",
  },
  {
    day: 5,
    speaker: "WINTER",
    locationLabel: "BREVFUGL-RADAR",
    title: "Kryptert brevfugl over Bergen",
    transcript:
      "Speider-brevfuglen vår landet nettopp etter å ha passert det høyeste av de syv fjellene ved Landås! Bruk Caesar-dekoderen (-1 steg tilbake) på VMSJLFO som står på papirfuglen i stuen.",
    codeHint: "VMSJLFO med -1 skift = byfjellet ved Landås",
    recommendedChannel: 1,
    segmentTag: "CAM 01: ULRIKEN-RADAR",
    teletextCode: "VMSJLFO (-1)",
    teletextDiagram: "🕊️ V→U | M→L | S→R | J→I | L→K | F→E | O→N",
  },
  {
    day: 6,
    speaker: "JULIUS",
    locationLabel: "SNØFALL TORG",
    title: "Lys i desembermørket",
    transcript:
      "I gamle dager bar barna lykter gjennom mørket for å vise vei. Finn lommelykten og det røde hjertet ved Rampenissen, og lys under bordet for å lese dagens kode på 4 bokstaver!",
    codeHint: "Lys under stuebordet: L - Y - K - T",
    recommendedChannel: 1,
    segmentTag: "CAM 01: LYKTEFEST",
    teletextCode: "L - Y - K - T",
    teletextDiagram: "🔦 [MØRKLAGT TORG] ──► LYS UNDER STUEBORDET ──► LYKT",
  },
  {
    day: 7,
    speaker: "ORAKELET",
    locationLabel: "ANTENNETÅRN 90.0 MHz",
    title: "Kodenavn: KULDE",
    transcript:
      "Der slo inntrengeren til på 90.0 MHz! En digital spøkelseskode prøver å fryse ned Snøfall. Redd Rampenissens utstyr ut av fryseren (K-U-L) og koble det med siste del i snofall_fakta.txt (D-E)!",
    codeHint: "Fryseren (K-U-L) + snofall_fakta.txt (D-E)",
    recommendedChannel: 4,
    segmentTag: "CAM 04: 90.0 MHz ALARM",
    teletextCode: "K-U-L + D-E",
    teletextDiagram: "❄️ 90.0 MHz SPØKELSESKODE DETEKTERT: [K-U-L-D-E]",
  },
  {
    day: 8,
    speaker: "IQ",
    locationLabel: "VERKSTED-LAB SEKTOR B",
    title: "Bestikk-kretsløpet!",
    transcript:
      "Gratulerer med første uke fullført! Rampenissen bygde et kretsløp av skjeer og gafler på kjøkkenbenken (KRETS). Kombiner det med min komponent på CAM 2 og CAM 4 (KORT)!",
    codeHint: "Kjøkkenbenk (KRETS) + CAM 4 kretskort (KORT)",
    recommendedChannel: 4,
    segmentTag: "CAM 04: KRETSKORT-HUD",
    teletextCode: "KRETS + KORT",
    teletextDiagram: "🔌 [KJØKKEN: KRETS] + [CAM 4 HUD: KORT] = KRETSKORT",
  },
  {
    day: 9,
    speaker: "JULIUS",
    locationLabel: "GLASSBLÅSERIET",
    title: "Sekskantet geometri",
    transcript:
      "Nissemor blåser krystallkuler i dag! Hvert ekte snøkrystall har nøyaktig 6 tagger. Tell de 4 snøkrystallene på kjøleskapet hjemme og gang med 6!",
    codeHint: "4 snøkrystaller × 6 tagger = ?",
    recommendedChannel: 1,
    segmentTag: "CAM 01: KRYSTALL-LUPEN",
    teletextCode: "4 × 6 = ??",
    teletextDiagram: "❄️ [6] + ❄️ [6] + ❄️ [6] + ❄️ [6] = 24 TAGGER",
  },
  {
    day: 10,
    speaker: "IQ",
    locationLabel: "VERKSTED-LAB SEKTOR B",
    title: "Kampen om fargespekteret",
    transcript:
      "Spøkelseskoden Kulde prøvde å gjøre Snøfall TV svart-hvitt i natt! Hanna, finn de 4 fargene i stuen (S-P-E-K) og legg til T-E-R fra fargedekoderen i NisseNet!",
    codeHint: "Stuen (S-P-E-K) + NisseNet (T-E-R)",
    recommendedChannel: 1,
    segmentTag: "CAM 01: RGB-KALIBRERING",
    teletextCode: "S-P-E-K + T-E-R",
    teletextDiagram: "🎨 [RØD][GRØNN][BLÅ][GULL] ──► FULLT SPEKTER AKTIVT",
  },
  {
    day: 11,
    speaker: "IQ",
    locationLabel: "ANTENNETÅRN NØDLINK",
    title: "Nødfrekvens 75 MHz!",
    transcript:
      "SKURR... Kulde jammer hovedantennen vår i snøstormen! Finn de tre sender-lappene i huset (15, 25 og 35 MHz), legg dem sammen, og still inn frekvensskanneren på CAM 4 til 75.0 MHz!",
    codeHint: "15 + 25 + 35 = ? MHz (Still inn 75.0 MHz på CAM 4!)",
    recommendedChannel: 4,
    segmentTag: "CAM 04: 75.0 MHz NØDLINK",
    teletextCode: "15 + 25 + 35 MHz",
    teletextDiagram: "📡 [15 MHz] + [25 MHz] + [35 MHz] = 75.0 MHz NØDSIGNAL",
  },
  {
    day: 12,
    speaker: "JULIUS",
    locationLabel: "SNØFALL HOVEDHUSET",
    title: "Musikk som smelter is",
    transcript:
      "Ingenting varmer et frossent serverrom som en ekte jule-MELODI! Sjekk klokkespillet av kopper på kjøkkenet (M-E-L) og julesanger-samling.txt (O-D-I) - og lås opp Nivå 1 i NisseKrypto!",
    codeHint: "Kjøkken (M-E-L) + NisseNet (O-D-I)",
    recommendedChannel: 4,
    segmentTag: "CAM 04: 100.0 MHz JULE-FM",
    teletextCode: "M-E-L + O-D-I",
    teletextDiagram: "🎵 100.0 MHz HARMONISK BØLGE: [M-E-L] + [O-D-I]",
  },
  {
    day: 13,
    speaker: "JULIUS",
    locationLabel: "SNØFALL TORG",
    title: "Luciadagens gylne glød",
    transcript:
      "Nissemors lussekatter lyser som små soler mot kulden! Kombiner S-A-F fra Luciatoget i stuen med R-A-N fra oppskriftsfilen i NisseNet.",
    codeHint: "Stue (S-A-F) + NisseNet (R-A-N)",
    recommendedChannel: 1,
    segmentTag: "CAM 01: LUCIATOG",
    teletextCode: "S-A-F + R-A-N",
    teletextDiagram: "🕯️🕯️🕯️ LUCIATOG I SNØFALL: [S-A-F] + [R-A-N] = SAFRAN",
  },
  {
    day: 14,
    speaker: "WINTER",
    locationLabel: "BREVFUGL-TÅRNET",
    title: "Origami-protokollen aktiv!",
    transcript:
      "Endelig kan vi åpne Brevfugler-modulen! Finn de 4 første bokstavene på papirfuglen på bordet (O-R-I-G) og legg til A-M-I fra brevfugl-finale.txt.",
    codeHint: "Papirfugl (O-R-I-G) + NisseNet (A-M-I)",
    recommendedChannel: 1,
    segmentTag: "CAM 01: BREVFUGL-TÅRN",
    teletextCode: "O-R-I-G + A-M-I",
    teletextDiagram: "✉️ ──► 🕊️ BREVFUGL-PROTOKOLL: [O-R-I-G-A-M-I]",
  },
  {
    day: 15,
    speaker: "JULIUS",
    locationLabel: "VERKSTED-KJØKKENET",
    title: "Søt varme på kjøkkenet",
    transcript:
      "Rampenissen prøvde å koke Fargesamlerens oppskrift i natt! Finn skålene på kjøkkenet (K-A-R-A) og sjekk IQs boblende kolbe på CAM 2 (M-E-L-L)!",
    codeHint: "Kjøkken (K-A-R-A) + CAM 2 kolbe (M-E-L-L)",
    recommendedChannel: 2,
    segmentTag: "CAM 02: KARAMELL-KOLBE",
    teletextCode: "K-A-R-A + M-E-L-L",
    teletextDiagram: "🧪 [KJØKKEN: KARA] + [LAB-KOLBE: MELL] = KARAMELL",
  },
  {
    day: 16,
    speaker: "WINTER",
    locationLabel: "PAKKESENTRALEN",
    title: "Samlebånd-kaos!",
    transcript:
      "Kulde snudde gave-sorteringen på hodet! Sjekk de 4 lekehaugene i stuen (S-O-R-T) og hjelp meg i Gave-Sorterer på CAM 4 for å låse opp siste del (E-R-I-N-G)!",
    codeHint: "Stuegulv (S-O-R-T) + CAM 4 Sorterer (E-R-I-N-G)",
    recommendedChannel: 4,
    segmentTag: "CAM 04: GAVE-SORTERER",
    teletextCode: "S-O-R-T + E-R-I-N-G",
    teletextDiagram: "📦 [TRANSPORT][KOSEDYR][KLOSSER][KREATIVT] ──► SORTERING",
  },
  {
    day: 17,
    speaker: "ORAKELET",
    locationLabel: "NORDLYS-OBSERVATORIET",
    title: "Himmelbroen i nord",
    transcript:
      "Satellitten frøs, men himmelen selv bærer signalet vårt! Kombiner det grønne båndet i gangen (N-O-R-D) med de tre siste bokstavene fra nordlyset på CAM 1: L - Y - S!",
    codeHint: "Gangen (N-O-R-D) + CAM 1 Nordlys (L-Y-S)",
    recommendedChannel: 1,
    segmentTag: "CAM 01: NORDLYS-BROEN",
    teletextCode: "N-O-R-D + L-Y-S",
    teletextDiagram: "🌌 POLARSTRÅLE AKTIV PÅ CAM 1: [N-O-R-D] + [L-Y-S]",
  },
  {
    day: 18,
    speaker: "JULIUS",
    locationLabel: "FLYSIMULATOREN",
    title: "Vestlandsvind i simulatoren",
    transcript:
      "Det blåser friskt rundt Ulriken! Finn vindlappen ved jakkene i gangen (T-U-R-B-U) og test Slede-Simulatoren på CAM 4 for de siste bokstavene (L-E-N-S)!",
    codeHint: "Gangen (T-U-R-B-U) + CAM 4 Simulator (L-E-N-S)",
    recommendedChannel: 4,
    segmentTag: "CAM 04: SLEDE-RADAR",
    teletextCode: "T-U-R-B-U + L-E-N-S",
    teletextDiagram: "🛷 UNNGÅ KASTEVIND OVER ULRIKEN: [TURBU] + [LENS]",
  },
  {
    day: 19,
    speaker: "IQ",
    locationLabel: "VERKSTED-LAB SEKTOR B",
    title: "Høyekspress gulrot-energi",
    transcript:
      "Reinsdyrene trenger super-energi før siste innspurt! Finn de 3 gulrøttene gjemt i huset (G-U-L) og kjør sentrifugen på CAM 2 for siste del (R-O-T)!",
    codeHint: "3 gulrøtter i huset (G-U-L) + CAM 2 Sentrifuge (R-O-T)",
    recommendedChannel: 2,
    segmentTag: "CAM 02: SENTRIFUGE",
    teletextCode: "G-U-L + R-O-T",
    teletextDiagram: "🥕 [3 GULRØTTER: GUL] + [SENTRIFUGE: ROT] = GULROT",
  },
  {
    day: 20,
    speaker: "IQ",
    locationLabel: "VERKSTED-LAB SEKTOR B",
    title: "Overlyds-slede klar!",
    transcript:
      "Bygg en slede av sofaputer i stuen for de første bokstavene (T-U-R), og aktiver trykkmåleren på CAM 2 for siste del (B-O)!",
    codeHint: "Pute-slede i stuen (T-U-R) + CAM 2 Trykkmåler (B-O)",
    recommendedChannel: 2,
    segmentTag: "CAM 02: TRYKKMÅLER",
    teletextCode: "T-U-R + B-O",
    teletextDiagram: "🚀 [PUTE-SLEDE: TUR] + [TRYKKMÅLER: BO] = TURBO",
  },
  {
    day: 21,
    speaker: "ORAKELET",
    locationLabel: "ANTENNETÅRN BRANNMUR",
    title: "Slaget ved brannmuren!",
    transcript:
      "Dette er det avgjørende slaget mot Spøkelseskoden Kulde! Bygg en mur av bøker rundt Rampenissen (B-R-A-N-N) og rens de 3 frekvensene på CAM 4 for siste del (M-U-R)!",
    codeHint: "Bok-mur (B-R-A-N-N) + CAM 4 Frekvens-Renser (M-U-R)",
    recommendedChannel: 4,
    segmentTag: "CAM 04: BRANNMUR-RENS",
    teletextCode: "B-R-A-N-N + M-U-R",
    teletextDiagram: "🛡️ [BOK-MUR: BRANN] + [CAM 4 RENS: MUR] = BRANNMUR",
  },
  {
    day: 22,
    speaker: "JULIUS",
    locationLabel: "GULLBOK-GALLERIET",
    title: "Innflyging Landås",
    transcript:
      "Brannmuren holdt og Spøkelseskoden er borte! Nå legger vi inn landingsruten for Bergen. Finn tallene i de tre julesokkene (12-1, 14-4 og 29-19) og bruk julekode_dekoder.txt for å stave bydelen deres!",
    codeHint:
      "3 julesokker (12-1, 14-4, 29-19) + NisseNet (A=1..Å=29) = LANDÅS",
    recommendedChannel: 3,
    segmentTag: "CAM 03: LANDINGSKODE",
    teletextCode: "12-1 · 14-4 · 29-19",
    teletextDiagram: "🧦 [12-1: LA] + [14-4: ND] + [29-19: ÅS] = LANDÅS",
  },
  {
    day: 23,
    speaker: "JULIUS",
    locationLabel: "SNØFALL HOVEDHUSET",
    title: "Stjerneklart over Bergen",
    transcript:
      "Sekken er pakket og himmelen over Ulriken og Landås er helt klar! Finn første del ved juletreet (S-T-J-E-R-N-E) og legg til andre del her på skjermen: K - L - A - R - T!",
    codeHint: "Ved juletreet (S-T-J-E-R-N-E) + Snøfall TV Kanal 3 (K-L-A-R-T)",
    recommendedChannel: 3,
    segmentTag: "CAM 03: LILLE JULAFTEN",
    teletextCode: "STJERNE + KLART",
    teletextDiagram: "🌟 [JULETRE: STJERNE] + [KANAL 3: KLART] = STJERNEKLART",
  },
  {
    day: 24,
    speaker: "JULIUS",
    locationLabel: "SNØFALL LUFTROM",
    title: "Julaften - Operasjon Fullført!",
    transcript:
      "Riktig god jul, Kristian, Håkon og Hanna! Tusen takk for at dere reddet Snøfall! Åpne gullkonvolutten under juletreet (J-U-L-E) og legg til siste del her på Kanal 3: M - A - G - I!",
    codeHint:
      "Under juletreet (J-U-L-E) + Snøfall TV Kanal 3 (M-A-G-I) = JULEMAGI",
    recommendedChannel: 3,
    segmentTag: "CAM 03: JULAFTEN FINALE",
    teletextCode: "J-U-L-E + M-A-G-I",
    teletextDiagram: "🎅🛷✨ [JULETRE: JULE] + [KANAL 3: MAGI] = JULEMAGI!",
  },
];

const SPEAKER_META: Record<
  SpeakerId,
  {
    name: string;
    role: string;
    feedImage: string;
    colorClass: string;
    tintStyle: string;
  }
> = {
  JULIUS: {
    name: "JULIUS",
    role: "Julebrev-sjef & Julenisse",
    feedImage: "/feed/julius-kontor.png",
    colorClass: "text-(--gold)",
    tintStyle: "contrast(1.08) saturate(1.1) brightness(0.95)",
  },
  IQ: {
    name: "IQ",
    role: "Sjefsingeniør i Snøfall",
    feedImage: "/feed/iq-verksted.png",
    colorClass: "text-(--neon-green)",
    tintStyle: "contrast(1.15) saturate(1.15) brightness(0.92)",
  },
  ORAKELET: {
    name: "ORAKELET",
    role: "Vokter av Nordlyset",
    feedImage: "/feed/antenne-tarn.png",
    colorClass: "text-(--cold-blue)",
    tintStyle: "hue-rotate(-10deg) contrast(1.2) brightness(0.9)",
  },
  WINTER: {
    name: "WINTER",
    role: "Speider & Brevfugl-pilot",
    feedImage: "/feed/snøfall-day.png",
    colorClass: "text-(--neon-green)",
    tintStyle: "contrast(1.12) brightness(0.9)",
  },
};

const KULDE_INTERCEPTS: Record<
  number,
  { title: string; transcript: string; telemetry: string }
> = {
  3: {
    title: "ISKRYSTALL-INFeksjon PÅ LINJEN",
    transcript:
      "DERE SER MEG IKKE ENNÅ, LANDÅS... Men is-krystallene mine vokser allerede langs kablene fra Nordpolen. Snart fryser jeg både bildet og fargene deres!",
    telemetry: "85.0 MHz // KRYSTALLGROTTEN SEKTOR 01 // PRISME-BLOKKERING",
  },
  7: {
    title: "KODENAVN: KULDE ER VÅKNET",
    transcript:
      "90.0 MHz TILHØRER MEG NÅ! Jeg har frosset ned Rampenissens utstyr og lagt is rundt antennetårnet i Snøfall. Dere klarer aldri å stave navnet mitt i tide!",
    telemetry: "85.0 MHz // KRYSTALLGROTTEN HOVEDSENDER // -42.8°C",
  },
  10: {
    title: "FARGESPEKTERET SKAL SLUKKES",
    transcript:
      "Rødt, grønt og gull? Hvorfor trenger dere farger når alt kan være kaldt, stille og grått? Jeg suger fargene ut av Snøfall TV én etter én!",
    telemetry: "85.0 MHz // KROMATISK DRENERING AKTIV // MONOKROM LÅS",
  },
  11: {
    title: "TOTAL BLOKKERING AV NORDTOPPEN",
    transcript:
      "SKURR... Hovedsenderen på 90 MHz er begravd i min snøstorm! Uten nødfrekvensen deres er Snøfall helt isolert fra Bergen!",
    telemetry: "85.0 MHz // JAMMING- EFFEKT 98% // NØDLINK UKJENT",
  },
  13: {
    title: "SKYGGEN FRA KRYSTALLGROTTEN",
    transcript:
      "Ser dere meg mellom istappene på 85.0 MHz? Selv om Lucia-lyset deres blafret i mørket, ruger jeg over hele frekvensbåndet fra Nordtoppen!",
    telemetry: "85.0 MHz // KRYSTALLGROTTEN DYPSONE // SKYGGE-DETEKSJON",
  },
  16: {
    title: "KAOS I PAKKESENTRALEN",
    transcript:
      "Jeg snudde samlebåndet til Winter og IQ! Tog, bamser og klosser ligger strødd i et eneste rot. Ingen pakker kommer frem til julaften!",
    telemetry: "85.0 MHz // LOGISTIKK-SABOTASJE // SORTERINGS-LÅS",
  },
  21: {
    title: "SISTE ANGREP MOT BRANNMUREN",
    transcript:
      "NÅ FRYSER JEG SKJERMEN DERES PÅ LANDÅS! Med mindre alle tre søsknene bygger muren og renser bærebølgene mine, forblir Snøfall frosset for alltid!",
    telemetry: "85.0 MHz // MAKSIMAL KRYO-IMPULS // BRANNMUR KRITISK",
  },
};

interface TVScenarioExample {
  id: string;
  label: string;
  channel: ChannelId;
  day: number;
  sightingNote: string;
  lensMode?: "standard" | "prisme" | "radar" | "nordlys";
  fuses?: [boolean, boolean, boolean];
  boilerHot?: boolean;
  centrifugeSpinning?: boolean;
  pressureTurbo?: boolean;
  pirateIntercept?: boolean;
  showTeletext?: boolean;
  frequencyMhz?: number;
  showCam4Hud?: boolean;
}

const TV_SCENARIO_EXAMPLES: TVScenarioExample[] = [
  {
    id: "torget-vinter",
    label: "🏮 Torget: Vinter-patrulje",
    channel: 1,
    day: 1,
    lensMode: "standard",
    sightingNote:
      "OBSERVASJON: Varmt lykteskjær glir over snøtorget mens skygger beveger seg bak de opplyste tømmervinduene.",
  },
  {
    id: "ulriken-brevfugl",
    label: "🦅 Ulriken: Brevfugl-flukt",
    channel: 1,
    day: 5,
    lensMode: "radar",
    sightingNote:
      "OBSERVASJON: Luftrumsradaren fanger et varmt optisk ekko i lav høyde over fjellkammen på kurs mot Ulriken.",
  },
  {
    id: "lab-iq-nattskift",
    label: "⚡ Lab: IQ på nattskift",
    channel: 2,
    day: 2,
    fuses: [true, true, true],
    boilerHot: false,
    centrifugeSpinning: false,
    pressureTurbo: false,
    sightingNote:
      "OBSERVASJON: Blåhvite loddeglimt reflekteres i kobberrørene mens IQs skygge faller over arbeidsbenken.",
  },
  {
    id: "lab-karamell-damp",
    label: "🧪 Lab: Karamell & Sentrifuge",
    channel: 2,
    day: 15,
    fuses: [true, true, true],
    boilerHot: true,
    centrifugeSpinning: true,
    pressureTurbo: true,
    sightingNote:
      "OBSERVASJON: Organisk damp slører linsen over kobberkolben mens sentrifugen gløder på høyt turtall.",
  },
  {
    id: "kontor-julius-katt",
    label: "📖 Kontor: Julius & Krøniken",
    channel: 3,
    day: 1,
    pirateIntercept: false,
    showTeletext: false,
    sightingNote:
      "OBSERVASJON: Varm peisglød, støvkorn i lyskjeglen og damp fra gløggkoppen ved den åpne Snøfall-krøniken.",
  },
  {
    id: "grotte-kulde-skygge",
    label: "❄️ 85.0 MHz: Kuldes Spøkelsesbilde",
    channel: 3,
    day: 13,
    pirateIntercept: true,
    showTeletext: false,
    sightingNote:
      "OBSERVASJON: Analogt dobbelteksponert spøkelsesbilde (RF multipath) fra Krystallgrotten blør gjennom billedrøret på 85.0 MHz.",
  },
  {
    id: "himmel-slede-nordlys",
    label: "🌌 Himmel: Slede i Nordlys",
    channel: 1,
    day: 17,
    lensMode: "nordlys",
    sightingNote:
      "OBSERVASJON: Polarstrålen danser over Snøfall mens Rudolfs røde ledeglimt og stjernesporet krysser nattehimmelen.",
  },
  {
    id: "tarn-storm-tekniker",
    label: "📡 Tårn: Storm & Spøkelsesbølge",
    channel: 4,
    day: 11,
    frequencyMhz: 90,
    showCam4Hud: false,
    sightingNote:
      "OBSERVASJON: Roterende varsellys i snøstormen på Nordtoppen mens Krystallgrottens spøkelsesekko forvrenger bærebølgen.",
  },
];

/**
 * Real-time HTML5 Canvas overlay that generates authentic analog CRT/VHS noise:
 * - Per-pixel RF snow static
 * - Rolling VHS tracking distortion bar
 * - Occasional horizontal sync tear lines & chromatic glitch flashes
 */
function AnalogTVOverlayCanvas({
  staticLevel,
  isSwitching,
  isKuldeActive,
  isVHSMode,
  onGlitchSpike,
}: {
  staticLevel: number; // 0.05 to 1.0
  isSwitching: boolean;
  isKuldeActive: boolean;
  isVHSMode: boolean;
  onGlitchSpike?: (scale: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 320;
    const height = 180;
    canvas.width = width;
    canvas.height = height;

    const imageData = ctx.createImageData(width, height);
    const buf32 = new Uint32Array(imageData.data.buffer);

    let trackingY = Math.random() * height;
    let trackingY2 = (trackingY + height * 0.45) % height;
    let frameCount = 0;
    let animId = 0;
    let lastTime = 0;

    const render = (timestamp: number) => {
      animId = requestAnimationFrame(render);
      // Target ~24fps for authentic analog broadcast cadence
      if (timestamp - lastTime < 40) return;
      lastTime = timestamp;
      frameCount++;

      const effectiveStatic = isSwitching
        ? 0.88
        : Math.min(
            0.75,
            staticLevel + (isKuldeActive ? 0.16 : 0) + (isVHSMode ? 0.04 : 0),
          );

      // Periodic random horizontal tear / glitch spike
      const randomSpike =
        isSwitching ||
        (isKuldeActive && frameCount % 19 === 0) ||
        frameCount % 67 === 0 ||
        (frameCount % 31 === 0 && Math.random() < 0.35);

      if (onGlitchSpike) {
        if (isSwitching) {
          onGlitchSpike(28);
        } else if (randomSpike) {
          onGlitchSpike(isKuldeActive ? 18 : 9);
        } else {
          onGlitchSpike(0);
        }
      }

      trackingY = (trackingY + (isVHSMode ? 1.4 : 0.9)) % height;
      trackingY2 = (trackingY2 + 0.55) % height;

      const tearY = randomSpike ? Math.floor(Math.random() * height) : -100;
      const tearHeight = randomSpike ? 6 + Math.floor(Math.random() * 16) : 0;

      // Fill pixel buffer with sparse analog RF snow + tracking bands
      for (let y = 0; y < height; y++) {
        const distTrack1 = Math.abs(y - trackingY);
        const distTrack2 = Math.abs(y - trackingY2);
        const inTrackBar =
          distTrack1 < (isVHSMode ? 7 : 4) || (isKuldeActive && distTrack2 < 5);
        const inTearBar = y >= tearY && y <= tearY + tearHeight;
        const inBottomVHSHead = isVHSMode && y > height - 6;

        let rowDensity = effectiveStatic * 0.22;
        if (inTrackBar) rowDensity = Math.min(0.85, effectiveStatic * 0.95);
        if (inTearBar) rowDensity = 0.75;
        if (inBottomVHSHead) rowDensity = 0.8;

        const rowOffset = y * width;
        for (let x = 0; x < width; x++) {
          if (Math.random() < rowDensity) {
            const luma = 150 + ((Math.random() * 105) | 0);
            const alpha = isSwitching
              ? 180 + ((Math.random() * 75) | 0)
              : inTearBar || inBottomVHSHead
                ? 140
                : inTrackBar
                  ? 95
                  : (effectiveStatic * 75) | 0;

            // Subtle cyan/ice tint when Kulde interference is active
            const r = isKuldeActive && inTearBar ? luma >> 1 : luma;
            const g = luma;
            const b = luma;

            buf32[rowOffset + x] = (alpha << 24) | (b << 16) | (g << 8) | r;
          } else {
            buf32[rowOffset + x] = 0;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Draw crisp horizontal sync tear line when spiking
      if (randomSpike) {
        ctx.fillStyle = isKuldeActive
          ? "rgba(0, 221, 255, 0.28)"
          : "rgba(255, 255, 255, 0.22)";
        ctx.fillRect(0, tearY, width, 2);
      }

      // VHS bottom head-switching line
      if (isVHSMode) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.fillRect(
          Math.floor(Math.random() * 14),
          height - 4,
          width - Math.floor(Math.random() * 20),
          2,
        );
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [staticLevel, isSwitching, isKuldeActive, isVHSMode, onGlitchSpike]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-25 mix-blend-screen"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export function SnøfallTV({ onClose, currentDay: propDay }: SnøfallTVProps) {
  const initialDay = Math.max(1, Math.min(24, propDay ?? getCurrentDay()));
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);

  const currentVlog =
    VLOG_ENTRIES.find((entry) => entry.day === selectedDay) ?? VLOG_ENTRIES[0];

  const [activeChannel, setActiveChannel] = useState<ChannelId>(1);
  const [activeScenarioId, setActiveScenarioId] =
    useState<string>("torget-vinter");
  const [isSwitchingChannel, setIsSwitchingChannel] = useState(false);
  const [glitchScale, setGlitchScale] = useState(0);
  const [currentTime, setCurrentTime] = useState(getCurrentDate());

  // CAM 1 optical overlay modes (Prism / Radar / Aurora)
  const [cam1LensMode, setCam1LensMode] = useState<
    "standard" | "prisme" | "radar" | "nordlys"
  >("standard");

  // CAM 2 lab equipment states (aligned to /feed/iq-verksted.png)
  const [fuses, setFuses] = useState<[boolean, boolean, boolean]>([
    true,
    false,
    true,
  ]);
  const [boilerHot, setBoilerHot] = useState(false);
  const [centrifugeSpinning, setCentrifugeSpinning] = useState(false);
  const [pressureTurbo, setPressureTurbo] = useState(false);

  // CAM 3 VHS & Teletext states
  const [charIndex, setCharIndex] = useState(0);
  const [showTeletext, setShowTeletext] = useState(false);
  const [pirateIntercept, setPirateIntercept] = useState(false);
  const [vhsFrameCounter, setVhsFrameCounter] = useState(0);

  const activeKuldeIntercept = KULDE_INTERCEPTS[selectedDay] || {
    title: "KRYPTERT BÆREBØLGE FRA KRYSTALLGROTTEN",
    transcript:
      "SKURR... 85.0 MHz... Is-krystallene mine vokser seg sterkere i skyggene under Snøfall. Hver eneste kode dere nøler med gjør vintermørket dypere!",
    telemetry: `85.0 MHz // KRYSTALLGROTTEN // DAG ${selectedDay} INTERFERENS`,
  };

  // CAM 4 Antenna & HUD states
  const [frequencyMhz, setFrequencyMhz] = useState<number>(
    initialDay === 11 ? 75 : initialDay === 12 ? 100 : 90,
  );
  const [showCam4Hud, setShowCam4Hud] = useState(false);
  const [activeMiniGame, setActiveMiniGame] = useState<MiniGameId>("kretskort");

  // Technical calibration states inside CAM 4 HUD
  const [circuitNodes, setCircuitNodes] = useState<boolean[]>([
    true,
    false,
    false,
    true,
    false,
    false,
  ]);
  const [sorterStep, setSorterStep] = useState(0);
  const [sleighLane, setSleighLane] = useState<0 | 1 | 2>(1);
  const [sleighProgress, setSleighProgress] = useState(40);
  const [zapperLocks, setZapperLocks] = useState<[boolean, boolean, boolean]>([
    false,
    false,
    false,
  ]);

  // Weather & time calculations from weather-config
  const todayWeather = getWeatherForDay(selectedDay);
  const morketIntensity = getMorketIntensity(selectedDay);
  const crisisStatus = GameEngine.getCrisisStatus();
  const isAntennaCrisis =
    selectedDay === 11 && !crisisStatus.antenna && frequencyMhz !== 75;

  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();
  const totalMinutes = hour * 60 + minute;
  const isDaytime = totalMinutes >= 8 * 60 && totalMinutes < 17 * 60;

  const sunProgress = getSunProgress(currentTime);
  const moonProgress = getMoonProgress(currentTime);
  const twilightPhase = getTwilightPhase(currentTime);

  const baseImage = getBaseImage(todayWeather.condition, isDaytime);
  const brightness = getTwilightBrightness(currentTime, isDaytime);
  const hueRotate = getTwilightHueRotate(currentTime);
  const particleCount = getParticleCount(todayWeather.condition);
  const staticIntensity = getStaticIntensity(
    todayWeather.condition,
    isAntennaCrisis,
  );

  // Live clock + VHS frame counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentDate());
      setVhsFrameCounter((prev) => (prev + 1) % 3600);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeTranscript = pirateIntercept
    ? activeKuldeIntercept.transcript
    : currentVlog.transcript;

  // Typewriter subtitle effect on CAM 3
  useEffect(() => {
    const interval = setInterval(() => {
      setCharIndex((prev) => {
        if (prev >= activeTranscript.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 2;
      });
    }, 28);
    return () => clearInterval(interval);
  }, [selectedDay, activeTranscript, pirateIntercept]);

  const triggerChannelSwitchEffect = useCallback(() => {
    setIsSwitchingChannel(true);
    setTimeout(() => {
      setIsSwitchingChannel(false);
    }, 320);
  }, []);

  const handleChannelSelect = (channel: ChannelId) => {
    if (channel === activeChannel) return;
    SoundManager.playSound("click");
    triggerChannelSwitchEffect();
    setActiveChannel(channel);
  };

  const handleDaySelect = (day: number) => {
    const clamped = Math.max(1, Math.min(24, day));
    SoundManager.playSound("click");
    triggerChannelSwitchEffect();
    setCharIndex(0);
    setPirateIntercept(false);
    setSelectedDay(clamped);

    // Automatically set lens mode on CAM 1 for special visual days
    if (clamped === 3 || clamped === 10) {
      setCam1LensMode("prisme");
    } else if (clamped === 5 || clamped === 14) {
      setCam1LensMode("radar");
    } else if (clamped === 17) {
      setCam1LensMode("nordlys");
    } else {
      setCam1LensMode("standard");
    }

    if (clamped === 11) setFrequencyMhz(75);
    else if (clamped === 12) setFrequencyMhz(100);
    else if (clamped === 7) setFrequencyMhz(90);
  };

  const handleScenarioSelect = (scenario: TVScenarioExample) => {
    SoundManager.playSound("click");
    triggerChannelSwitchEffect();
    setActiveScenarioId(scenario.id);
    setActiveChannel(scenario.channel);
    setSelectedDay(scenario.day);
    setCharIndex(0);

    if (scenario.lensMode) setCam1LensMode(scenario.lensMode);
    if (scenario.fuses) setFuses(scenario.fuses);
    if (typeof scenario.boilerHot === "boolean")
      setBoilerHot(scenario.boilerHot);
    if (typeof scenario.centrifugeSpinning === "boolean")
      setCentrifugeSpinning(scenario.centrifugeSpinning);
    if (typeof scenario.pressureTurbo === "boolean")
      setPressureTurbo(scenario.pressureTurbo);
    if (typeof scenario.pirateIntercept === "boolean")
      setPirateIntercept(scenario.pirateIntercept);
    if (typeof scenario.showTeletext === "boolean")
      setShowTeletext(scenario.showTeletext);
    if (typeof scenario.frequencyMhz === "number")
      setFrequencyMhz(scenario.frequencyMhz);
    if (typeof scenario.showCam4Hud === "boolean")
      setShowCam4Hud(scenario.showCam4Hud);
  };

  const activeScenario =
    TV_SCENARIO_EXAMPLES.find((s) => s.id === activeScenarioId) ??
    TV_SCENARIO_EXAMPLES[0];

  const handleGlitchSpike = useCallback((scale: number) => {
    setGlitchScale(scale);
  }, []);

  const getWeatherIcon = (condition: WeatherCondition) => {
    switch (condition) {
      case "clear":
        return <Icons.Sun size={14} color="green" />;
      case "light-snow":
      case "snow":
      case "heavy-snow":
        return <Icons.Snow size={14} color="green" />;
      case "storm":
        return <Icons.Cloud size={14} color="green" />;
      case "darkness":
        return <Icons.Moon size={14} color="blue" />;
    }
  };

  const getWeatherLabel = (condition: WeatherCondition) => {
    const labels: Record<WeatherCondition, string> = {
      clear: "KLART",
      "light-snow": "LETT SNØ",
      snow: "SNØ",
      "heavy-snow": "TUNG SNØ",
      storm: "STORM",
      darkness: "KULDE-SKYGGE",
    };
    return labels[condition];
  };

  const totalVoltage =
    (fuses[0] ? 12 : 0) + (fuses[1] ? 16 : 0) + (fuses[2] ? 20 : 0);
  const allCircuitConnected = circuitNodes.every(Boolean);
  const allZapperLocked = zapperLocks.every(Boolean);
  const isKuldeInterference =
    (selectedDay >= 7 && selectedDay <= 20 && !allZapperLocked) ||
    (activeChannel === 4 && frequencyMhz === 90);

  const speakerInfo = SPEAKER_META[currentVlog.speaker];

  return (
    <RetroWindow
      title="SNØFALL TV - OVERVÅKNING & KRINGKASTING"
      onClose={onClose}
    >
      <div className="p-3 lg:p-5 h-full overflow-y-auto space-y-3 select-none">
        {/* Hidden SVG Filters for Real-Time Analog Horizontal Tearing, RF Multipath Ghosting & Vapor */}
        <svg className="hidden" aria-hidden="true">
          <defs>
            <filter
              id="tv-analog-displacement"
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.008 0.35"
                numOctaves="2"
                seed={vhsFrameCounter % 50}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={glitchScale}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
            <filter
              id="crt-ghost-anomaly"
              x="-15%"
              y="-15%"
              width="130%"
              height="130%"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.016 0.085"
                numOctaves="3"
                seed={(vhsFrameCounter >> 1) % 40}
                result="ghostNoise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="ghostNoise"
                scale={glitchScale > 0 ? 22 : 12}
                xChannelSelector="R"
                yChannelSelector="B"
              />
            </filter>
            <filter
              id="crt-vapor-wisp"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.028 0.055"
                numOctaves="2"
                seed={(vhsFrameCounter >> 2) % 30}
                result="vaporNoise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="vaporNoise"
                scale="10"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        {/* =====================================================================
            MAIN 16:9 CRT TELEVISION VIEWPORT (PURE VIDEO FEED + CAMERA OSD)
           ===================================================================== */}
        <div className="relative aspect-video bg-black border-4 border-(--neon-green) overflow-hidden shadow-[inset_0_0_90px_rgba(0,0,0,0.9)]">
          {/* Real-time HTML5 Canvas Analog RF Snow & VHS Tracking Engine */}
          <AnalogTVOverlayCanvas
            staticLevel={(staticIntensity - 0.8) * 0.7}
            isSwitching={isSwitchingChannel}
            isKuldeActive={isKuldeInterference}
            isVHSMode={activeChannel === 3}
            onGlitchSpike={handleGlitchSpike}
          />

          {/* Film grain & CRT scanline glass layers */}
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none z-20 animate-[grain-shift_0.18s_steps(4)_infinite]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grainFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.2' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grainFilter)'/%3E%3C/svg%3E")`,
              backgroundSize: "160px 160px",
            }}
          />

          {/* Fine CRT Horizontal Scanlines + Curved Tube Vignette + Glass Reflection */}
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.38) 0px,
                rgba(0, 0, 0, 0.38) 1px,
                transparent 1px,
                transparent 3px
              )`,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.45) 82%, rgba(0, 0, 0, 0.88) 100%)",
            }}
          />
          {/* Subtle curved CRT glass reflection streak */}
          <div
            className="absolute inset-0 pointer-events-none z-20 opacity-15"
            style={{
              background:
                "linear-gradient(125deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 18%, transparent 42%)",
            }}
          />

          {/* Kulde Crystalline Frost Vignette (Days 7-20 or Pirate Frequency) */}
          {(morketIntensity > 0 ||
            pirateIntercept ||
            (activeChannel === 4 && frequencyMhz === 85)) && (
            <div
              className="absolute inset-0 pointer-events-none z-22 transition-opacity duration-500"
              style={{
                opacity:
                  pirateIntercept ||
                  (activeChannel === 4 && frequencyMhz === 85)
                    ? 0.85
                    : Math.min(0.75, morketIntensity * 0.7),
                background:
                  "radial-gradient(ellipse at center, transparent 52%, rgba(0, 195, 255, 0.22) 80%, rgba(0, 225, 255, 0.55) 100%)",
                boxShadow: "inset 0 0 36px rgba(0, 221, 255, 0.45)",
              }}
            />
          )}

          {/* Analog RF Multipath Ghosting ("Spøkelsesbilde i Billedrøret") */}
          {(pirateIntercept ||
            (activeChannel === 4 &&
              (frequencyMhz === 85 || frequencyMhz === 90)) ||
            (glitchScale > 0 &&
              (morketIntensity > 0 ||
                selectedDay === 3 ||
                selectedDay === 13 ||
                selectedDay === 21)) ||
            selectedDay === 7 ||
            selectedDay === 13 ||
            selectedDay === 21) && (
            <div className="absolute inset-0 pointer-events-none z-21 overflow-hidden">
              {/* Layer 1: Horizontally Phase-Shifted Double-Exposure Echo of Kulde's Cavern */}
              <div
                className="absolute inset-0 mix-blend-screen transition-opacity duration-300"
                style={{
                  opacity:
                    glitchScale > 0
                      ? 0.46
                      : pirateIntercept ||
                          (activeChannel === 4 && frequencyMhz === 85)
                        ? 0.32
                        : 0.16,
                  transform: `translate(${glitchScale > 0 ? 14 : 7}px, -3px) scale(1.04)`,
                  filter:
                    "url(#crt-ghost-anomaly) hue-rotate(14deg) contrast(1.45) brightness(0.95)",
                }}
              >
                <Image
                  src="/feed/kulde-grotte.png"
                  alt="Analogt spøkelsesekko fra Krystallgrotten"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Layer 2: Turbulent Scanline-Interlaced Cryo-Pareidolia Anomaly in the Phosphor */}
              <div
                className="absolute inset-0 mix-blend-color-dodge"
                style={{
                  animation: "tv-kulde-lurk 11s ease-in-out infinite",
                  filter: "url(#crt-ghost-anomaly)",
                  background: `
                    radial-gradient(ellipse 16% 28% at 49% 43%, rgba(0, 235, 255, 0.24) 0%, rgba(0, 120, 210, 0.11) 48%, transparent 78%),
                    radial-gradient(circle at 46.5% 36.5%, rgba(185, 252, 255, 0.55) 0%, transparent 1.6%),
                    radial-gradient(circle at 51.5% 36.5%, rgba(185, 252, 255, 0.55) 0%, transparent 1.6%),
                    repeating-linear-gradient(0deg, rgba(0, 240, 255, 0.08) 0px, rgba(0, 240, 255, 0.08) 2px, transparent 2px, transparent 6px)
                  `,
                }}
              />
            </div>
          )}

          {/* Displaced Video Signal Container */}
          <div
            className={`absolute inset-0 transition-transform duration-75 ${
              isSwitchingChannel
                ? "scale-y-95 translate-y-2 brightness-150 contrast-200"
                : "animate-[tv-hsync-jitter_7s_infinite]"
            }`}
            style={{
              filter:
                glitchScale > 0
                  ? `url(#tv-analog-displacement) drop-shadow(${glitchScale > 12 ? "-4px" : "-2px"} 0 0 rgba(255,0,80,0.65)) drop-shadow(${glitchScale > 12 ? "4px" : "2px"} 0 0 rgba(0,225,255,0.65))`
                  : undefined,
            }}
          >
            {/* ===============================================================
                CHANNEL 1: SNØFALL LANDSBY (REAL PAINTERLY WEATHER FEED)
               =============================================================== */}
            {activeChannel === 1 && (
              <div className="absolute inset-0">
                {/* Top Weather Telemetry Overlay Bar */}
                <div className="absolute top-0 left-0 right-0 z-30 grid grid-cols-3 gap-2 p-2 bg-black/75 border-b border-(--neon-green)/30 backdrop-blur-[1px]">
                  <div className="px-2.5 py-1 border border-dashed border-(--neon-green)/40 bg-black/60 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-(--neon-green)/70">
                        TEMPERATUR
                      </div>
                      <div className="text-base font-bold text-(--neon-green) leading-tight">
                        {todayWeather.temperature}°C
                      </div>
                    </div>
                    <LEDIndicator
                      color={getTemperatureLEDColor(todayWeather.temperature)}
                    />
                  </div>

                  <div className="px-2.5 py-1 border border-dashed border-(--neon-green)/40 bg-black/60 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-(--neon-green)/70">
                        FORHOLD
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-(--neon-green)">
                        {getWeatherIcon(todayWeather.condition)}
                        <span>{getWeatherLabel(todayWeather.condition)}</span>
                      </div>
                    </div>
                    <LEDIndicator
                      color={
                        todayWeather.condition === "storm"
                          ? "red"
                          : todayWeather.condition === "darkness"
                            ? "blue"
                            : "green"
                      }
                    />
                  </div>

                  <div className="px-2.5 py-1 border border-dashed border-(--neon-green)/40 bg-black/60 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-(--neon-green)/70">
                        LINSESENSOR
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-(--gold)">
                        <span>{cam1LensMode.toUpperCase()}</span>
                      </div>
                    </div>
                    <LEDIndicator color="green" />
                  </div>
                </div>

                {/* Base Village Camera Image with slow motorized CCTV pan */}
                <div
                  className="absolute inset-0 animate-[tv-camera-pan_28s_ease-in-out_infinite]"
                  style={{
                    filter: `brightness(${brightness}) hue-rotate(${hueRotate}deg) contrast(1.06)`,
                  }}
                >
                  <Image
                    src={`/feed/snøfall-${baseImage}.png`}
                    alt="Snøfall landsby"
                    fill
                    className="object-cover"
                    priority
                  />

                  {/* Warm flickering glow inside village cabin windows */}
                  <div
                    className="absolute inset-0 mix-blend-screen pointer-events-none animate-[flicker_2.5s_infinite]"
                    style={{
                      background:
                        "radial-gradient(circle at 48.5% 78%, rgba(255, 190, 70, 0.35) 0%, transparent 12%), radial-gradient(circle at 25% 76%, rgba(255, 180, 60, 0.25) 0%, transparent 10%), radial-gradient(circle at 68% 76%, rgba(255, 180, 60, 0.25) 0%, transparent 10%)",
                    }}
                  />

                  {/* Subtle Interior Window Shadow Modulation (Elves moving behind lit cabin panes) */}
                  <div
                    className="absolute inset-0 mix-blend-multiply pointer-events-none"
                    style={{
                      animation: "tv-iq-tinker 18s ease-in-out infinite",
                      background:
                        "radial-gradient(ellipse 3.5% 5% at 48.5% 78%, rgba(10, 6, 4, 0.42) 0%, transparent 75%), radial-gradient(ellipse 3% 4.5% at 25.2% 76%, rgba(10, 6, 4, 0.35) 0%, transparent 75%)",
                    }}
                  />

                  {/* Organic Turbulence-Warped Chimney Vapor Wisps from the 3 Village Cabins */}
                  {[
                    { left: "25.5%", top: "58%", delay: "0s", dur: "7.5s" },
                    {
                      left: "48.8%",
                      top: "59.5%",
                      delay: "-2.8s",
                      dur: "8.2s",
                    },
                    {
                      left: "68.5%",
                      top: "58.5%",
                      delay: "-5.1s",
                      dur: "7.8s",
                    },
                  ].map((chimney, cIdx) => (
                    <div
                      key={`chimney-${cIdx}`}
                      className="absolute pointer-events-none mix-blend-screen"
                      style={{
                        left: chimney.left,
                        top: chimney.top,
                        width: "36px",
                        height: "52px",
                        marginLeft: "-18px",
                        filter: "url(#crt-vapor-wisp)",
                        animation: `tv-chimney-smoke ${chimney.dur} ${chimney.delay} ease-in-out infinite`,
                      }}
                    >
                      <div
                        className="w-full h-full blur-[5px]"
                        style={{
                          background:
                            "radial-gradient(ellipse 40% 70% at 50% 65%, rgba(215, 230, 250, 0.28) 0%, rgba(185, 205, 235, 0.12) 55%, transparent 85%)",
                        }}
                      />
                    </div>
                  ))}

                  {/* High-Altitude Optical Radar Glint & Trail (Radar Mode / Days 4, 5, 14) */}
                  {(cam1LensMode === "radar" ||
                    selectedDay === 4 ||
                    selectedDay === 5 ||
                    selectedDay === 14) && (
                    <div
                      className="absolute inset-x-12 top-[27%] h-8 pointer-events-none overflow-visible mix-blend-screen"
                      style={{
                        animation: "tv-sky-glide 24s linear infinite",
                      }}
                    >
                      <div
                        className="w-24 h-4 blur-[1.5px]"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent 0%, rgba(0, 255, 136, 0.18) 55%, rgba(255, 215, 90, 0.85) 92%, rgba(255, 255, 255, 0.95) 100%)",
                        }}
                      />
                    </div>
                  )}

                  {/* Distant Aurora Starlight & Rudolf Red-Beacon Trail (Nordlys Mode / Days 17+) */}
                  {(cam1LensMode === "nordlys" || selectedDay >= 17) && (
                    <div
                      className="absolute inset-x-8 top-[18%] h-8 pointer-events-none overflow-visible mix-blend-screen"
                      style={{
                        animation: "tv-sky-glide 32s linear infinite",
                      }}
                    >
                      <div
                        className="w-36 h-3 blur-[1.2px]"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent 0%, rgba(255, 215, 110, 0.22) 45%, rgba(255, 230, 150, 0.65) 85%, rgba(255, 50, 50, 0.95) 100%)",
                        }}
                      />
                    </div>
                  )}

                  {/* Warm Golden Lantern Light Pool Gliding Across the Snow Square */}
                  <div
                    className="absolute pointer-events-none mix-blend-screen"
                    style={{
                      left: "28%",
                      top: "76%",
                      width: "34%",
                      height: "12%",
                    }}
                  >
                    <div
                      className="w-20 h-10 relative"
                      style={{
                        animation: "tv-lantern-patrol 44s ease-in-out infinite",
                      }}
                    >
                      <div
                        className="absolute inset-0 rounded-full blur-[5px] animate-[flicker_1.8s_infinite]"
                        style={{
                          background:
                            "radial-gradient(ellipse at center, rgba(255, 215, 110, 0.62) 0%, rgba(255, 165, 55, 0.28) 50%, transparent 82%)",
                        }}
                      />
                      <div
                        className="absolute left-8 top-3 w-2.5 h-2.5 rounded-full blur-[1px]"
                        style={{
                          background:
                            "radial-gradient(circle, rgba(255, 245, 200, 0.9) 0%, rgba(255, 190, 70, 0.4) 70%, transparent 100%)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Celestial Bodies Layer (Sun & Moon) */}
                <div className="absolute inset-0 pointer-events-none">
                  {sunProgress >= 0 &&
                    todayWeather.condition !== "storm" &&
                    baseImage !== "storm" && (
                      <div
                        className="absolute"
                        style={{
                          left: `calc(50% + ${Math.cos((sunProgress - 0.5) * Math.PI) * 42}%)`,
                          top: `calc(26% - ${Math.sin(sunProgress * Math.PI) * 14}%)`,
                          opacity:
                            twilightPhase === "dawn"
                              ? sunProgress
                              : twilightPhase === "dusk"
                                ? 1 - sunProgress / 2
                                : 1,
                        }}
                      >
                        <div
                          className="absolute -ml-10 -mt-10 w-20 h-20 rounded-full blur-md"
                          style={{
                            background:
                              "radial-gradient(circle, rgba(255, 220, 100, 0.8) 0%, rgba(255, 180, 60, 0.35) 45%, transparent 70%)",
                          }}
                        />
                      </div>
                    )}

                  {moonProgress >= 0 &&
                    todayWeather.condition !== "storm" &&
                    baseImage !== "storm" && (
                      <div
                        className="absolute"
                        style={{
                          left: `calc(50% + ${Math.cos((moonProgress - 0.5) * Math.PI) * 38}%)`,
                          top: `calc(22% - ${Math.sin(moonProgress * Math.PI) * 11}%)`,
                          opacity: twilightPhase ? 0.35 : 0.85,
                        }}
                      >
                        <div
                          className="absolute -ml-7 -mt-7 w-14 h-14 rounded-full blur-sm"
                          style={{
                            background:
                              "radial-gradient(circle, rgba(200, 225, 255, 0.55) 0%, rgba(150, 185, 255, 0.2) 50%, transparent 70%)",
                          }}
                        />
                      </div>
                    )}
                </div>

                {/* Organic Aurora Borealis Curtains (Days 17, 21-24, or Nordlys lens mode) */}
                {(cam1LensMode === "nordlys" ||
                  selectedDay === 17 ||
                  selectedDay >= 21) && (
                  <div className="absolute inset-x-0 top-0 h-2/3 pointer-events-none mix-blend-screen overflow-hidden">
                    <div
                      className="w-full h-full blur-xl animate-[aurora-sway_9s_ease-in-out_infinite]"
                      style={{
                        background:
                          "radial-gradient(ellipse 90% 40% at 35% 28%, rgba(0, 255, 140, 0.48) 0%, rgba(0, 200, 255, 0.22) 45%, transparent 75%), radial-gradient(ellipse 80% 35% at 70% 22%, rgba(0, 255, 100, 0.42) 0%, rgba(140, 80, 255, 0.18) 50%, transparent 75%)",
                      }}
                    />
                  </div>
                )}

                {/* Optical Prism Lens Flare Dispersion (Days 3, 10 or Prisme lens mode) */}
                {(cam1LensMode === "prisme" ||
                  selectedDay === 3 ||
                  selectedDay === 10) && (
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-screen animate-pulse"
                    style={{
                      background:
                        "linear-gradient(115deg, transparent 20%, rgba(255, 50, 50, 0.28) 34%, rgba(255, 215, 0, 0.30) 44%, rgba(0, 255, 120, 0.28) 54%, rgba(0, 210, 255, 0.32) 64%, transparent 78%)",
                    }}
                  />
                )}

                {/* Bird/Airspace Tracking Radar HUD (Days 4, 5, 14 or Radar lens mode) */}
                {(cam1LensMode === "radar" ||
                  selectedDay === 4 ||
                  selectedDay === 5 ||
                  selectedDay === 14) && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    {/* Animated target reticle tracking across the mountain sky */}
                    <div
                      className="absolute w-24 h-24 border border-(--neon-green)/70 flex items-center justify-center transition-all duration-1000"
                      style={{
                        left: `${32 + ((vhsFrameCounter * 3) % 38)}%`,
                        top: `${24 + Math.sin(vhsFrameCounter * 0.4) * 6}%`,
                      }}
                    >
                      <div className="w-2 h-2 bg-(--gold) rounded-full animate-ping" />
                      <div className="absolute -bottom-5 left-0 bg-black/80 px-1.5 py-0.5 text-[10px] text-(--neon-green) whitespace-nowrap border border-(--neon-green)/50">
                        {selectedDay === 5
                          ? "MÅL: VMSJLFO (-1)"
                          : selectedDay === 14
                            ? "BREVFUGL: A-M-I"
                            : "RUDOLF: A-S-S"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Kulde / Darkness Vignette Overlay (Days 7-20) */}
                {morketIntensity > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at center, rgba(10, 25, 65, ${morketIntensity * 0.55}) 0%, rgba(5, 10, 35, ${morketIntensity * 0.9}) 75%)`,
                      mixBlendMode: "multiply",
                    }}
                  />
                )}

                {/* 3-Layer Depth-of-Field Snowfall System */}
                {particleCount > 0 && (
                  <div className="absolute inset-0 pointer-events-none z-15">
                    {/* Background slow blurred snow */}
                    <div className="absolute inset-0 blur-[1px]">
                      {Array.from({
                        length: Math.floor(particleCount * 0.35),
                      }).map((_, i) => {
                        const xStart = (i * 17 + Math.sin(i) * 20) % 100;
                        const xEnd = xStart + Math.cos(i) * 4;
                        const size = 1.5 + (i % 3) * 0.6;
                        const duration = 9 + (i % 6) * 1.8;
                        const delay = -(i * 0.4) % duration;
                        return (
                          <div
                            key={`snow-bg-${i}`}
                            className="absolute bg-white rounded-full"
                            style={
                              {
                                width: `${size}px`,
                                height: `${size}px`,
                                left: `${xStart}%`,
                                opacity: 0.35 + (i % 5) * 0.06,
                                animation: `snowfall ${duration}s ${delay}s linear infinite`,
                                "--x-start": `${xStart}vw`,
                                "--x-mid": `${xStart + Math.sin(i * 2) * 2}vw`,
                                "--x-end": `${xEnd}vw`,
                              } as React.CSSProperties
                            }
                          />
                        );
                      })}
                    </div>

                    {/* Foreground sharp snow */}
                    <div className="absolute inset-0">
                      {Array.from({
                        length: Math.floor(particleCount * 0.45),
                      }).map((_, i) => {
                        const xStart = (i * 11 + Math.sin(i * 2.5) * 12) % 100;
                        const xEnd = xStart + Math.cos(i * 2) * 6;
                        const size = 2.5 + (i % 4) * 0.9;
                        const duration = 4 + (i % 4) * 1.3;
                        const delay = -(i * 0.25) % duration;
                        return (
                          <div
                            key={`snow-fg-${i}`}
                            className="absolute bg-white rounded-full"
                            style={
                              {
                                width: `${size}px`,
                                height: `${size}px`,
                                left: `${xStart}%`,
                                opacity: 0.65 + (i % 4) * 0.08,
                                boxShadow: "0 0 4px rgba(255,255,255,0.85)",
                                animation: `snowfall ${duration}s ${delay}s linear infinite`,
                                "--x-start": `${xStart}vw`,
                                "--x-mid": `${xStart + Math.sin(i * 4) * 4}vw`,
                                "--x-end": `${xEnd}vw`,
                              } as React.CSSProperties
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Blizzard Whiteout */}
                {todayWeather.condition === "storm" && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse 120% 100% at 50% 30%, rgba(255, 255, 255, 0.45) 0%, rgba(210, 230, 255, 0.22) 50%, transparent 80%)",
                    }}
                  />
                )}

                {/* Camera OSD Readout (Bottom Bar) */}
                <div className="absolute bottom-2 left-2 right-2 z-30 flex items-end justify-between pointer-events-none">
                  <div className="bg-black/80 border border-(--neon-green)/60 px-2.5 py-1.5 max-w-md">
                    <div className="flex items-center gap-2 text-[11px] text-(--christmas-red) font-mono">
                      <span className="w-2 h-2 rounded-full bg-(--christmas-red) animate-pulse" />
                      <span className="text-(--neon-green) font-bold">
                        CAM 01 - SNØFALL LANDSBY
                      </span>
                      <span className="text-(--gold)">
                        | DAG {selectedDay}/24
                      </span>
                    </div>
                    <div className="text-xs text-(--neon-green)/90 mt-0.5">
                      {cam1LensMode === "prisme"
                        ? "OPTISK PRISME AKTIVT: P-R-I + S-M-E = PRISME | S-P-E-K + T-E-R = SPEKTER"
                        : cam1LensMode === "radar"
                          ? "LUFTRUMSRADAR: VMSJLFO (-1 = ULRIKEN) | O-R-I-G + A-M-I | K-O-M-P + A-S-S"
                          : cam1LensMode === "nordlys"
                            ? "POLARSTRÅLE LÅST: N-O-R-D + L-Y-S = NORDLYS!"
                            : todayWeather.description}
                    </div>
                  </div>

                  <div className="bg-black/80 border border-(--neon-green)/60 px-2.5 py-1 text-right font-mono">
                    <div className="text-[11px] text-(--neon-green)">
                      {currentTime.toLocaleTimeString("no-NO", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </div>
                    <div className="text-[10px] text-(--gold)">
                      {currentVlog.teletextCode}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                CHANNEL 2: IQS VERKSTED-LAB (REAL PAINTERLY LAB FEED + LIVE LIGHTS)
               =============================================================== */}
            {activeChannel === 2 && (
              <div className="absolute inset-0">
                {/* Base Painterly Workshop Feed with subtle camera drift */}
                <div className="absolute inset-0 animate-[tv-camera-pan_34s_ease-in-out_infinite]">
                  <Image
                    src="/feed/iq-verksted.png"
                    alt="IQs Verksted-Lab"
                    fill
                    className="object-cover"
                    style={{
                      filter: `brightness(${0.55 + (totalVoltage / 48) * 0.55}) contrast(1.08)`,
                    }}
                    priority
                  />

                  {/* Live Falling Snow Clipped Inside the Workshop Arched Window! */}
                  <div
                    className="absolute overflow-hidden pointer-events-none opacity-80"
                    style={{
                      left: "57.2%",
                      top: "23%",
                      width: "14.2%",
                      height: "35.5%",
                      borderRadius: "45% 45% 0 0",
                    }}
                  >
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div
                        key={`win-snow-${i}`}
                        className="absolute bg-white rounded-full"
                        style={
                          {
                            width: `${2 + (i % 2)}px`,
                            height: `${2 + (i % 2)}px`,
                            left: `${(i * 19) % 100}%`,
                            opacity: 0.7,
                            animation: `snowfall ${3 + (i % 3)}s -${i * 0.4}s linear infinite`,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                  </div>

                  {/* Live Oscilloscope CRT Waveform Aligned to IQ's Workbench Monitor */}
                  <div
                    className="absolute flex items-center justify-center overflow-hidden pointer-events-none"
                    style={{
                      left: "39.1%",
                      top: "52.8%",
                      width: "6.8%",
                      height: "10.6%",
                      borderRadius: "50%",
                    }}
                  >
                    <svg viewBox="0 0 100 60" className="w-full h-full">
                      <path
                        d={
                          totalVoltage === 48
                            ? "M 0 30 Q 12 4, 25 30 T 50 30 T 75 30 T 100 30"
                            : totalVoltage > 0
                              ? "M 0 30 Q 25 16, 50 30 T 100 30"
                              : "M 0 30 L 100 30"
                        }
                        fill="none"
                        stroke={totalVoltage === 48 ? "#ffd700" : "#00ff66"}
                        strokeWidth="3.5"
                      />
                    </svg>
                  </div>

                  {/* Dynamic Light Blooms over the Vacuum Tubes based on Fuses 1, 2, 3 */}
                  {/* Fuse 1 (12V Red Tubes) */}
                  {fuses[0] && (
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-screen animate-pulse"
                      style={{
                        background:
                          "radial-gradient(circle at 26.8% 72.5%, rgba(255, 50, 50, 0.55) 0%, transparent 8%), radial-gradient(circle at 40.4% 46.5%, rgba(255, 60, 60, 0.55) 0%, transparent 7%), radial-gradient(circle at 58.3% 64.5%, rgba(255, 60, 60, 0.5) 0%, transparent 7%)",
                      }}
                    />
                  )}

                  {/* Fuse 2 (16V Green Tubes) */}
                  {fuses[1] && (
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-screen animate-pulse"
                      style={{
                        background:
                          "radial-gradient(circle at 43.5% 46.5%, rgba(0, 255, 100, 0.6) 0%, transparent 8%), radial-gradient(circle at 62.1% 64.5%, rgba(0, 255, 100, 0.6) 0%, transparent 8%)",
                      }}
                    />
                  )}

                  {/* Fuse 3 (20V Warm Amber / Cyan High-Voltage Tubes) */}
                  {fuses[2] && (
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-screen animate-[flicker_1.8s_infinite]"
                      style={{
                        background:
                          "radial-gradient(circle at 70.6% 63%, rgba(255, 195, 70, 0.65) 0%, transparent 10%), radial-gradient(circle at 76.5% 64%, rgba(0, 221, 255, 0.45) 0%, transparent 9%)",
                      }}
                    />
                  )}

                  {/* Rising Steam / Caramel Glow over Left Copper Coils when Boiler is Active */}
                  {boilerHot && (
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-screen animate-pulse"
                      style={{
                        background:
                          "radial-gradient(circle at 31% 64%, rgba(255, 200, 50, 0.55) 0%, rgba(255, 120, 0, 0.25) 12%, transparent 22%)",
                      }}
                    />
                  )}

                  {/* High-Speed Centrifuge Glow over Right Coils */}
                  {centrifugeSpinning && (
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-screen animate-ping"
                      style={{
                        animationDuration: "1.5s",
                        background:
                          "radial-gradient(circle at 52% 61%, rgba(0, 255, 120, 0.45) 0%, transparent 15%)",
                      }}
                    />
                  )}

                  {/* Organic Turbulence-Warped Steam Plumes from Copper Boiler & Centrifuge Tubes */}
                  {[
                    {
                      left: "30.5%",
                      top: "47%",
                      delay: "0s",
                      dur: "5.8s",
                      opacity: boilerHot ? 0.85 : 0.42,
                      warm: boilerHot,
                    },
                    {
                      left: "51.5%",
                      top: "46%",
                      delay: "-2.6s",
                      dur: "6.4s",
                      opacity: centrifugeSpinning ? 0.8 : 0.36,
                      warm: false,
                    },
                  ].map((steam, idx) => (
                    <div
                      key={`lab-steam-${idx}`}
                      className="absolute pointer-events-none mix-blend-screen"
                      style={{
                        left: steam.left,
                        top: steam.top,
                        width: "48px",
                        height: "76px",
                        marginLeft: "-24px",
                        opacity: steam.opacity,
                        filter: "url(#crt-vapor-wisp)",
                        animation: `tv-chimney-smoke ${steam.dur} ${steam.delay} ease-in-out infinite`,
                      }}
                    >
                      <div
                        className="w-full h-full blur-[6px]"
                        style={{
                          background: steam.warm
                            ? "radial-gradient(ellipse 42% 72% at 50% 62%, rgba(255, 220, 145, 0.55) 0%, rgba(255, 175, 80, 0.22) 55%, transparent 85%)"
                            : "radial-gradient(ellipse 42% 72% at 50% 62%, rgba(205, 238, 255, 0.45) 0%, rgba(150, 210, 245, 0.18) 55%, transparent 85%)",
                        }}
                      />
                    </div>
                  ))}

                  {/* Off-Camera Workshop Life: Soft Cast Shadow Moving Across Workbench + Blue-White Micro-Soldering Arc Reflections */}
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-multiply"
                    style={{
                      animation: "tv-iq-tinker 18s ease-in-out infinite",
                      background:
                        "radial-gradient(ellipse 18% 32% at 48% 68%, rgba(6, 8, 12, 0.48) 0%, rgba(6, 8, 12, 0.22) 52%, transparent 82%)",
                    }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-screen animate-[flicker_2.1s_infinite]"
                    style={{
                      background:
                        "radial-gradient(circle at 54.5% 58.5%, rgba(165, 245, 255, 0.65) 0%, rgba(0, 195, 255, 0.22) 4.5%, transparent 11%), radial-gradient(circle at 46% 56%, rgba(255, 220, 130, 0.28) 0%, transparent 9%)",
                    }}
                  />
                </div>

                {/* Interactive Camera Target Brackets on the Fuse Boxes & Instruments */}
                <button
                  onClick={() => {
                    SoundManager.playSound("click");
                    setFuses(([f1, f2, f3]) => [!f1, f2, f3]);
                  }}
                  className="absolute z-30 px-2 py-1 bg-black/75 border border-(--christmas-red) text-[11px] text-(--christmas-red) hover:bg-(--christmas-red)/20 cursor-pointer"
                  style={{ left: "18%", top: "38%" }}
                >
                  [SIKRING 1: {fuses[0] ? "12V PÅ" : "AV"}]
                </button>

                <button
                  onClick={() => {
                    SoundManager.playSound("click");
                    setFuses(([f1, f2, f3]) => [f1, !f2, f3]);
                  }}
                  className="absolute z-30 px-2 py-1 bg-black/75 border border-(--neon-green) text-[11px] text-(--neon-green) hover:bg-(--neon-green)/20 cursor-pointer"
                  style={{ left: "38%", top: "33%" }}
                >
                  [SIKRING 2: {fuses[1] ? "16V PÅ" : "AV"}]
                </button>

                <button
                  onClick={() => {
                    SoundManager.playSound("click");
                    setFuses(([f1, f2, f3]) => [f1, f2, !f3]);
                  }}
                  className="absolute z-30 px-2 py-1 bg-black/75 border border-(--cold-blue) text-[11px] text-(--cold-blue) hover:bg-(--cold-blue)/20 cursor-pointer"
                  style={{ left: "73%", top: "38%" }}
                >
                  [SIKRING 3: {fuses[2] ? "20V PÅ" : "AV"}]
                </button>

                {/* Top Camera OSD Bar */}
                <div className="absolute top-2 left-2 right-2 z-30 flex items-center justify-between pointer-events-none">
                  <div className="bg-black/80 border border-(--neon-green)/60 px-2.5 py-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-(--christmas-red) animate-pulse" />
                    <span className="text-xs font-bold text-(--neon-green) font-mono">
                      CAM 02 - IQS VERKSTED-LAB
                    </span>
                  </div>
                  <div
                    className={`bg-black/85 border px-3 py-1 font-mono text-xs font-bold ${
                      totalVoltage === 48
                        ? "border-(--gold) text-(--gold)"
                        : "border-(--neon-green)/60 text-(--neon-green)"
                    }`}
                  >
                    SPENNING: {totalVoltage}V / 48V{" "}
                    {totalVoltage === 48 ? "✓ STABIL (KODE: 48)" : "[USTABIL]"}
                  </div>
                </div>

                {/* Bottom Lab Telemetry OSD */}
                <div className="absolute bottom-2 left-2 right-2 z-30 flex items-end justify-between pointer-events-none">
                  <div className="bg-black/85 border border-(--neon-green)/60 px-3 py-1.5 max-w-lg">
                    <div className="text-xs text-(--gold) font-bold">
                      {totalVoltage === 48
                        ? "⚡ HOVEDSTRØM 48 VOLT AKTIV! (Dag 2 kode: 48)"
                        : "⚡ Klikk på sikringsboksene i kamerabildet (12V + 16V + 20V)"}
                    </div>
                    <div className="text-[11px] text-(--neon-green)/90 mt-0.5">
                      {boilerHot
                        ? "🧪 KARAMELL-KOLBE 100°C: K-A-R-A + M-E-L-L = KARAMELL!"
                        : centrifugeSpinning
                          ? "🥕 GULROT-SENTRIFUGE: G-U-L + R-O-T = GULROT!"
                          : pressureTurbo
                            ? "🚀 OVERLYDS-TRYKK 9.8 BAR: T-U-R + B-O = TURBO!"
                            : "KOMPONENT-LAGER (DAG 8): KRETS + KORT = KRETSKORT"}
                    </div>
                  </div>
                  <div className="bg-black/80 border border-(--neon-green)/60 px-2.5 py-1 text-[11px] text-(--neon-green) font-mono">
                    TRYKK: {pressureTurbo ? "9.8 BAR [TURBO]" : "4.2 BAR"}
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                CHANNEL 3: JULIUS VIDEOLOGG (AUTHENTIC VHS CAMCORDER BROADCAST)
               =============================================================== */}
            {activeChannel === 3 && (
              <div className="absolute inset-0">
                {/* Full-Bleed Painterly Studio / Camcorder Feed (or Kulde Pirate Hijack) */}
                <div className="absolute inset-0 animate-[tv-camera-pan_24s_ease-in-out_infinite]">
                  <Image
                    src={
                      pirateIntercept
                        ? "/feed/kulde-grotte.png"
                        : speakerInfo.feedImage
                    }
                    alt={
                      pirateIntercept
                        ? "Kuldes Krystallgrotte"
                        : speakerInfo.name
                    }
                    fill
                    className="object-cover"
                    style={{
                      filter: pirateIntercept
                        ? "contrast(1.22) brightness(0.95) saturate(1.15)"
                        : speakerInfo.tintStyle,
                    }}
                    priority
                  />

                  {/* KULDE PIRATE HIJACK OVERLAYS (/feed/kulde-grotte.png) */}
                  {pirateIntercept && (
                    <>
                      {/* Pulsing Cyan Plasma in the 3 Frozen Vacuum Tubes (Bottom Right) */}
                      <div
                        className="absolute inset-0 pointer-events-none mix-blend-screen animate-pulse"
                        style={{
                          background:
                            "radial-gradient(circle at 75.5% 83%, rgba(0, 240, 255, 0.75) 0%, transparent 8%), radial-gradient(circle at 83% 76%, rgba(0, 225, 255, 0.7) 0%, transparent 8%), radial-gradient(circle at 92% 74%, rgba(0, 240, 255, 0.65) 0%, transparent 8%)",
                        }}
                      />
                      {/* Blinking Red/Cyan Telemetry LEDs on Frozen Transmitter Consoles */}
                      <div
                        className="absolute inset-0 pointer-events-none mix-blend-screen animate-[flicker_1.4s_infinite]"
                        style={{
                          background:
                            "radial-gradient(circle at 28% 62%, rgba(255, 40, 60, 0.55) 0%, transparent 9%), radial-gradient(circle at 70% 63%, rgba(0, 225, 255, 0.5) 0%, transparent 10%)",
                        }}
                      />

                      {/* Turbulent Cryo-Refraction & Phase-Shifted Ghost Anomaly in the Crystal Archway */}
                      <div
                        className="absolute inset-0 pointer-events-none mix-blend-color-dodge"
                        style={{
                          animation: "tv-kulde-lurk 9s ease-in-out infinite",
                          filter: "url(#crt-ghost-anomaly)",
                          background: `
                            radial-gradient(ellipse 14% 26% at 49.5% 44%, rgba(0, 240, 255, 0.42) 0%, rgba(0, 130, 215, 0.18) 52%, transparent 82%),
                            radial-gradient(circle at 47.5% 37%, rgba(210, 255, 255, 0.75) 0%, transparent 1.8%),
                            radial-gradient(circle at 51.5% 37%, rgba(210, 255, 255, 0.75) 0%, transparent 1.8%)
                          `,
                        }}
                      />
                    </>
                  )}

                  {/* JULIUS' TIMBER STUDY ENVIRONMENTAL ANIMATIONS (/feed/julius-kontor.png) */}
                  {!pirateIntercept && currentVlog.speaker === "JULIUS" && (
                    <>
                      {/* Live Falling Snow Clipped Inside Julius' Arched Timber Window */}
                      <div
                        className="absolute overflow-hidden pointer-events-none opacity-85"
                        style={{
                          left: "41.5%",
                          top: "14%",
                          width: "17%",
                          height: "40%",
                          borderRadius: "48% 48% 0 0",
                        }}
                      >
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div
                            key={`julius-snow-${i}`}
                            className="absolute bg-white rounded-full"
                            style={
                              {
                                width: `${2 + (i % 2)}px`,
                                height: `${2 + (i % 2)}px`,
                                left: `${(i * 17) % 100}%`,
                                opacity: 0.75,
                                animation: `snowfall ${3.2 + (i % 3)}s -${i * 0.35}s linear infinite`,
                              } as React.CSSProperties
                            }
                          />
                        ))}
                      </div>

                      {/* Warm Flickering Candle & Lantern Blooms */}
                      <div
                        className="absolute inset-0 pointer-events-none mix-blend-screen animate-[flicker_2.2s_infinite]"
                        style={{
                          background:
                            "radial-gradient(circle at 31.5% 24%, rgba(255, 195, 70, 0.5) 0%, transparent 10%), radial-gradient(circle at 70.8% 34.5%, rgba(255, 190, 65, 0.45) 0%, transparent 10%), radial-gradient(circle at 56.8% 50.5%, rgba(255, 200, 80, 0.5) 0%, transparent 8%), radial-gradient(circle at 86.5% 52.5%, rgba(255, 185, 60, 0.55) 0%, transparent 9%)",
                        }}
                      />

                      {/* Magical Golden Glow on Open Snøfall-krøniken Book on Desk */}
                      <div
                        className="absolute inset-0 pointer-events-none mix-blend-screen animate-pulse"
                        style={{
                          background:
                            "radial-gradient(ellipse 18% 12% at 48% 76%, rgba(255, 215, 90, 0.65) 0%, rgba(255, 170, 40, 0.25) 55%, transparent 85%)",
                        }}
                      />

                      {/* Organic Turbulence-Warped Steam from Julius' Warm Gløgg Mug on the Desk */}
                      <div
                        className="absolute pointer-events-none mix-blend-screen"
                        style={{
                          left: "61%",
                          top: "57%",
                          width: "36px",
                          height: "60px",
                          marginLeft: "-18px",
                          filter: "url(#crt-vapor-wisp)",
                          animation:
                            "tv-chimney-smoke 5.4s ease-in-out infinite",
                        }}
                      >
                        <div
                          className="w-full h-full blur-[5px]"
                          style={{
                            background:
                              "radial-gradient(ellipse 40% 70% at 50% 65%, rgba(255, 232, 185, 0.48) 0%, rgba(255, 195, 120, 0.18) 55%, transparent 85%)",
                          }}
                        />
                      </div>

                      {/* Subtle Off-Camera Fireplace & Candle Shadow Play Across the Timber Study */}
                      <div
                        className="absolute inset-0 pointer-events-none mix-blend-multiply"
                        style={{
                          animation: "tv-julius-study 14s ease-in-out infinite",
                          background:
                            "radial-gradient(ellipse 22% 38% at 18% 62%, rgba(18, 6, 2, 0.42) 0%, transparent 78%)",
                        }}
                      />

                      {/* Pulsing Audio Ring on Vintage Brass Desk Microphone while Speaking */}
                      {charIndex < activeTranscript.length && (
                        <div
                          className="absolute pointer-events-none"
                          style={{ left: "31.5%", top: "50%" }}
                        >
                          <div className="w-12 h-12 -ml-6 -mt-6 rounded-full border border-(--gold)/70 animate-ping" />
                        </div>
                      )}
                    </>
                  )}

                  {/* Warm fireplace / studio spotlight vignette */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: pirateIntercept
                        ? "radial-gradient(circle at 50% 45%, rgba(0, 210, 255, 0.15) 0%, rgba(0, 8, 22, 0.78) 85%)"
                        : currentVlog.speaker === "JULIUS"
                          ? "radial-gradient(circle at 50% 45%, rgba(255, 190, 80, 0.18) 0%, rgba(15, 5, 0, 0.6) 85%)"
                          : "radial-gradient(circle at 50% 45%, transparent 25%, rgba(0, 10, 15, 0.65) 85%)",
                    }}
                  />
                </div>

                {/* VHS Camcorder Viewfinder Framing Marks & Audio Waveform OSD */}
                <div className="absolute inset-0 pointer-events-none z-20 p-3 flex flex-col justify-between">
                  {/* Top VHS OSD Row */}
                  <div className="flex items-start justify-between font-mono">
                    <div
                      className={`bg-black/80 border px-2.5 py-1 space-y-0.5 ${
                        pirateIntercept
                          ? "border-(--cold-blue)"
                          : "border-white/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs text-white font-bold">
                        <span
                          className={
                            pirateIntercept
                              ? "text-(--cold-blue)"
                              : "text-(--neon-green)"
                          }
                        >
                          {pirateIntercept ? "PIRAT-INTERCEPT ▶" : "PLAY ▶"}
                        </span>
                        <span>
                          {pirateIntercept
                            ? "85.0 MHz KRYPTERT"
                            : "VHS HI-FI SP"}
                        </span>
                        <span className="text-(--christmas-red) animate-pulse">
                          ● LIVE
                        </span>
                      </div>
                      <div
                        className={`text-[11px] ${
                          pirateIntercept
                            ? "text-(--cold-blue)"
                            : "text-(--gold)"
                        }`}
                      >
                        KILDE:{" "}
                        {pirateIntercept
                          ? "KULDE (MØRKETS KRYSTALLGROTTE)"
                          : `${speakerInfo.name} (${currentVlog.locationLabel})`}
                      </div>
                    </div>

                    {/* Live Voice Modulation Oscilloscope Bar */}
                    <div
                      className={`bg-black/80 border px-3 py-1.5 flex items-center gap-2 ${
                        pirateIntercept
                          ? "border-(--cold-blue)/70"
                          : "border-(--neon-green)/50"
                      }`}
                    >
                      <span
                        className={`text-[10px] ${
                          pirateIntercept
                            ? "text-(--cold-blue)"
                            : "text-(--neon-green)"
                        }`}
                      >
                        {pirateIntercept ? "IS-MODULASJON:" : "LYD-MODULASJON:"}
                      </span>
                      <div className="flex items-end gap-0.5 h-4">
                        {Array.from({ length: 12 }).map((_, idx) => {
                          const isSpeaking =
                            charIndex < activeTranscript.length;
                          const barH = isSpeaking
                            ? 25 + ((vhsFrameCounter * 19 + idx * 31) % 75)
                            : 18;
                          return (
                            <div
                              key={idx}
                              className={`w-1 transition-all duration-75 ${
                                pirateIntercept
                                  ? "bg-(--cold-blue)"
                                  : "bg-(--neon-green)"
                              }`}
                              style={{ height: `${barH}%` }}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-black/80 border border-white/30 px-2.5 py-1 text-right">
                      <div className="text-xs text-white font-bold">
                        DAG {String(selectedDay).padStart(2, "0")} / 24
                      </div>
                      <div className="text-[11px] text-(--neon-green)">
                        TC 00:{String(selectedDay).padStart(2, "0")}:
                        {String(currentTime.getSeconds()).padStart(2, "0")}:
                        {String((vhsFrameCounter * 7) % 25).padStart(2, "0")}
                      </div>
                    </div>
                  </div>

                  {/* Center Camcorder Crosshair Reticle */}
                  <div className="self-center w-56 h-28 border border-white/15 relative flex items-center justify-center">
                    <div className="w-3 h-0.5 bg-white/30" />
                    <div className="h-3 w-0.5 bg-white/30 absolute" />
                    <div
                      className={`absolute -top-5 px-2 py-0.5 bg-black/75 text-[11px] font-mono ${
                        pirateIntercept
                          ? "text-(--cold-blue) border border-(--cold-blue)/50"
                          : "text-(--gold)"
                      }`}
                    >
                      {pirateIntercept
                        ? activeKuldeIntercept.title
                        : currentVlog.title.toUpperCase()}
                    </div>
                  </div>

                  {/* Authentic Nordic TV Broadcast Subtitles (Bottom Third) */}
                  <div
                    className={`mx-auto w-full max-w-3xl bg-black/88 border-y-2 px-4 py-2.5 text-center shadow-lg ${
                      pirateIntercept
                        ? "border-(--cold-blue)"
                        : "border-(--gold)/60"
                    }`}
                  >
                    <div
                      className={`text-[11px] font-mono uppercase tracking-wider mb-0.5 ${
                        pirateIntercept ? "text-(--cold-blue)" : "text-(--gold)"
                      }`}
                    >
                      {pirateIntercept
                        ? "[KULDE - PIRATSENDER 85.0 MHz]"
                        : `[${speakerInfo.name} - ${speakerInfo.role}]`}
                    </div>
                    <p className="text-sm lg:text-base text-white font-mono leading-snug">
                      «{activeTranscript.slice(0, charIndex)}»
                      {charIndex < activeTranscript.length && (
                        <span
                          className={`inline-block w-2 h-4 ml-1 animate-pulse ${
                            pirateIntercept ? "bg-(--cold-blue)" : "bg-(--gold)"
                          }`}
                        />
                      )}
                    </p>
                    <div
                      className={`mt-1.5 text-xs font-mono ${
                        pirateIntercept
                          ? "text-(--cold-blue)"
                          : "text-(--neon-green)"
                      }`}
                    >
                      {pirateIntercept
                        ? activeKuldeIntercept.telemetry
                        : `LEDETRÅD: ${currentVlog.codeHint}`}
                    </div>
                  </div>
                </div>

                {/* FULL-SCREEN TRANSPARENT NRK TEKST-TV OVERLAY (MIX MODE) */}
                {showTeletext && (
                  <div className="absolute inset-0 z-35 bg-black/88 p-4 lg:p-6 flex flex-col justify-between font-mono border-2 border-(--cold-blue)">
                    <div className="flex items-center justify-between border-b-2 border-(--cold-blue) pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-(--cold-blue) text-black font-bold text-xs">
                          P{300 + selectedDay}
                        </span>
                        <span className="text-sm text-(--gold) font-bold">
                          SNØFALL TEKST-TV // DAG {selectedDay}. DESEMBER
                        </span>
                      </div>
                      <span className="text-xs text-(--neon-green)">
                        {currentTime.toLocaleTimeString("no-NO")}
                      </span>
                    </div>

                    <div className="my-auto space-y-3 border-2 border-(--neon-green)/50 bg-black/90 p-4">
                      <div className="text-xs text-(--cold-blue)">
                        SEGMENT: {currentVlog.segmentTag} | TALER:{" "}
                        {speakerInfo.name}
                      </div>
                      <div className="text-base text-(--gold) font-bold">
                        {currentVlog.title}
                      </div>
                      <div className="p-3 bg-(--neon-green)/10 border border-(--neon-green) text-sm text-(--neon-green)">
                        {currentVlog.teletextDiagram}
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-white/80">
                          KODEFORMEL: {currentVlog.codeHint}
                        </span>
                        <span className="px-2 py-0.5 bg-(--gold) text-black font-bold">
                          {currentVlog.teletextCode}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold pt-2 border-t border-white/20">
                      <div className="bg-(--christmas-red) text-white py-1">
                        100 HOVEDSIDE
                      </div>
                      <div className="bg-(--neon-green) text-black py-1">
                        200 VÆRMELDING
                      </div>
                      <div className="bg-(--gold) text-black py-1">
                        {300 + selectedDay} DAGENS KODE
                      </div>
                      <div className="bg-(--cold-blue) text-black py-1">
                        400 FREKVENSER
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===============================================================
                CHANNEL 4: ANTENNETÅRN 90.0 MHz (REAL PAINTERLY TOWER + RF HUD)
               =============================================================== */}
            {activeChannel === 4 && (
              <div className="absolute inset-0">
                {/* Base Painterly Mountain Antenna Tower Feed */}
                <div className="absolute inset-0 animate-[tv-camera-pan_26s_ease-in-out_infinite]">
                  <Image
                    src="/feed/antenne-tarn.png"
                    alt="Snøfall Antennetårn"
                    fill
                    className="object-cover"
                    style={{
                      filter:
                        frequencyMhz === 90
                          ? "hue-rotate(-15deg) contrast(1.25) brightness(0.9)"
                          : frequencyMhz === 85
                            ? "hue-rotate(15deg) contrast(1.3) brightness(0.75)"
                            : frequencyMhz === 75
                              ? "contrast(1.1) brightness(1.05)"
                              : "contrast(1.1)",
                    }}
                    priority
                  />

                  {/* 85.0 MHz Cross-Modulated Pirate Signal from Kulde's Ice Cavern */}
                  {frequencyMhz === 85 && (
                    <div className="absolute inset-0 mix-blend-screen opacity-75 pointer-events-none">
                      <Image
                        src="/feed/kulde-grotte.png"
                        alt="Krystallgrotten 85.0 MHz"
                        fill
                        className="object-cover"
                      />
                      <div
                        className="absolute inset-0 animate-pulse"
                        style={{
                          background:
                            "radial-gradient(circle at 75.5% 83%, rgba(0, 240, 255, 0.75) 0%, transparent 9%), radial-gradient(circle at 83% 76%, rgba(0, 225, 255, 0.7) 0%, transparent 9%), radial-gradient(circle at 92% 74%, rgba(0, 240, 255, 0.65) 0%, transparent 9%)",
                        }}
                      />
                    </div>
                  )}

                  {/* Pulsing Red Aviation Beacon + Volumetric Sweeping Light Beam at Tower Peak (62.5%, 10.8%) */}
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-screen animate-pulse"
                    style={{
                      background:
                        "radial-gradient(circle at 62.5% 10.8%, rgba(255, 30, 30, 0.85) 0%, rgba(255, 0, 0, 0.28) 6%, transparent 15%)",
                    }}
                  />
                  <div
                    className="absolute pointer-events-none mix-blend-screen"
                    style={{
                      left: "62.5%",
                      top: "10.8%",
                      width: "220px",
                      height: "56px",
                      marginTop: "-28px",
                      transformOrigin: "0% 50%",
                      animation: "tv-beacon-sweep 9s ease-in-out infinite",
                      background:
                        "linear-gradient(90deg, rgba(255, 45, 45, 0.55) 0%, rgba(255, 30, 30, 0.18) 55%, transparent 100%)",
                      clipPath: "polygon(0 45%, 100% 0%, 100% 100%, 0 55%)",
                      filter: "blur(2px)",
                    }}
                  />

                  {/* Warm Relay Cabin Window Glow (72.3%, 65.5%) + Interior Shadow Modulation & Volumetric Inspection Beam */}
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-screen animate-[flicker_3s_infinite]"
                    style={{
                      background:
                        "radial-gradient(circle at 72.3% 65.5%, rgba(255, 190, 70, 0.55) 0%, transparent 11%)",
                    }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-multiply"
                    style={{
                      animation: "tv-iq-tinker 14s ease-in-out infinite",
                      background:
                        "radial-gradient(ellipse 3% 4.5% at 72.3% 65.5%, rgba(8, 5, 2, 0.45) 0%, transparent 75%)",
                    }}
                  />
                  <div
                    className="absolute pointer-events-none mix-blend-screen"
                    style={{
                      left: "56%",
                      top: "61%",
                      width: "140px",
                      height: "44px",
                      transformOrigin: "100% 50%",
                      animation: "tv-beacon-sweep 12s ease-in-out infinite",
                      background:
                        "linear-gradient(270deg, rgba(255, 225, 140, 0.45) 0%, rgba(255, 190, 80, 0.15) 60%, transparent 100%)",
                      clipPath: "polygon(0 0, 100% 42%, 100% 58%, 0 100%)",
                      filter: "blur(3px)",
                    }}
                  />

                  {/* Turbulent Analog Frost-Wave Ghost Interference at 85.0 / 90.0 MHz */}
                  {(frequencyMhz === 85 || frequencyMhz === 90) && (
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-color-dodge"
                      style={{
                        animation: "tv-kulde-lurk 7.5s ease-in-out infinite",
                        filter: "url(#crt-ghost-anomaly)",
                        background:
                          "radial-gradient(ellipse 22% 32% at 32% 42%, rgba(0, 235, 255, 0.28) 0%, rgba(0, 125, 210, 0.12) 55%, transparent 82%)",
                      }}
                    />
                  )}

                  {/* Expanding Radio Wave Rings from Parabolic Dish (58%, 36%) */}
                  <div
                    className="absolute pointer-events-none"
                    style={{ left: "58%", top: "36%" }}
                  >
                    <div
                      className={`w-28 h-28 -ml-14 -mt-14 rounded-full border-2 animate-ping ${
                        frequencyMhz === 90
                          ? "border-(--christmas-red)/70"
                          : frequencyMhz === 85
                            ? "border-(--cold-blue)/80"
                            : frequencyMhz === 75
                              ? "border-(--gold)/70"
                              : "border-(--neon-green)/60"
                      }`}
                      style={{ animationDuration: "2.4s" }}
                    />
                  </div>
                </div>

                {/* Top Camera & Frequency Telemetry OSD */}
                <div className="absolute top-2 left-2 right-2 z-30 flex items-center justify-between pointer-events-none font-mono">
                  <div className="bg-black/80 border border-(--neon-green)/60 px-2.5 py-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-(--christmas-red) animate-pulse" />
                    <span className="text-xs font-bold text-(--neon-green)">
                      {frequencyMhz === 85
                        ? "CAM 04 // PIRAT-PEILING: KRYSTALLGROTTEN"
                        : "CAM 04 - ANTENNETÅRN NORDTOPPEN"}
                    </span>
                  </div>

                  <div
                    className={`bg-black/85 border px-3 py-1 text-xs font-bold ${
                      frequencyMhz === 90
                        ? "border-(--christmas-red) text-(--christmas-red) animate-pulse"
                        : frequencyMhz === 85
                          ? "border-(--cold-blue) text-(--cold-blue) animate-pulse"
                          : frequencyMhz === 75
                            ? "border-(--gold) text-(--gold)"
                            : "border-(--cold-blue) text-(--cold-blue)"
                    }`}
                  >
                    TUNER: {frequencyMhz.toFixed(1)} MHz{" "}
                    {frequencyMhz === 75
                      ? "[NØDLINK 75 MHz LÅST]"
                      : frequencyMhz === 85
                        ? "[❄️ KULDES GROTTE PEILET]"
                        : frequencyMhz === 90
                          ? "[⚠️ KULDE-INTERFERENS!]"
                          : frequencyMhz === 100
                            ? "[JULE-FM MELODI]"
                            : "[ BÆREBØLGE ]"}
                  </div>
                </div>

                {/* Optional Translucent Technical Calibration HUD Overlay */}
                {showCam4Hud && (
                  <div className="absolute inset-x-4 top-12 bottom-16 z-35 bg-black/82 border-2 border-(--neon-green) p-3 flex flex-col justify-between backdrop-blur-[2px]">
                    <div className="flex items-center justify-between border-b border-(--neon-green)/40 pb-1.5">
                      <div className="flex gap-1.5">
                        {(
                          [
                            ["kretskort", "🔌 DAG 8: KRETSKORT"],
                            ["sorterer", "📦 DAG 16: SORTERER"],
                            ["slede", "🛷 DAG 18: SLEDE-RADAR"],
                            ["zapper", "🛡️ DAG 21: BRANNMUR"],
                          ] as const
                        ).map(([id, label]) => (
                          <button
                            key={id}
                            onClick={() => {
                              SoundManager.playSound("click");
                              setActiveMiniGame(id);
                            }}
                            className={`px-2 py-0.5 text-[11px] font-bold border cursor-pointer ${
                              activeMiniGame === id
                                ? "border-(--gold) bg-(--gold) text-black"
                                : "border-(--neon-green)/40 text-(--neon-green)"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowCam4Hud(false)}
                        className="px-2 py-0.5 text-[11px] border border-(--christmas-red) text-(--christmas-red) hover:bg-(--christmas-red)/20 cursor-pointer"
                      >
                        [LUKK HUD ✕]
                      </button>
                    </div>

                    {/* Active Calibration Tool inside Translucent HUD */}
                    {activeMiniGame === "kretskort" && (
                      <div className="my-auto space-y-2">
                        <div className="text-xs text-(--neon-green)">
                          Koble alle 6 relé-nodene i masten for å låse opp siste
                          del av koden på Dag 8:
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {circuitNodes.map((on, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                SoundManager.playSound("click");
                                setCircuitNodes((prev) => {
                                  const next = [...prev];
                                  next[idx] = !next[idx];
                                  return next;
                                });
                              }}
                              className={`py-2 border text-center font-mono text-xs font-bold cursor-pointer ${
                                on
                                  ? "border-(--neon-green) bg-(--neon-green)/25 text-(--neon-green)"
                                  : "border-(--christmas-red)/60 bg-black/70 text-(--christmas-red)"
                              }`}
                            >
                              R-{idx + 1} {on ? "PÅ" : "AV"}
                            </button>
                          ))}
                        </div>
                        <div className="text-xs text-(--gold) font-bold">
                          {allCircuitConnected
                            ? "✅ KRETSLØP AKTIVT: KRETS (kjøkken) + KORT (her) = KRETSKORT!"
                            : "Tips: Klikk på alle røde R-noder til alle 6 lyser grønt."}
                        </div>
                      </div>
                    )}

                    {activeMiniGame === "sorterer" && (
                      <div className="my-auto space-y-2">
                        <div className="text-xs text-(--neon-green)">
                          Sorter pakkene i riktig sjakt ({sorterStep}/4
                          fullført):
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { name: "🚂 TOG", idx: 0 },
                            { name: "🧸 BAMSE", idx: 1 },
                            { name: "🧱 BYGGESETT", idx: 2 },
                            { name: "🎨 MALING", idx: 3 },
                          ].map((item) => (
                            <button
                              key={item.name}
                              onClick={() => {
                                SoundManager.playSound("click");
                                setSorterStep((prev) => Math.min(4, prev + 1));
                              }}
                              className="py-2 border border-(--cold-blue) bg-black/70 text-xs text-(--cold-blue) hover:bg-(--cold-blue)/20 font-bold cursor-pointer"
                            >
                              {item.name}
                            </button>
                          ))}
                        </div>
                        <div className="text-xs text-(--gold) font-bold">
                          {sorterStep >= 4
                            ? "✅ SAMLEBÅND SYNKRONISERT: S-O-R-T + E-R-I-N-G = SORTERING!"
                            : "Klikk på de 4 kategoriene for å synkronisere pakkeradaren."}
                        </div>
                      </div>
                    )}

                    {activeMiniGame === "slede" && (
                      <div className="my-auto space-y-2">
                        <div className="flex items-center justify-between text-xs text-(--neon-green)">
                          <span>
                            HØYDEVIND-RADAR MOT ULRIKEN (FIL {sleighLane + 1}/3)
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                SoundManager.playSound("click");
                                setSleighLane(
                                  (prev) => Math.max(0, prev - 1) as 0 | 1 | 2,
                                );
                                setSleighProgress((p) => Math.min(100, p + 30));
                              }}
                              className="px-2 py-0.5 border border-(--neon-green)"
                            >
                              ▲ NORD
                            </button>
                            <button
                              onClick={() => {
                                SoundManager.playSound("click");
                                setSleighLane(
                                  (prev) => Math.min(2, prev + 1) as 0 | 1 | 2,
                                );
                                setSleighProgress((p) => Math.min(100, p + 30));
                              }}
                              className="px-2 py-0.5 border border-(--neon-green)"
                            >
                              ▼ SØR
                            </button>
                          </div>
                        </div>
                        <div className="w-full bg-black border border-(--neon-green)/50 h-4 overflow-hidden">
                          <div
                            className="bg-(--gold) h-full transition-all"
                            style={{ width: `${sleighProgress}%` }}
                          />
                        </div>
                        <div className="text-xs text-(--gold) font-bold">
                          {sleighProgress >= 100
                            ? "✅ KORRIDOR SIKRET: T-U-R-B-U + L-E-N-S = TURBULENS!"
                            : "Manøvrer sleden (▲/▼) til måleren når 100%."}
                        </div>
                      </div>
                    )}

                    {activeMiniGame === "zapper" && (
                      <div className="my-auto space-y-2">
                        <div className="text-xs text-(--neon-green)">
                          Isoler Spøkelseskoden KULDE på alle 3 bærebølger:
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {["75.0 MHz", "90.0 MHz", "100.0 MHz"].map(
                            (band, idx) => (
                              <button
                                key={band}
                                onClick={() => {
                                  SoundManager.playSound("click");
                                  setZapperLocks((prev) => {
                                    const next: [boolean, boolean, boolean] = [
                                      ...prev,
                                    ];
                                    next[idx] = !next[idx];
                                    return next;
                                  });
                                }}
                                className={`py-2 border text-xs font-bold cursor-pointer ${
                                  zapperLocks[idx]
                                    ? "border-(--gold) bg-(--gold)/25 text-(--gold)"
                                    : "border-(--christmas-red) bg-black/70 text-(--christmas-red)"
                                }`}
                              >
                                {band}: {zapperLocks[idx] ? "RENSET ✓" : "RENS"}
                              </button>
                            ),
                          )}
                        </div>
                        <div className="text-xs text-(--gold) font-bold">
                          {allZapperLocked
                            ? "✅ BRANNMUR AKTIV: B-R-A-N-N + M-U-R = BRANNMUR!"
                            : "Rens alle 3 frekvensbåndene for å stenge Kulde ute."}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Live RF Spectrum Analyzer OSD */}
                <div className="absolute bottom-2 left-2 right-2 z-30 flex items-end justify-between pointer-events-none">
                  <div className="bg-black/85 border border-(--neon-green)/60 px-3 py-1.5 max-w-lg">
                    <div className="text-xs font-bold text-(--gold)">
                      {frequencyMhz === 75
                        ? "📡 75.0 MHz NØDFREKVENS: 15 + 25 + 35 = 75 (Dag 11 kode: 75)"
                        : frequencyMhz === 85
                          ? "❄️ 85.0 MHz PIRAT-SENDER LOKALISERT: MØRKETS KRYSTALLGROTTE (KULDE)"
                          : frequencyMhz === 90
                            ? "❄️ 90.0 MHz ALARM: Spøkelseskode K-U-L + D-E = KULDE (Dag 7)"
                            : frequencyMhz === 100
                              ? "🎵 100.0 MHz JULE-FM: M-E-L + O-D-I = MELODI (Dag 12)"
                              : `📡 BÆREBØLGE ${frequencyMhz.toFixed(1)} MHz - Signal fra Nordtoppen`}
                    </div>
                    <div className="text-[11px] text-(--neon-green)/80">
                      Bruk frekvensvelgeren eller [TEKNISK HUD] under skjermen
                    </div>
                  </div>

                  {/* Animated Spectrum Bars */}
                  <div className="bg-black/80 border border-(--neon-green)/60 px-2.5 py-1.5 flex items-end gap-0.5 h-10">
                    {Array.from({ length: 16 }).map((_, idx) => {
                      const h =
                        20 +
                        ((vhsFrameCounter * 17 + idx * 23 + frequencyMhz) % 75);
                      return (
                        <div
                          key={idx}
                          className={`w-1.5 transition-all duration-100 ${
                            frequencyMhz === 90
                              ? "bg-(--christmas-red)"
                              : frequencyMhz === 85
                                ? "bg-(--cold-blue)"
                                : frequencyMhz === 75
                                  ? "bg-(--gold)"
                                  : "bg-(--neon-green)"
                          }`}
                          style={{ height: `${h}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================================
            PHYSICAL TV HARDWARE CONTROL DECK (BELOW THE CRT TUBE)
           ===================================================================== */}
        <div className="grid grid-cols-4 gap-2 lg:gap-3">
          {(
            [
              {
                id: 1 as ChannelId,
                code: "CAM 1",
                name: "SNØFALL LANDSBY",
                sub: "VÆR & HIMMEL",
              },
              {
                id: 2 as ChannelId,
                code: "CAM 2",
                name: "VERKSTED-LAB",
                sub: "SIKRINGER & KOLBE",
              },
              {
                id: 3 as ChannelId,
                code: "CAM 3",
                name: "VIDEOLOGG (VHS)",
                sub: pirateIntercept
                  ? "85.0 MHz: KULDE"
                  : `${speakerInfo.name} & TEKST-TV`,
              },
              {
                id: 4 as ChannelId,
                code: "CAM 4",
                name: "ANTENNETÅRN",
                sub: `${frequencyMhz.toFixed(1)} MHz & HUD`,
              },
            ] as const
          ).map((ch) => {
            const isActive = activeChannel === ch.id;
            const isRecommended = currentVlog.recommendedChannel === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => handleChannelSelect(ch.id)}
                className={`p-2 border-2 text-left transition-all cursor-pointer relative ${
                  isActive
                    ? "border-(--neon-green) bg-(--neon-green)/20 text-(--neon-green)"
                    : "border-(--neon-green)/35 bg-black/50 text-(--neon-green)/65 hover:border-(--neon-green)/70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{ch.code}</span>
                  {isRecommended && (
                    <span className="px-1 bg-(--gold) text-black text-[9px] font-bold">
                      DAG {selectedDay}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold truncate mt-0.5">
                  {ch.name}
                </div>
                <div className="text-[10px] opacity-75 truncate">{ch.sub}</div>
              </button>
            );
          })}
        </div>

        {/* Secondary Hardware Controls Bar (Tuner / Lens / Lab / Tape Controls) */}
        <div className="p-2.5 border-2 border-(--neon-green)/35 bg-black/60 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Day / Broadcast Tape Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-(--gold) font-bold">SENDING:</span>
            <button
              onClick={() => handleDaySelect(selectedDay - 1)}
              disabled={selectedDay <= 1}
              className="px-2 py-0.5 border border-(--neon-green)/60 text-xs text-(--neon-green) disabled:opacity-30 cursor-pointer"
            >
              ◄
            </button>
            <select
              aria-label="Velg sending dag"
              value={selectedDay}
              onChange={(e) => handleDaySelect(Number(e.target.value))}
              className="bg-black border border-(--gold) text-(--gold) px-2 py-0.5 text-xs font-mono"
            >
              {VLOG_ENTRIES.map((entry) => (
                <option key={entry.day} value={entry.day}>
                  Dag {entry.day}. des – {entry.title} ({entry.speaker})
                </option>
              ))}
            </select>
            <button
              onClick={() => handleDaySelect(selectedDay + 1)}
              disabled={selectedDay >= 24}
              className="px-2 py-0.5 border border-(--neon-green)/60 text-xs text-(--neon-green) disabled:opacity-30 cursor-pointer"
            >
              ►
            </button>
          </div>

          {/* Right: Contextual Hardware Switches for Active Camera */}
          {activeChannel === 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-(--neon-green)/70">LINSE:</span>
              {(
                [
                  ["standard", "NORMAL"],
                  ["prisme", "🌈 PRISME (DAG 3/10)"],
                  ["radar", "📡 RADAR (DAG 5/14)"],
                  ["nordlys", "🌌 NORDLYS (DAG 17)"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => {
                    SoundManager.playSound("click");
                    triggerChannelSwitchEffect();
                    setCam1LensMode(mode);
                  }}
                  className={`px-2 py-0.5 text-[11px] font-bold border cursor-pointer ${
                    cam1LensMode === mode
                      ? "border-(--gold) bg-(--gold) text-black"
                      : "border-(--neon-green)/40 text-(--neon-green)"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {activeChannel === 2 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  SoundManager.playSound("click");
                  setBoilerHot((v) => !v);
                }}
                className={`px-2 py-0.5 text-[11px] font-bold border cursor-pointer ${
                  boilerHot
                    ? "border-(--gold) bg-(--gold) text-black"
                    : "border-(--neon-green)/50 text-(--neon-green)"
                }`}
              >
                🧪 KOLBE (DAG 15)
              </button>
              <button
                onClick={() => {
                  SoundManager.playSound("click");
                  setCentrifugeSpinning((v) => !v);
                }}
                className={`px-2 py-0.5 text-[11px] font-bold border cursor-pointer ${
                  centrifugeSpinning
                    ? "border-(--neon-green) bg-(--neon-green) text-black"
                    : "border-(--neon-green)/50 text-(--neon-green)"
                }`}
              >
                🥕 SENTRIFUGE (DAG 19)
              </button>
              <button
                onClick={() => {
                  SoundManager.playSound("click");
                  setPressureTurbo((v) => !v);
                }}
                className={`px-2 py-0.5 text-[11px] font-bold border cursor-pointer ${
                  pressureTurbo
                    ? "border-(--cold-blue) bg-(--cold-blue) text-black"
                    : "border-(--neon-green)/50 text-(--neon-green)"
                }`}
              >
                🚀 TRYKKMÅLER (DAG 20)
              </button>
            </div>
          )}

          {activeChannel === 3 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  SoundManager.playSound("click");
                  setCharIndex(0);
                }}
                className="px-2.5 py-0.5 border border-(--neon-green) text-xs text-(--neon-green) hover:bg-(--neon-green)/20 cursor-pointer"
              >
                ⏪ SPOL TILBAKE VHS
              </button>
              <button
                onClick={() => {
                  SoundManager.playSound("click");
                  triggerChannelSwitchEffect();
                  setCharIndex(0);
                  setPirateIntercept((v) => !v);
                }}
                className={`px-2.5 py-0.5 border text-xs font-bold cursor-pointer ${
                  pirateIntercept
                    ? "border-(--cold-blue) bg-(--cold-blue) text-black animate-pulse"
                    : "border-(--cold-blue)/60 text-(--cold-blue) hover:bg-(--cold-blue)/20"
                }`}
              >
                ❄️{" "}
                {pirateIntercept
                  ? "AVSLUTT PIRAT-LYTTING (85.0 MHz)"
                  : "AVLYTT 85.0 MHz: KULDE"}
              </button>
              <button
                onClick={() => {
                  SoundManager.playSound("click");
                  setShowTeletext((v) => !v);
                }}
                className={`px-2.5 py-0.5 border text-xs font-bold cursor-pointer ${
                  showTeletext
                    ? "border-(--cold-blue) bg-(--cold-blue) text-black"
                    : "border-(--gold) text-(--gold) hover:bg-(--gold)/20"
                }`}
              >
                📺 TEKST-TV (SIDE {300 + selectedDay})
              </button>
            </div>
          )}

          {activeChannel === 4 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {[75, 85, 90, 100].map((freq) => (
                <button
                  key={freq}
                  onClick={() => {
                    SoundManager.playSound("click");
                    triggerChannelSwitchEffect();
                    setFrequencyMhz(freq);
                  }}
                  className={`px-2 py-0.5 text-[11px] font-bold border cursor-pointer ${
                    frequencyMhz === freq
                      ? "border-(--gold) bg-(--gold) text-black"
                      : "border-(--cold-blue)/50 text-(--cold-blue)"
                  }`}
                >
                  {freq}.0 MHz
                </button>
              ))}
              <button
                onClick={() => {
                  SoundManager.playSound("click");
                  setShowCam4Hud((v) => !v);
                }}
                className={`px-2.5 py-0.5 text-[11px] font-bold border cursor-pointer ${
                  showCam4Hud
                    ? "border-(--neon-green) bg-(--neon-green) text-black"
                    : "border-(--gold) text-(--gold)"
                }`}
              >
                🛠️ {showCam4Hud ? "SKJUL HUD" : "TEKNISK HUD (DAG 8/16/18/21)"}
              </button>
            </div>
          )}
        </div>

        {/* TV-EKSEMPLER & OBSERVASJONER (Quick-Select Broadcast Scenarios & Background Character Sightings) */}
        <div className="p-2 border-2 border-(--gold)/40 bg-black/70 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-(--gold) tracking-wider">
                🎬 TV-EKSEMPLER & BAKGRUNNS-OBSERVASJONER:
              </span>
              <span className="text-[10px] text-(--neon-green)/75">
                Klikk for å hoppe til kamerascener med levende bakgrunnsfigurer
              </span>
            </div>
            {activeScenario && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-(--gold)/15 border border-(--gold)/50 text-(--gold)">
                AKTIV SCENE: {activeScenario.label} (CAM 0
                {activeScenario.channel} • DAG {activeScenario.day})
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
            {TV_SCENARIO_EXAMPLES.map((sc) => {
              const isSelected = activeScenarioId === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => handleScenarioSelect(sc)}
                  className={`px-2 py-1 border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-(--gold) bg-(--gold)/20 text-(--gold)"
                      : "border-(--neon-green)/30 bg-black/60 text-(--neon-green)/85 hover:border-(--gold)/60"
                  }`}
                >
                  <div className="text-[10px] font-bold truncate">
                    {sc.label}
                  </div>
                  <div className="text-[9px] opacity-75 truncate font-mono">
                    CAM 0{sc.channel} • DAG {sc.day}
                  </div>
                </button>
              );
            })}
          </div>

          {activeScenario && (
            <div className="px-2 py-1 bg-(--neon-green)/10 border-l-2 border-(--gold) text-[11px] text-(--neon-green) font-mono flex items-center justify-between gap-2">
              <span>👁️ OBSERVASJON: {activeScenario.sightingNote}</span>
              <span className="text-[10px] text-(--gold) shrink-0">
                [CAM 0{activeScenario.channel} • DAG {activeScenario.day}]
              </span>
            </div>
          )}
        </div>
      </div>
    </RetroWindow>
  );
}
