/**
 * P in Gjennomgang goes back to the item Hans actually viewed before, like
 * the browser's back, per tab (sessionStorage). The bar's arrows walk the list.
 */
const NOKKEL = "nissekomm-guide-gjennomgang-historikk";

/**
 * The stack after viewing `id`; a reload keeps it as is. `nettleser` = the view came
 * from the browser's back/forward: landing on the item under the top is a step back
 * (the top is dropped), so P afterwards goes further back, not forward again.
 */
export const besøk = (s: string[], id: string, nettleser = false) =>
  s.at(-1) === id
    ? s
    : nettleser && s.at(-2) === id
      ? s.slice(0, -1)
      : [...s, id].slice(-200);

/** Leave the current item: the stack without it, and the item before it. */
export function tilbake(s: string[]): [string[], string | undefined] {
  const ny = s.slice(0, -1);
  return [ny, ny.at(-1)];
}

export const lesHistorikk = (): string[] =>
  JSON.parse(sessionStorage.getItem(NOKKEL) ?? "[]");
export const skrivHistorikk = (s: string[]) =>
  sessionStorage.setItem(NOKKEL, JSON.stringify(s));

/**
 * Is there an item to go back to from `id`? Takes the id so the answer follows the
 * item shown (a value read from sessionStorage alone is cached by the React Compiler).
 */
export const harForrige = (id?: string) => {
  const s = lesHistorikk();
  return s.length > (s.at(-1) === id ? 1 : 0);
};

// The browser's back/forward arrives as popstate before the new id renders. Kept here,
// not in the view: Next may remount the view on a history step.
let pop = false;
if (typeof window !== "undefined")
  window.addEventListener("popstate", () => (pop = true));
/** True once after a browser back/forward. */
export const fraNettleser = () => {
  const p = pop;
  pop = false;
  return p;
};
