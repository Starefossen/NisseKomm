#!/usr/bin/env node
// Warns when a commit removes lines that another commit added recently: the
// signature of a merge conflict resolved with «ours»/«theirs» or a file
// copied in from a stale worktree. Editing a recent line is normal and passes; it
// counts only when the commit puts back (3+ lines, at least half as many as it
// removes) the text that recent commit replaced. With --streng it exits 1 on a finding (port.sh);
// without it, it only warns (CI). A commit whose message has a line
// `Tilbakerulling-ok: <grunn>` is exempt: the removal is deliberate.
// Usage: node scripts/sjekk-tilbakerulling.mjs [range] [--siden "48 hours ago"] [--streng]
import { execFileSync } from "node:child_process";

const git = (...a) =>
  execFileSync("git", a, { encoding: "utf8", maxBuffer: 1 << 28 });
const args = process.argv.slice(2);
const streng = args.includes("--streng");
if (streng) args.splice(args.indexOf("--streng"), 1);
const si = args.indexOf("--siden");
const siden = si >= 0 ? args.splice(si, 2)[1] : "48 hours ago";
const range = args[0] ?? "origin/main..HEAD";
// git parses the date the way --since does and prints --max-age=<epoch>.
const cutoff = Number(
  git("rev-parse", `--since=${siden}`).trim().split("=")[1],
);

const linjer = (diff, tegn) =>
  diff
    .split("\n")
    .filter((l) => l[0] === tegn && !l.startsWith(tegn.repeat(3)))
    .map((l) => l.slice(1).trim())
    .filter((l) => l.length >= 20);
const fjernet = new Map();
const fjernetAv = (sha, f) => {
  const k = `${sha} ${f}`;
  if (!fjernet.has(k)) {
    let d = "";
    try {
      d = git("diff", "-U0", "--no-renames", `${sha}^`, sha, "--", f);
    } catch {}
    fjernet.set(k, new Set(linjer(d, "-")));
  }
  return fjernet.get(k);
};

const iRange = new Set(git("rev-list", range).split("\n").filter(Boolean));
let funn = 0;
for (const c of git("rev-list", "--reverse", "--no-merges", range)
  .split("\n")
  .filter(Boolean)) {
  if (/^Tilbakerulling-ok:\s*\S/im.test(git("log", "-1", "--format=%B", c)))
    continue;
  const diff = git("diff", "-U0", "--no-renames", `${c}^`, c);
  let fil = null;
  const biter = new Map();
  for (const l of diff.split("\n")) {
    if (l.startsWith("--- ")) fil = l === "--- /dev/null" ? null : l.slice(6);
    const m = l.match(/^@@ -(\d+)(?:,(\d+))? /);
    if (m && fil && m[2] !== "0") {
      (biter.get(fil) ?? biter.set(fil, []).get(fil)).push([
        +m[1],
        +(m[2] ?? 1),
      ]);
    }
  }
  for (const [f, spenn] of biter) {
    const lagtTil = linjer(
      git("diff", "-U0", "--no-renames", `${c}^`, c, "--", f),
      "+",
    );
    const lArgs = spenn.flatMap(([s, n]) => ["-L", `${s},${s + n - 1}`]);
    let blame;
    try {
      blame = git("blame", "--line-porcelain", ...lArgs, `${c}^`, "--", f);
    } catch {
      continue;
    }
    const tap = new Map();
    let sha, tid, summary;
    for (const l of blame.split("\n")) {
      if (/^[0-9a-f]{40} /.test(l)) sha = l.slice(0, 40);
      else if (l.startsWith("committer-time ")) tid = +l.slice(15);
      else if (l.startsWith("summary ")) summary = l.slice(8);
      else if (
        l.startsWith("\t") &&
        tid >= cutoff &&
        l.trim() &&
        !iRange.has(sha)
      ) {
        const k = `${sha.slice(0, 7)} ${summary}`;
        (tap.get(k) ?? tap.set(k, { sha, l: [] }).get(k)).l.push(l.slice(1));
      }
    }
    for (const [k, { sha: kilde, l: linjer }] of tap) {
      const gammel = fjernetAv(kilde, f);
      // A stale copy restores most of what the recent commit replaced.
      const tilbake = new Set(lagtTil.filter((x) => gammel.has(x))).size;
      if (tilbake < 3 || tilbake < linjer.length / 2) continue;
      funn++;
      console.log(
        `${c.slice(0, 7)} ${git("log", "-1", "--format=%s", c).trim()}\n  ${f}: fjerner ${linjer.length} linje(r) fra ${k}`,
      );
      for (const x of linjer.slice(0, 3))
        console.log(`    - ${x.trim().slice(0, 100)}`);
    }
  }
}
if (funn) {
  console.log(
    `\n${funn} treff. Sjekk at fjerningene er tilsiktet, ikke en konfliktløsning.` +
      `\nTilsiktet? Skriv «Tilbakerulling-ok: <grunn>» i commit-meldingen.`,
  );
  if (streng) process.exit(1);
}
