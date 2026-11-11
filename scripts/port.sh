#!/usr/bin/env bash
# Merge gate: scripts/port.sh [--dry-run] branch...
# Merges the branches into main in order, runs `pnpm check`, runs the sharded playthrough
# only when app code changed, and pushes main only if all of it passed.
# The playthrough needs a dev server (`mise run dev`) serving this checkout at BASE_URL.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

DRY=0
[[ "${1:-}" == "--dry-run" ]] && DRY=1 && shift
(($#)) || { echo "bruk: scripts/port.sh [--dry-run] gren..."; exit 2; }
export BASE_URL="${BASE_URL:-http://localhost:3000}"
export KID_CODE="${KID_CODE:-snø lykt rein}"
export SHARDS="${SHARDS:-4}"
START=$SECONDS

fail() { echo "PORT FEIL: $* ($((SECONDS - START))s)"; exit 1; }

[[ -z "$(git status --porcelain --untracked-files=no)" ]] || fail "uncommitted endringer"
ORIG=$(git symbolic-ref -q --short HEAD || git rev-parse HEAD)
# Dry-run uses a detached main, so it also works in a worktree where main is checked out elsewhere
if ((DRY)); then git checkout -q --detach main; else git checkout -q main; fi || fail "checkout main"
BEFORE=$(git rev-parse HEAD)
undo() {
  git reset -q --hard "$BEFORE"
  ((DRY)) && git checkout -q "$ORIG"
  fail "$1, main tilbakestilt"
}

for b in "$@"; do
  git merge -q --no-edit "$b" >/dev/null 2>&1 || { git merge --abort 2>/dev/null; undo "konflikt i $b"; }
done

pnpm -s check >/dev/null 2>&1 || undo "pnpm check"

PLAY="hoppet over (ingen app-endring)"
if git diff --name-only "$BEFORE" HEAD |
  grep -Ev '\.md$|^docs/|^assets/(prompts|bin)/' |
  grep -Eq '^(src/|public/|scripts/gjennomspilling\.mjs$)'; then
  mkdir -p test-results
  node scripts/gjennomspilling.mjs >test-results/port-gjennomspilling.log 2>&1 ||
    undo "gjennomspilling (se test-results/port-gjennomspilling.log)"
  PLAY="OK"
fi

if ((DRY)); then
  git reset -q --hard # `pnpm check` runs prettier --write
  git checkout -q "$ORIG"
  echo "PORT OK (dry-run, ikke pushet): $* | check OK | gjennomspilling $PLAY | $((SECONDS - START))s"
else
  git push -q origin main || fail "push"
  echo "PORT OK: $* -> $(git rev-parse --short HEAD) | check OK | gjennomspilling $PLAY | $((SECONDS - START))s"
fi
