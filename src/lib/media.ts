/** URL for a media file served from MEDIA_DIR by /media/[...path]. */
export function mediaUrl(path: string): string {
  return "/media/" + path.split("/").map(encodeURIComponent).join("/");
}

const pad = (n: number) => String(n).padStart(2, "0");

export interface MediaManifestEntry {
  path: string;
  title?: string;
  subtitle?: string;
  defaultDuration?: string;
}

export type ManifestEntry = string | MediaManifestEntry;

export function mediaPath(entry: ManifestEntry): string {
  return typeof entry === "string" ? entry : entry.path;
}

const MUSIC: readonly MediaManifestEntry[] = [
  {
    path: "music/Jingle Bells (8-Bit Version).mp3",
    title: "Bjelleklang (8-Bit Chiptune)",
    subtitle: "Jingle Bells — Snøfall Radio 90.0 MHz",
    defaultDuration: "1:57",
  },
  {
    path: "music/Rudolph the Red Nosed Reindeer (8-Bit Version).mp3",
    title: "Rudolf er Rød på Nesen (8-Bit)",
    subtitle: "Rudolph the Red-Nosed Reindeer",
    defaultDuration: "1:57",
  },
  {
    path: "music/Deck the Halls (8-Bit Version).mp3",
    title: "Kranser og Kristtorn (8-Bit)",
    subtitle: "Deck the Halls — Verksted-Mix",
    defaultDuration: "1:08",
  },
  {
    path: "music/Winter Wonderland (8-Bit Version).mp3",
    title: "Vinter-Eventyrland (8-Bit)",
    subtitle: "Winter Wonderland — Krystallhagen",
    defaultDuration: "1:43",
  },
  {
    path: "music/Let It Snow, Let It Snow, Let It Snow (8-Bit Version).mp3",
    title: "La Det Snø, La Det Snø (8-Bit)",
    subtitle: "Let It Snow! — Brevfugl-Tårnet",
    defaultDuration: "2:03",
  },
  {
    path: "music/Sleigh Ride (8-Bit Version).mp3",
    title: "Kanefart gjennom Snøfall (8-Bit)",
    subtitle: "Sleigh Ride — Slede-Ekspert",
    defaultDuration: "2:04",
  },
  {
    path: "music/Rockin' Around the Christmas Tree (8-Bit Version).mp3",
    title: "Dans rundt Juletreet (8-Bit)",
    subtitle: "Rockin' Around the Christmas Tree",
    defaultDuration: "1:58",
  },
  {
    path: "music/Feliz Navidad (8-Bit Version).mp3",
    title: "Feliz Navidad (8-Bit)",
    subtitle: "Globale Nisse-Frekvenser",
    defaultDuration: "2:08",
  },
  {
    path: "music/I Saw Mommy Kissing Santa Claus (8-Bit Version).mp3",
    title: "Jeg Så Mamma Kysse Nissen (8-Bit)",
    subtitle: "I Saw Mommy Kissing Santa Claus",
    defaultDuration: "2:24",
  },
  {
    path: "music/All I Want for Christmas Is You (8-Bit Version).mp3",
    title: "Alt Jeg Ønsker til Jul (8-Bit)",
    subtitle: "All I Want for Christmas Is You",
    defaultDuration: "4:14",
  },
  {
    path: "music/Last Christmas (8-Bit Version).mp3",
    title: "Siste Jul (8-Bit Synth)",
    subtitle: "Last Christmas — Nordlys-Utgave",
    defaultDuration: "3:46",
  },
  {
    path: "music/Have Yourself a Merry Little Christmas (8-Bit Version).mp3",
    title: "Ha en Riktig God og Glitrende Jul (8-Bit)",
    subtitle: "Have Yourself a Merry Little Christmas",
    defaultDuration: "3:50",
  },
];

/** Every media file the app expects. Uploads are only accepted for these paths. */
export const MEDIA_MANIFEST: readonly ManifestEntry[] = [
  ...Array.from({ length: 24 }, (_, i) => `video/julius/dag-${pad(i + 1)}.mp4`),
  "video/tv/landsby-rolig.mp4",
  "video/tv/landsby-nordlys.mp4",
  "video/tv/landsby-storm.mp4",
  "video/tv/landsby-dag24.mp4",
  "video/tv/verksted-iq-inne.mp4",
  "video/tv/verksted-tom.mp4",
  "video/tv/kontor-julius.mp4",
  "video/tv/kontor-tom.mp4",
  "video/tv/kontor-dag14.mp4",
  "video/tv/antenne-rolig.mp4",
  "video/tv/antenne-dag11.mp4",
  "video/tv/grotte-rolig.mp4",
  "video/tv/grotte-dag12.mp4",
  "video/tv/grotte-dag15.mp4",
  "video/tv/grotte-dag21.mp4",
  "video/tv/grotte-dag23.mp4",
  "video/tv/grotte-dag24.mp4",
  "feed/antenne-tarn.png",
  "feed/kulde-grotte.png",
  "feed/snøfall-storm.png",
  "feed/snøfall-day.png",
  "feed/iq-verksted.png",
  "feed/julius-kontor.png",
  ...MUSIC,
  "music/christmas-dreams-jingle-bells-268299.mp3",
];

export interface MediaStatus {
  path: string;
  size: number | null;
}
