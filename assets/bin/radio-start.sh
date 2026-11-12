#!/usr/bin/env bash
# radio-start.sh <fil.mp3> [sek]: transcribes the first seconds (default 8) via Gemini and fails (exit 1)
# if English style-instruction words are heard: TTS once read the director note aloud before the clip.
set -euo pipefail
source "$(dirname "$0")/_key.sh"
F=$1; S=${2:-8}
b64=$(ffmpeg -nostdin -v error -t "$S" -i "$F" -ac 1 -ar 16000 -f mp3 - | base64 | tr -d '\n')
bruk transkripsjon gemini-3.5-flash "start $(basename "$F")"
txt=$(jq -n --arg a "$b64" '{contents:[{parts:[{inlineData:{mimeType:"audio/mp3",data:$a}},{text:"Transcribe exactly what is said, in the language spoken. Output only the transcript."}]}]}' \
  | curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent" -H "x-goog-api-key: $K" -H 'Content-Type: application/json' -d @- \
  | jq -r '.candidates[0].content.parts[-1].text // .error.message')
echo "$(basename "$F"): $txt"
! echo "$txt" | grep -qiwE 'say|cheerfully|voice|accent|northern|norwegian|silly|giggles|breathless|sing-song|lilting|intonation|rolled|words such'
