/** TEKNISK HUD toys and their storyboard day; plain data so lib/opplasinger can read it without React. */
export type GameId =
  "kretslop" | "sorterer" | "slede" | "sentrifuge" | "porten";

// Storyboard day each toy first appears (8 kretskort and slede, 16 sorterer, 19 sentrifuge, 21 porten).
export const GAMES: [GameId, string, number][] = [
  ["kretslop", "KRETSLØP", 8],
  ["sorterer", "SORTERER", 16],
  ["slede", "SLEDESIMULATOR", 8],
  ["sentrifuge", "SENTRIFUGE", 19],
  ["porten", "PORTEN", 21],
];

export const gamesFor = (day: number) => GAMES.filter(([, , d]) => day >= d);
