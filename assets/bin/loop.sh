#!/usr/bin/env bash
# loop.sh <inn.jpg> <prompt.txt> <navn> [sek] [ref.jpg]: loop from a still (first = last frame), seam hidden;
# FORSTE=1 sends the still as first frame only (no last frame), so the model need not morph a
# person away to match it (anchor.sh crossfades the ends instead); an optional ref (a character's look) is sent after the two frames, and the prompt says so
set -euo pipefail
# process substitutions below swallow errors, so a missing input must be caught here
for f in "$1" "$2" ${5:+"$5"}; do [ -f "$f" ] || { echo "loop.sh: mangler inndata: '$f'" >&2; exit 1; }; done
source "$(dirname "$0")/_key.sh"
OUT="$ROOT/assets/out"; mkdir -p "$OUT"; N=$3; S=${4:-10}
R=${5:-}
bruk video gemini-omni-1.2-flash "$N"
jq -n --arg p "$(cat "$2")$(python3 "$(dirname "$0")/medie.py" unngaa "${LAERDOM_TYPE:-tv}")" --arg s "${S}s" --arg forste "${FORSTE:-}" --rawfile img <(base64 -i "$1" | tr -d '\n') --rawfile ref <(if [ -n "$R" ]; then base64 -i "$R" | tr -d '\n'; fi) \
  '{model:"gemini-omni-1.2-flash",input:([{type:"image",data:$img,mime_type:"image/jpeg"}]+(if $forste=="1" then [] else [{type:"image",data:$img,mime_type:"image/jpeg"}] end)+(if $ref=="" then [] else [{type:"image",data:$ref,mime_type:"image/jpeg"}] end)+[{type:"text",text:$p}]),response_format:{type:"video",duration:$s}}' \
| curl -s "https://generativelanguage.googleapis.com/v1beta/interactions" -H "x-goog-api-key: $K" -H 'Content-Type: application/json' -d @- > "$OUT/$N.json"
if [ -n "${GENERER_LOGG:-}" ]; then echo "video $N" >> "$GENERER_LOGG"; fi  # generer.py counts sent requests
jq -e '.error' "$OUT/$N.json" >/dev/null && { jq -c .error "$OUT/$N.json"; rm "$OUT/$N.json"; exit 1; }
jq -r '.steps[] | select(.type=="model_output") | (.content // .output)[] | select(.type=="video") | .data' "$OUT/$N.json" | base64 -d > "$OUT/$N.raw.mp4"
rm "$OUT/$N.json"
# SEAM=0 (anchored events): keep the full raw clip; a seam crossfade would cut the event's ending
if [ "${SEAM:-1}" = 0 ]; then cp "$OUT/$N.raw.mp4" "$OUT/$N.mp4"; else "$(dirname "$0")/seamless.sh" "$OUT/$N.raw.mp4" "$OUT/$N.mp4" 1.5; fi
echo "$OUT/$N.mp4"
