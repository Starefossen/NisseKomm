/**
 * P in Gjennomgang goes back to the item Hans actually viewed before, like
 * the browser's back, per tab (sessionStorage). The bar's arrows walk the list.
 */
const NOKKEL = "nissekomm-guide-gjennomgang-historikk";

/** The stack after viewing `id`; a reload or a step back keeps it as is. */
export const besøk = (s: string[], id: string) =>
  s.at(-1) === id ? s : [...s, id].slice(-200);

/** Leave the current item: the stack without it, and the item before it. */
export function tilbake(s: string[]): [string[], string | undefined] {
  const ny = s.slice(0, -1);
  return [ny, ny.at(-1)];
}

export const lesHistorikk = (): string[] =>
  JSON.parse(sessionStorage.getItem(NOKKEL) ?? "[]");
export const skrivHistorikk = (s: string[]) =>
  sessionStorage.setItem(NOKKEL, JSON.stringify(s));
