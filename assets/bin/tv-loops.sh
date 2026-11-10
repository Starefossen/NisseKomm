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
V2="$L/snofall-landsby/nokkelramme-v2.jpg"; LV="$L/snofall-landsby/varianter"
v2() { [ -f "$V2" ] || "$A/bin/still.sh" "$L/snofall-landsby/nokkelramme.jpg" "$LV/v2.still.prompt.txt" "$V2" >/dev/null || return 1; echo "$V2"; }
v2still() { # variant [base]: still-v2-<variant>.jpg made from the base (default v2)
  local s="$L/snofall-landsby/still-v2-$1.jpg" b=${2:-}
  [ -n "$b" ] || b=$(v2) || return 1
  [ -f "$s" ] || "$A/bin/still.sh" "$b" "$LV/$1.still.prompt.txt" "$s" >/dev/null || return 1
  echo "$s"
}
tidstill() { # time of day: still-tid-<tid>.jpg, same framing as nokkelramme-rolig.jpg
  local s="$L/snofall-landsby/still-tid-$1.jpg"
  [ -f "$s" ] || "$A/bin/still.sh" "$L/snofall-landsby/nokkelramme-rolig.jpg" "$LV/tid-$1.still.prompt.txt" "$s" >/dev/null || return 1
  echo "$s"
}
vjob() { # name variant image-command...: state loop; the image is made only when the job runs
  keep "$T/$1.mp4" && return 0
  local name=$1 var=$2 img; shift 2; img=$("$@") || return 1
  "$A/bin/loop.sh" "$img" "$LV/$var.prompt.txt" "$name" 10 && cp "$A/out/$name.mp4" "$T/$name.mp4" \
    && meta "$T/$name.mp4" "$LV/$var.prompt.txt" "$img"
}
vjob landsby-rolig   rolig      v2
vjob landsby-nordlys nordlys    v2still nordlys
vjob landsby-storm   storm      v2still storm
vjob landsby-dag24   dag24      v2still dag24 "$L/snofall-landsby/still-v2-nordlys.jpg"
vjob landsby-morgen  tid-morgen tidstill morgen  # skumring is rolig
vjob landsby-dag     tid-dag    tidstill dag
vjob landsby-natt    tid-natt   tidstill natt
# Events cut only into their own state loop and are anchored to that loop's first frame
# (10 s, the model max with first+last frame, then pinned to the key frame at both ends).
first() { # state loop -> its first frame as jpg
  local k="$A/out/forste-$1.jpg"
  [ -f "$T/$1.mp4" ] || { echo "mangler $T/$1.mp4 (lag tilstanden før hendelsene)" >&2; return 1; }
  ffmpeg -nostdin -y -v error -i "$T/$1.mp4" -frames:v 1 -q:v 2 "$k" && echo "$k"
}
ejob() { # name state event: one event clip for a state loop
  keep "$T/$1.mp4" && return 0
  local key; key=$(first "$2") || return 1
  "$A/bin/loop.sh" "$key" "$LV/hendelse-$3.prompt.txt" "$1.raw" 10 \
    && "$A/bin/anchor.sh" "$A/out/$1.raw.mp4" "$key" "$T/$1.mp4" \
    && meta "$T/$1.mp4" "$LV/hendelse-$3.prompt.txt" "$key"
}
for e in brevfugler julius nissemor iq winter reinsdyr hverdag aking marked tarnklokke stjerneskudd; do ejob "landsby-$e" landsby-rolig "$e"; done
for e in brevfugler hverdag reinsdyr; do ejob "landsby-morgen-$e" landsby-morgen "$e"; done
for e in aking marked hverdag; do ejob "landsby-dag-$e" landsby-dag "$e"; done
for e in stjerneskudd tarnklokke reinsdyr; do ejob "landsby-natt-$e" landsby-natt "$e"; done
# Gate camera: the closed gate (port-nokkelramme.jpg) is first and last frame; the gate opens and closes in the clip.
PK="$L/snofall-landsby/port-nokkelramme.jpg"
for c in julius nissemor iq winter; do
  keep "$T/port-$c.mp4" && continue
  "$A/bin/loop.sh" "$PK" "$LV/port-$c.prompt.txt" "port-$c.raw" 10 \
    && "$A/bin/anchor.sh" "$A/out/port-$c.raw.mp4" "$PK" "$T/port-$c.mp4" \
    && meta "$T/port-$c.mp4" "$LV/port-$c.prompt.txt" "$PK"
done
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
