/** One entry of dag-NN-vN.segmenter.json (julius-dag.py writes it at the join, `segmenter` back-fills it). */
export interface Segment {
  s: number;
  start: number;
  slutt: number;
  hash: string;
  raw: string | null;
  replikk: string;
  hørt?: string | null;
  dekning?: number | null;
  flagg: string[];
}

/** `video/julius/dag-13-v2.mp4` → `video/julius/dag-13#s3`: the segment verdict id julius-dag.py's lock reads. */
export const segmentId = (video: string, s: number) =>
  `${video.replace(/(-v\d+|\.old-\d+)?\.mp4$/, "")}#s${s}`;

/** `…/dag-14#s3` verdicts: what the agent runs next (julius-dag.py's script gate and segment lock). */
export function segmentHint(id: string, vurdering?: string) {
  const m = id.match(/^(manus|video)\/julius\/dag-(\d+)#s(\d+)$/);
  if (!m || vurdering !== "lag_paa_nytt") return "";
  return m[1] === "manus"
    ? ` → endre segment ${m[3]} i docs/manus/julius-2026.md, så python3 assets/bin/julius-dag.py manus`
    : ` → python3 assets/bin/julius-dag.py ${Number(m[2])} --suffix -vN --segment ${m[3]}`;
}

const ord = (s: string) => s.match(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu) ?? [];
const norm = (w: string) => w.toLowerCase().replace(/-/g, "");

/** Script against transcript, word by word (LCS): `mangler` = in the script only, `ekstra` = heard only. */
export function ordDiff(manus: string, hørt: string) {
  const a = ord(manus);
  const b = ord(hørt);
  const L = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      L[i][j] =
        norm(a[i]) === norm(b[j])
          ? L[i + 1][j + 1] + 1
          : Math.max(L[i + 1][j], L[i][j + 1]);
  const ut: { w: string; t: "lik" | "mangler" | "ekstra" }[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && norm(a[i]) === norm(b[j])) {
      ut.push({ w: b[j], t: "lik" });
      i++;
      j++;
    } else if (j < b.length && (i === a.length || L[i][j + 1] >= L[i + 1][j]))
      ut.push({ w: b[j++], t: "ekstra" });
    else ut.push({ w: a[i++], t: "mangler" });
  }
  return ut;
}

/** Where in the joined video a flag points: its own timestamp («0:03 …» from the audit), extra words at the end, else the start. */
export function flaggTid(seg: Segment, flagg: string) {
  const m = flagg.match(/^(?:(\d+):)?(\d+(?:\.\d+)?)s?\b/);
  if (m) {
    const t = Number(m[1] ?? 0) * 60 + Number(m[2]);
    return Math.min(seg.slutt, seg.start + t);
  }
  if (flagg.startsWith("ekstra")) return Math.max(seg.start, seg.slutt - 3);
  return seg.start;
}
