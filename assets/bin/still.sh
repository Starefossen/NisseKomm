#!/usr/bin/env bash
# still.sh <inn.jpg> <prompt.txt> <ut.jpg>: new still from a reference image
set -euo pipefail
source "$(dirname "$0")/_key.sh"
jq -n --rawfile p "$2" --rawfile img <(base64 -i "$1" | tr -d '\n') \
  '{contents:[{parts:[{inlineData:{mimeType:"image/jpeg",data:$img}},{text:$p}]}],generationConfig:{responseModalities:["IMAGE"],imageConfig:{aspectRatio:"16:9"}}}' \
| curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent" -H "x-goog-api-key: $K" -H 'Content-Type: application/json' -d @- > "$3.json"
jq -e '.error' "$3.json" >/dev/null && { jq -c .error "$3.json"; rm "$3.json"; exit 1; }
jq -r '.candidates[0].content.parts[] | select(.inlineData) | .inlineData.data' "$3.json" | head -1 | base64 -d > "$3"
rm "$3.json"; echo "$3"
