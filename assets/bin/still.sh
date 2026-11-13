#!/usr/bin/env bash
# still.sh <inn.jpg> <prompt.txt> <ut.jpg> [ref.jpg ...]: new still from a reference image;
# ASPECT=1:1 for a square image (default 16:9); extra refs (e.g. a character) follow it, and the prompt says what each one is for
set -euo pipefail
# process substitutions below swallow errors, so a missing input must be caught here
for f in "$1" "$2" "${@:4}"; do [ -f "$f" ] || { echo "still.sh: mangler inndata: '$f'" >&2; exit 1; }; done
source "$(dirname "$0")/_key.sh"
P=$2; OUT=$3; TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
i=0; for img in "$1" "${@:4}"; do i=$((i+1))
  jq -n --rawfile img <(base64 -i "$img" | tr -d '\n') '{inlineData:{mimeType:"image/jpeg",data:$img}}' > "$TMP/$(printf %02d $i).json"
done
bruk bilde gemini-3-pro-image "$OUT"
jq -s . "$TMP"/*.json > "$TMP/parts"
jq -n --arg ar "${ASPECT:-16:9}" --arg p "$(cat "$P")$(python3 "$(dirname "$0")/medie.py" unngaa "${LAERDOM_TYPE:-}" "$OUT")" --slurpfile imgs "$TMP/parts" \
  '{contents:[{parts:($imgs[0]+[{text:$p}])}],generationConfig:{responseModalities:["IMAGE"],imageConfig:{aspectRatio:$ar}}}' \
| curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent" -H "x-goog-api-key: $K" -H 'Content-Type: application/json' -d @- > "$OUT.json"
jq -e '.error' "$OUT.json" >/dev/null && { jq -c .error "$OUT.json"; rm "$OUT.json"; exit 1; }
jq -r '.candidates[0].content.parts[] | select(.inlineData) | .inlineData.data' "$OUT.json" | head -1 | base64 -d > "$OUT"
# no image part (e.g. a safety block) gives an empty file and exit 0 above
[ -s "$OUT" ] || { echo "still.sh: ingen bilde i svaret, se $OUT.json" >&2; rm -f "$OUT"; exit 1; }
rm "$OUT.json"; echo "$OUT"
