/**
 * Field-wise word diff of a source text (radio script, Julius script, gaater
 * block, guide section). Pure, no node imports: Gjennomgang's Historikk and
 * «Endret siden du godkjente» both render its result with `TekstDiff`.
 */
export type Del =
  | { t: "=" | "-" | "+"; s: string }
  /** A long unchanged run, folded. */
  | { t: "…"; n: number }
  /** Text that left this field for another (til) or came from another (fra). */
  | { t: "f"; s: string; dir: "til" | "fra"; felt: string };

export interface FeltDiff {
  felt: string;
  deler: Del[];
}

const FELT_LINJE =
  /^\s*(?:(\d+)\. )?(?:- )?\*\*([^*:]+?):?\*\*:?\s*(.*)$|^\s+- ([A-ZÆØÅ][\wæøåÆØÅ ]*?): (.*)$/;

/** «**Felt:** tekst» and «   - Felt: tekst» lines into name → text; numbered items prefix «N ». */
export function parseFelt(tekst: string): Map<string, string> {
  const ut = new Map<string, string>();
  let nr = "";
  let nå = "tekst";
  for (const l of tekst.split("\n")) {
    if (/^#/.test(l)) continue;
    const m = l.match(FELT_LINJE);
    if (m) {
      if (m[1]) nr = m[1];
      const navn = m[2] ?? m[4];
      nå = m[1] || m[4] ? `${nr} ${navn}` : navn;
      ut.set(nå, ((ut.get(nå) ?? "") + " " + (m[3] ?? m[5] ?? "")).trim());
    } else if (l.trim()) {
      if (/^\d+\. /.test(l)) nr = l.match(/^(\d+)/)![1];
      ut.set(nå, ((ut.get(nå) ?? "") + " " + l.trim()).trim());
    }
  }
  return ut;
}

const ord = (s: string) => s.split(/\s+/).filter(Boolean);
const FOLD = 14;
const KONTEKST = 4;

/** Word-level LCS; the folded runs keep KONTEKST words each side so no sentence is cut mid-way. */
export function ordDiff(før: string, nå: string): Del[] {
  const a = ord(før);
  const b = ord(nå);
  const rå: { t: "=" | "-" | "+"; w: string }[] = [];
  if (a.length * b.length > 4e6) {
    // ponytail: past ~2000x2000 words a whole replace; real fields are a few hundred.
    a.forEach((w) => rå.push({ t: "-", w }));
    b.forEach((w) => rå.push({ t: "+", w }));
  } else {
    const L = Array.from({ length: a.length + 1 }, () =>
      new Array<number>(b.length + 1).fill(0),
    );
    for (let i = a.length - 1; i >= 0; i--)
      for (let j = b.length - 1; j >= 0; j--)
        L[i][j] =
          a[i] === b[j]
            ? L[i + 1][j + 1] + 1
            : Math.max(L[i + 1][j], L[i][j + 1]);
    let i = 0;
    let j = 0;
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && a[i] === b[j]) {
        rå.push({ t: "=", w: a[i] });
        i++;
        j++;
      } else if (j >= b.length || (i < a.length && L[i + 1][j] >= L[i][j + 1]))
        rå.push({ t: "-", w: a[i++] });
      else rå.push({ t: "+", w: b[j++] });
    }
  }
  const runs: { t: "=" | "-" | "+"; w: string[] }[] = [];
  for (const x of rå) {
    const s = runs.at(-1);
    if (s && s.t === x.t) s.w.push(x.w);
    else runs.push({ t: x.t, w: [x.w] });
  }
  const ut: Del[] = [];
  runs.forEach((r, k) => {
    if (r.t !== "=" || r.w.length <= FOLD) {
      ut.push({ t: r.t, s: r.w.join(" ") });
      return;
    }
    const først = k === 0;
    const sist = k === runs.length - 1;
    const hode = først ? 0 : KONTEKST;
    const hale = sist ? 0 : KONTEKST;
    if (hode) ut.push({ t: "=", s: r.w.slice(0, hode).join(" ") });
    ut.push({ t: "…", n: r.w.length - hode - hale });
    if (hale) ut.push({ t: "=", s: r.w.slice(-hale).join(" ") });
  });
  return ut;
}

const norm = (s: string) => ord(s).join(" ");

/** Per changed field a word diff; a run that left one field and sits in another is «flyttet». */
export function feltDiff(før: string, nå: string): FeltDiff[] {
  const A = parseFelt(før);
  const B = parseFelt(nå);
  const endret = [...new Set([...A.keys(), ...B.keys()])].filter(
    (f) => (A.get(f) ?? "") !== (B.get(f) ?? ""),
  );
  return endret.map((felt) => {
    const deler = ordDiff(A.get(felt) ?? "", B.get(felt) ?? "").map(
      (d): Del => {
        if ((d.t !== "-" && d.t !== "+") || ord(d.s).length < 3) return d;
        const motsatt = d.t === "-" ? B : A;
        const hit = endret.find(
          (f) =>
            f !== felt &&
            norm(motsatt.get(f) ?? "").includes(norm(d.s)) &&
            !norm((d.t === "-" ? B : A).get(felt) ?? "").includes(norm(d.s)),
        );
        return hit
          ? { t: "f", s: d.s, dir: d.t === "-" ? "til" : "fra", felt: hit }
          : d;
      },
    );
    return { felt, deler };
  });
}
