#!/usr/bin/env bash
# Usage: julius.sh <out-name> "<replikk på bokmål>" ["<handling>"] [seconds]
# ponytail: one clip per call, synchronous; batch/parallel if we do all 24 days
set -euo pipefail
source "$(dirname "$0")/_key.sh"; A="$ROOT/assets"; D="$A/out"; mkdir -p "$D"; NAME=$1; LINE=$2; ACTION=${3:-"Han smiler lurt mot slutten."}; SECS=${4:-10}
P="Bruk referansebildet som første bilde: samme mann, samme rom, samme lys, samme utsnitt.
$(cat "$A/characters/julius/beskrivelse.txt")
HANDLING: $ACTION
REPLIKK (sies inn i mikrofonen, ordrett): \"$LINE\"
Lengde: $SECS sekunder. Replikken er ferdig uttalt senest 2 sekunder før klippet slutter; de siste sekundene er han stille og smiler inn i mikrofonen.
Single continuous shot, no scene cuts.
Do not add, remove or change any object: no telephone, no cups other than the wooden mug, no bells, bottles, vases, quills or magnifying glass. Do not move the microphone to the left hand, do not use both hands on it, do not let it disappear. Do not show a third hand. Everything on the desk in the first frame is still there in the last frame."
jq -n --arg p "$P" --arg secs "$SECS" --rawfile img <(base64 -i "$A/characters/julius/ref-v3.jpg" | tr -d '\n') \
  '{model:"gemini-omni-1.2-flash",input:[{type:"image",data:$img,mime_type:"image/jpeg"},{type:"text",text:$p}],response_format:{type:"video",duration:($secs+"s")}}' > "$D/$NAME.req.json"
curl -s "https://generativelanguage.googleapis.com/v1beta/interactions" -H "x-goog-api-key: $K" -H 'Content-Type: application/json' -d @"$D/$NAME.req.json" > "$D/$NAME.resp.json"
if [ -n "${GENERER_LOGG:-}" ]; then echo "video $NAME" >> "$GENERER_LOGG"; fi  # generer.py counts sent requests
jq -e .error "$D/$NAME.resp.json" && exit 1
jq -r '.steps[] | select(.type=="model_output") | (.content // .output)[] | select(.type=="video") | .data' "$D/$NAME.resp.json" | base64 -d > "$D/$NAME.raw.mp4"
"$(dirname "$0")/julius-filter.sh" "$D/$NAME.raw.mp4" "$D/$NAME.mp4"  # look and sound: no API call, rerun alone to tweak
jq -r ".id // empty" "$D/$NAME.resp.json" > "$D/$NAME.id"; rm "$D/$NAME.resp.json"  # keep the interaction id for edit prompts
echo "$D/$NAME.mp4"
