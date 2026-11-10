#!/usr/bin/env bash
# tv-loops.sh: make all Snøfall TV loops from the reference stills and prompt files.
# Skips loops that already exist in public/video/tv. Usage: assets/bin/tv-loops.sh [--upload <base-url>]
set -uo pipefail
A="$(cd "$(dirname "$0")/.." && pwd)"; L="$A/locations"; T="$A/../public/video/tv"; mkdir -p "$T"
job() { # name base-image location variant
  local name=$1 img=$2 loc=$3 var=$4
  [ -f "$T/$name.mp4" ] && return 0
  if [ -f "$L/$loc/varianter/$var.still.prompt.txt" ]; then
    local still="$L/$loc/still-$var.jpg"
    [ -f "$still" ] || "$A/bin/still.sh" "$img" "$L/$loc/varianter/$var.still.prompt.txt" "$still" || return 1
    img=$still
  fi
  "$A/bin/loop.sh" "$img" "$L/$loc/varianter/$var.prompt.txt" "$name" 10 && cp "$A/out/$name.mp4" "$T/$name.mp4"
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
job landsby-storm      "$L/snofall-landsby/ramme-rolig.jpg"  snofall-landsby storm
job landsby-dag24      "$L/snofall-landsby/ramme-nordlys.jpg" snofall-landsby dag24
# random village events (start and end on the key frame of landsby-rolig)
for e in reinsdyr pakkeslede tarnklokke bakeri aking stjerneskudd; do
  job "landsby-$e" "$L/snofall-landsby/nokkelramme.jpg" snofall-landsby "hendelse-$e"
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
