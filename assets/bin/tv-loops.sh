#!/usr/bin/env bash
# tv-loops.sh: make all Snøfall TV loops from the reference stills and prompt files.
# Skips loops that already exist in public/video/tv. Usage: assets/bin/tv-loops.sh
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
job grotte-dag12       "$L/krystallgrotten/ref.jpg"          krystallgrotten dag12
job grotte-dag15       "$L/krystallgrotten/ref.jpg"          krystallgrotten dag15
job grotte-dag21       "$L/krystallgrotten/ref.jpg"          krystallgrotten dag21
job grotte-dag23       "$L/krystallgrotten/ref.jpg"          krystallgrotten dag23
job grotte-dag24       "$L/krystallgrotten/ref.jpg"          krystallgrotten dag24
job kontor-julius      "$L/julius-kontor/vidvinkel-ref.jpg"  julius-kontor vidvinkel-ref
job kontor-tom         "$L/julius-kontor/vidvinkel-tom.jpg"  julius-kontor vidvinkel-tom
job kontor-dag14       "$L/julius-kontor/vidvinkel-tom.jpg"  julius-kontor dag14
job landsby-storm      "$L/snofall-landsby/ramme-rolig.jpg"  snofall-landsby storm
job landsby-dag24      "$L/snofall-landsby/ramme-nordlys.jpg" snofall-landsby dag24
ls "$T"
