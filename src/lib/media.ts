/** URL for a media file served from MEDIA_DIR by /media/[...path]. */
export function mediaUrl(path: string): string {
  return "/media/" + path.split("/").map(encodeURIComponent).join("/");
}

const pad = (n: number) => String(n).padStart(2, "0");

const MUSIC = [
  "Jingle Bells",
  "Rudolph the Red Nosed Reindeer",
  "Deck the Halls",
  "Winter Wonderland",
  "Let It Snow, Let It Snow, Let It Snow",
  "Sleigh Ride",
  "Rockin' Around the Christmas Tree",
  "Feliz Navidad",
  "I Saw Mommy Kissing Santa Claus",
  "All I Want for Christmas Is You",
  "Last Christmas",
  "Have Yourself a Merry Little Christmas",
].map((t) => `music/${t} (8-Bit Version).mp3`);

/** Every media file the app expects. Uploads are only accepted for these paths. */
export const MEDIA_MANIFEST: readonly string[] = [
  ...Array.from({ length: 24 }, (_, i) => `video/julius/dag-${pad(i + 1)}.mp4`),
  "video/tv/landsby-rolig.mp4",
  "video/tv/landsby-nordlys.mp4",
  "video/tv/verksted-iq-inne.mp4",
  "video/tv/verksted-tom.mp4",
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
