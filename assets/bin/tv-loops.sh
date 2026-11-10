#!/usr/bin/env bash
# tv-loops.sh: make all Snøfall TV loops from the reference stills and prompt files.
# Remakes only missing or out-of-date loops (medie.py); loops made before sidecars are kept.
# Usage: assets/bin/tv-loops.sh [--force] [--upload <base-url>]
set -uo pipefail
A="$(cd "$(dirname "$0")/.." && pwd)"; L="$A/locations"; T="$A/../public/video/tv"; mkdir -p "$T"
[ "${1:-}" = --force ] && { FORCE=1; shift; } || FORCE=
M="python3 $A/bin/medie.py"
keep() { [ -z "$FORCE" ] && [ -f "$1" ] && ! $M status "$1" | grep -q '^stale'; }
meta() { $M skriv tv-loops.sh "$1" "$2" - gemini-omni-1.2-flash "$3"; } # out prompt image
job() { # name base-image location variant
  local name=$1 img=$2 loc=$3 var=$4
  keep "$T/$name.mp4" && return 0
  if [ -f "$L/$loc/varianter/$var.still.prompt.txt" ]; then
    local still="$L/$loc/still-$var.jpg"
    [ -f "$still" ] || "$A/bin/still.sh" "$img" "$L/$loc/varianter/$var.still.prompt.txt" "$still" || return 1
    img=$still
  fi
  "$A/bin/loop.sh" "$img" "$L/$loc/varianter/$var.prompt.txt" "$name" 10 && cp "$A/out/$name.mp4" "$T/$name.mp4" \
    && meta "$T/$name.mp4" "$L/$loc/varianter/$var.prompt.txt" "$img"
}
job antenne-rolig      "$L/antenne-tjern/ref.jpg"            antenne-tjern rolig
job antenne-dag11      "$L/antenne-tjern/ref.jpg"            antenne-tjern dag11
job grotte-rolig       "$L/krystallgrotten/ref.jpg"          krystallgrotten rolig
job grotte-dag12       "$L/krystallgrotten/nokkelramme.jpg"          krystallgrotten dag12
job grotte-dag15       "$L/krystallgrotten/nokkelramme.jpg"          krystallgrotten dag15
job grotte-dag21       "$L/krystallgrotten/nokkelramme.jpg"          krystallgrotten dag21
job grotte-dag23       "$L/krystallgrotten/nokkelramme.jpg"          krystallgrotten dag23
job grotte-dag24       "$L/krystallgrotten/nokkelramme.jpg"          krystallgrotten dag24
job kontor-julius      "$L/julius-kontor/vidvinkel-ref.jpg"  julius-kontor vidvinkel-ref
job kontor-tom         "$L/julius-kontor/vidvinkel-tom.jpg"  julius-kontor vidvinkel-tom
job kontor-dag14       "$L/julius-kontor/vidvinkel-tom.jpg"  julius-kontor dag14
# Snøfall village: everything from nokkelramme-v2.jpg (empty square, closed double gate, red postkasse).
V2="$L/snofall-landsby/nokkelramme-v2.jpg"
[ -f "$V2" ] || "$A/bin/still.sh" "$L/snofall-landsby/nokkelramme.jpg" "$L/snofall-landsby/varianter/v2.still.prompt.txt" "$V2" || exit 1
v2still() { # variant [base]: still-v2-<variant>.jpg made from the base (default v2)
  local s="$L/snofall-landsby/still-v2-$1.jpg"
  [ -f "$s" ] || "$A/bin/still.sh" "${2:-$V2}" "$L/snofall-landsby/varianter/$1.still.prompt.txt" "$s" >/dev/null || return 1
  echo "$s"
}
vjob() { # name image variant: state loop straight from an image
  keep "$T/$1.mp4" && return 0
  "$A/bin/loop.sh" "$2" "$L/snofall-landsby/varianter/$3.prompt.txt" "$1" 10 && cp "$A/out/$1.mp4" "$T/$1.mp4" \
    && meta "$T/$1.mp4" "$L/snofall-landsby/varianter/$3.prompt.txt" "$2"
}
vjob landsby-rolig   "$V2" rolig
vjob landsby-nordlys "$(v2still nordlys)" nordlys
vjob landsby-storm   "$(v2still storm)" storm
vjob landsby-dag24   "$(v2still dag24 "$(v2still nordlys)")" dag24
# village events: 10 s (model max with first+last frame), then pinned to the key frame at both ends
for e in brevfugler julius nissemor iq winter reinsdyr hverdag aking marked tarnklokke stjerneskudd; do
  keep "$T/landsby-$e.mp4" && continue
  "$A/bin/loop.sh" "$V2" "$L/snofall-landsby/varianter/hendelse-$e.prompt.txt" "landsby-$e.raw" 10 \
    && "$A/bin/anchor.sh" "$A/out/landsby-$e.raw.mp4" "$V2" "$T/landsby-$e.mp4" \
    && meta "$T/landsby-$e.mp4" "$L/snofall-landsby/varianter/hendelse-$e.prompt.txt" "$V2"
done
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
