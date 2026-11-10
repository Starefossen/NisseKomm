#!/usr/bin/env bash
# rampenissen-tts.sh <dag> [stemme]: Rampenissen's radio clip from the locked script, via Gemini TTS.
# Writes public/audio/rampenissen/dag-NN.mp3. Default voice: Fenrir (Hans chose it 10 Nov).
set -euo pipefail
source "$(dirname "$0")/_key.sh"
D=$1; V=${2:-Fenrir}; O="$ROOT/public/audio/rampenissen"; T="$ROOT/assets/out/rampenissen"; mkdir -p "$O" "$T"
text=$(awk "/^## Dag $D /{p=1} /^## Dag $((D+1)) /{p=0} p" "$ROOT/docs/manus/rampenissen-radio-2026.md" | grep '^\*\*Klipp:\*\*' | sed 's/^\*\*Klipp:\*\* «//; s/»$//')
[ -n "$text" ] || { echo "Fant ikke klipp for dag $D"; exit 1; }
jq -n --arg t "Les dette som Rampenissen: en fjollete, rask og litt andpusten nisse med lys stemme, på norsk bokmål med østlandsk tone. Han er ivrig og litt skyldbevisst, ler kort innimellom. Les nøyaktig teksten, ingenting annet: $text" --arg v "$V" \
  '{contents:[{parts:[{text:$t}]}],generationConfig:{responseModalities:["AUDIO"],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:$v}}}}}' \
| curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent" -H "x-goog-api-key: $K" -H 'Content-Type: application/json' -d @- > "$T/r.json"
jq -e '.error' "$T/r.json" >/dev/null && { jq -c .error "$T/r.json"; exit 1; }
jq -r '.candidates[0].content.parts[0].inlineData.data' "$T/r.json" | base64 -d > "$T/r.pcm"
F="$O/dag-$(printf %02d "$D").mp3"
ffmpeg -nostdin -y -v error -f s16le -ar 24000 -ac 1 -i "$T/r.pcm" -c:a libmp3lame -b:a 96k "$F"
echo "$F"
