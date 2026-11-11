#!/usr/bin/env bash
# tv-loops.sh: make all Snøfall TV loops from the reference stills and prompt files.
# Remakes only missing or out-of-date loops (medie.py); loops made before sidecars are kept.
# Usage: assets/bin/tv-loops.sh [--force] [--liste] [--bare <navn>] [--upload <base-url>]
#   --liste: print every job name (no API calls); --bare <navn>: make only that job (generer.py uses both)
set -uo pipefail
A="$(cd "$(dirname "$0")/.." && pwd)"; L="$A/locations"; T="$A/../public/video/tv"; mkdir -p "$T"
FORCE= LIST= ONLY=
ARGS=()
while [ $# -gt 0 ]; do
  case $1 in --force) FORCE=1 ;; --liste) LIST=1 ;; --bare) ONLY=$2; shift ;; *) ARGS+=("$1") ;; esac
  shift
done
[ ${#ARGS[@]} -gt 0 ] && set -- "${ARGS[@]}" || set --
M="python3 $A/bin/medie.py"
# unknown (made before the inventory) counts as keep; only stale or missing is remade
want() { [ -n "$LIST" ] && { echo "$1"; return 1; }; [ -z "$ONLY" ] || [ "$ONLY" = "$1" ]; }
keep() { want "$(basename "$1" .mp4)" || return 0; [ -z "$FORCE" ] && [ -f "$1" ] && [ "$($M status "$1" | head -1)" != stale ]; }
meta() { $M skriv tv-loops.sh "$1" "$2" - gemini-omni-1.2-flash "${@:3}"; } # out prompt image [ref]
# The jobs live in assets/medier.json (generator "loop"); medie.py tv gives one line per loop.
# Intermediate stills (generator "mellomstill") are made only when a job that needs them runs.
first() { # state loop -> its first frame as jpg
  local k="$A/out/forste-$1.jpg"
  [ -f "$T/$1.mp4" ] || { echo "mangler $T/$1.mp4 (lag tilstanden før hendelsene)" >&2; return 1; }
  ffmpeg -nostdin -y -v error -i "$T/$1.mp4" -frames:v 1 -q:v 2 "$k" && echo "$k"
}
loop() { # name prompt image state anchor refs
  local name=$1 prompt=$2 img=$3 state=$4 anchor=$5 refs=$6 b p u
  keep "$T/$name.mp4" && return 0
  while IFS='|' read -r b p u <&4; do
    [ -f "$u" ] || "$A/bin/still.sh" "$b" "$p" "$u" >/dev/null || return 1
  done 4< <($M stiller "tv/$name")
  # Events are cut only into their own state loop, anchored to its first frame (10 s with first+last frame)
  [ -n "$state" ] && { img=$(first "$state") || return 1; anchor=1; }
  if [ -n "$anchor" ]; then
    # shellcheck disable=SC2086
    "$A/bin/loop.sh" "$img" "$prompt" "$name.raw" 10 $refs \
      && "$A/bin/anchor.sh" "$A/out/$name.raw.mp4" "$img" "$T/$name.mp4" \
      && meta "$T/$name.mp4" "$prompt" "$img" $refs
  else
    "$A/bin/loop.sh" "$img" "$prompt" "$name" 10 && cp "$A/out/$name.mp4" "$T/$name.mp4" \
      && meta "$T/$name.mp4" "$prompt" "$img"
  fi
}
while IFS='|' read -r name prompt img state anchor refs <&3; do
  loop "$name" "$prompt" "$img" "$state" "$anchor" "$refs"
done 3< <($M tv)
[ -n "$LIST$ONLY" ] && exit 0
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
