#!/usr/bin/env node
// Warns when a commit removes lines that another commit added recently: the
// signature of a merge conflict resolved with «ours»/«theirs» or a file
// copied in from a stale worktree. Advisory only (exit 0).
// Usage: node scripts/sjekk-tilbakerulling.mjs [range] [--siden "24 hours ago"]
import { execFileSync } from "node:child_process";

const git = (...a) =>
  execFileSync("git", a, { encoding: "utf8", maxBuffer: 1 << 28 });
const args = process.argv.slice(2);
const si = args.indexOf("--siden");
const siden = si >= 0 ? args.splice(si, 2)[1] : "24 hours ago";
const range = args[0] ?? "origin/main..HEAD";
// git parses the date the way --since does and prints --max-age=<epoch>.
const cutoff = Number(
  git("rev-parse", `--since=${siden}`).trim().split("=")[1],
);

let funn = 0;
for (const c of git("rev-list", "--reverse", "--no-merges", range)
  .split("\n")
  .filter(Boolean)) {
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
      else if (l.startsWith("\t") && tid >= cutoff && l.trim()) {
        const k = `${sha.slice(0, 7)} ${summary}`;
        (tap.get(k) ?? tap.set(k, []).get(k)).push(l.slice(1));
      }
    }
    for (const [k, linjer] of tap) {
      funn++;
      console.log(
        `${c.slice(0, 7)} ${git("log", "-1", "--format=%s", c).trim()}\n  ${f}: fjerner ${linjer.length} linje(r) fra ${k}`,
      );
      for (const x of linjer.slice(0, 3))
        console.log(`    - ${x.trim().slice(0, 100)}`);
    }
  }
}
if (funn)
  console.log(
    `\n${funn} treff. Sjekk at fjerningene er tilsiktet, ikke en konfliktløsning.`,
  );
