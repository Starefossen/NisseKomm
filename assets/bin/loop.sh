#!/usr/bin/env bash
# loop.sh <inn.jpg> <prompt.txt> <navn> [sek]: loop from a still (first = last frame), seam hidden
set -euo pipefail
source "$(dirname "$0")/_key.sh"
OUT="$ROOT/assets/out"; mkdir -p "$OUT"; N=$3; S=${4:-10}
jq -n --rawfile p "$2" --arg s "${S}s" --rawfile img <(base64 -i "$1" | tr -d '\n') \
  '{model:"gemini-omni-1.2-flash",input:[{type:"image",data:$img,mime_type:"image/jpeg"},{type:"image",data:$img,mime_type:"image/jpeg"},{type:"text",text:$p}],response_format:{type:"video",duration:$s}}' \
| curl -s "https://generativelanguage.googleapis.com/v1beta/interactions" -H "x-goog-api-key: $K" -H 'Content-Type: application/json' -d @- > "$OUT/$N.json"
jq -e '.error' "$OUT/$N.json" >/dev/null && { jq -c .error "$OUT/$N.json"; rm "$OUT/$N.json"; exit 1; }
jq -r '.steps[] | select(.type=="model_output") | (.content // .output)[] | select(.type=="video") | .data' "$OUT/$N.json" | base64 -d > "$OUT/$N.raw.mp4"
rm "$OUT/$N.json"
"$(dirname "$0")/seamless.sh" "$OUT/$N.raw.mp4" "$OUT/$N.mp4" 1.5
echo "$OUT/$N.mp4"
