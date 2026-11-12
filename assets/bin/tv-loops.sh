#!/usr/bin/env bash
# tv-loops.sh: make all Snøfall TV loops from the reference stills and prompt files.
# Remakes only missing or out-of-date loops (medie.py); loops made before sidecars are kept.
# Usage: assets/bin/tv-loops.sh [--force] [--liste] [--bare <navn>] [--tørrkjør] [--upload <base-url>]
#   --liste: print every job name (no API calls); --bare <navn>: make only that job (generer.py uses both)
#   --tørrkjør: print the commands with their absolute paths instead of running them (no API calls)
# Exits 1 if any job fails or an input file is missing.
set -uo pipefail
A="${NISSEKOMM_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}/assets"; T="$A/../public/video/tv"
FORCE= LIST= ONLY= DRY= FAIL=
ARGS=()
while [ $# -gt 0 ]; do
  case $1 in --force) FORCE=1 ;; --liste) LIST=1 ;; --bare) ONLY=$2; shift ;; --tørrkjør) DRY=1 ;; *) ARGS+=("$1") ;; esac
  shift
done
[ ${#ARGS[@]} -gt 0 ] && set -- "${ARGS[@]}" || set --
[ -n "$DRY$LIST" ] || mkdir -p "$T"
M="python3 $(dirname "$0")/medie.py"
export NISSEKOMM_ROOT="$A/.."
JOBS=$($M tv) || { echo "medie.py tv feilet" >&2; exit 1; }
[ -z "$ONLY" ] || grep -q "^$ONLY|" <<<"$JOBS" || { echo "ukjent TV-jobb: $ONLY" >&2; exit 1; }
# unknown (made before the inventory) counts as keep; only stale or missing is remade
want() { [ -n "$LIST" ] && { echo "$1"; return 1; }; [ -z "$ONLY" ] || [ "$ONLY" = "$1" ]; }
keep() {
  want "$(basename "$1" .mp4)" || return 0
  [ -z "$FORCE$DRY" ] && [ -f "$1" ] && [ "$($M status "$1" | head -1)" != stale ]
}
run() { if [ -n "$DRY" ]; then printf '%q ' "$@"; echo; else "$@"; fi; }
need() { # every input must exist; an empty path is the bug this guards against
  local f; for f in "$@"; do [ -n "$f" ] && [ -f "$f" ] || { echo "mangler inndata: '${f}'" >&2; return 1; }; done
}
meta() { run $M skriv tv-loops.sh "$1" "$2" - gemini-omni-1.2-flash "${@:3}"; } # out prompt image [ref]
# The jobs live in assets/medier.json (generator "loop"); medie.py tv gives one line per loop.
# Fading (Hans 12.11): both ends of a loop are blended, so anything not in the blended-to frame fades.
# seamless.sh blends the clip's own tail into its head: people and doors fade. State loops therefore use
# "anker": true (first+last frame = the still, anchor.sh blends only toward that same still) and the prompt
# keeps the first and last two seconds empty. Events never start from a still with a figure in it:
# figures walk in and out of frame or a door (an anchor without the figure fades it away).
# Intermediate stills (generator "mellomstill") are made only when a job that needs them runs.
first() { # state loop -> its first frame as jpg
  local k="$A/out/forste-$1.jpg"
  [ -f "$T/$1.mp4" ] || { echo "mangler $T/$1.mp4 (lag tilstanden før hendelsene)" >&2; return 1; }
  [ -n "$DRY" ] || ffmpeg -nostdin -y -v error -i "$T/$1.mp4" -frames:v 1 -q:v 2 "$k" || return 1
  echo "$k"
}
loop() { # name prompt image state anchor refs first_only
  local name=$1 prompt=$2 img=$3 state=$4 anchor=$5 refs=$6 forste=$7 b p u made=
  keep "$T/$name.mp4" && return 0
  [ -n "$DRY" ] && echo "# $name"
  while IFS='|' read -r b p u r <&4; do
    [ -f "$u" ] && continue
    [ "$b" = "$made" ] || need "$b" || return 1  # the previous still is made by this run
    # shellcheck disable=SC2086
    need "$p" $r && run "$A/bin/still.sh" "$b" "$p" "$u" $r || return 1
    made=$u
  done 4< <($M stiller "tv/$name")
  # Events are cut only into their own state loop, anchored to its first frame (10 s with first+last frame)
  [ -n "$state" ] && { img=$(first "$state") || return 1; anchor=1; }
  # shellcheck disable=SC2086
  need "$prompt" $refs || return 1
  # a dry run has not made the intermediate still or the state frame yet
  if [ -z "$DRY" ] || { [ "$img" != "$made" ] && [ -z "$state" ]; }; then need "$img" || return 1; fi
  # Never send a character ref to the video model: it treats a third image as a target scene and
  # morphs into it. Look comes from the prompt text; refs only feed intermediate stills.
  if [ -n "$anchor" ]; then
    local key=$img; [ "$anchor" = 1 ] || { need "$anchor" || return 1; key=$anchor; }
    run env SEAM=0 FORSTE="$forste" "$A/bin/loop.sh" "$img" "$prompt" "$name.raw" 10 \
      && run "$A/bin/anchor.sh" "$A/out/$name.raw.mp4" "$key" "$T/$name.mp4" \
      && meta "$T/$name.mp4" "$prompt" "$img" ${key#"$img"}
  else
    run "$A/bin/loop.sh" "$img" "$prompt" "$name" 10 && run cp "$A/out/$name.mp4" "$T/$name.mp4" \
      && meta "$T/$name.mp4" "$prompt" "$img"
  fi
}
while IFS='|' read -r name prompt img state anchor refs forste <&3; do
  loop "$name" "$prompt" "$img" "$state" "$anchor" "$refs" "$forste" || { echo "feil: $name" >&2; FAIL=1; }
done 3<<<"$JOBS"
[ -n "$FAIL" ] && exit 1
[ -n "$LIST$ONLY$DRY" ] && exit 0
ls "$T"
# --upload <base-url>: PUT every loop with NISSEKOMM_UPLOAD_TOKEN, then check sizes via GET /api/media.
if [ "${1:-}" = "--upload" ]; then
  B="${2%/}"; H="Authorization: Bearer $NISSEKOMM_UPLOAD_TOKEN"
  for f in "$T"/*.mp4; do
    curl -fsS -X PUT -H "$H" -H "Content-Type: video/mp4" --data-binary "@$f" "$B/api/media/video/tv/$(basename "$f")" >/dev/null \
      || echo "feil: $(basename "$f")"
  done
  curl -fsS -H "$H" "$B/api/media" | python3 -c '
import json, os, sys
d = {m["path"]: m["size"] for m in json.load(sys.stdin)}
bad = [f for f in os.listdir(sys.argv[1]) if f.endswith(".mp4")
       and d.get("video/tv/" + f) != os.path.getsize(os.path.join(sys.argv[1], f))]
print("verifisert" if not bad else "feil størrelse: " + " ".join(bad))
sys.exit(1 if bad else 0)' "$T"
fi
