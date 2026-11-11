#!/usr/bin/env bash
# portrett.sh <prompt.txt> <ut.png> [ref.jpg ...]: square portrait from a prompt, with optional
# reference images (the prompt says what each one is for). Pixel version for the app: bin/piksel.sh.
set -euo pipefail
source "$(dirname "$0")/_key.sh"
P=$1; OUT=$2; shift 2
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
for img in "$@"; do
  jq -n --rawfile img <(base64 -i "$img" | tr -d '\n') '{inlineData:{mimeType:"image/jpeg",data:$img}}' > "$TMP/$(basename "$img").json"
done
jq -s . "$TMP"/*.json > "$TMP/parts.json" 2>/dev/null || echo '[]' > "$TMP/parts.json"
jq -n --rawfile p "$P" --slurpfile imgs "$TMP/parts.json" \
  '{contents:[{parts:($imgs[0]+[{text:$p}])}],generationConfig:{responseModalities:["IMAGE"],imageConfig:{aspectRatio:"1:1"}}}' \
| curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent" -H "x-goog-api-key: $K" -H 'Content-Type: application/json' -d @- > "$OUT.json"
jq -e '.error' "$OUT.json" >/dev/null && { jq -c .error "$OUT.json"; rm "$OUT.json"; exit 1; }
jq -r '.candidates[0].content.parts[] | select(.inlineData) | .inlineData.data' "$OUT.json" | head -1 | base64 -d > "$OUT"
rm "$OUT.json"; echo "$OUT"
