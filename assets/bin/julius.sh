#!/usr/bin/env bash
# Usage: [REF=start.jpg | PREV=<interaction id>] julius.sh <out-name> "<replikk på bokmål>" ["<handling>"] [seconds]
# ponytail: one clip per call, synchronous; batch/parallel if we do all 24 days
set -euo pipefail
source "$(dirname "$0")/_key.sh"; A="$ROOT/assets"; D="$A/out"; mkdir -p "$D"; NAME=$1; LINE=$2; ACTION=${3:-"Han smiler lurt mot slutten."}; SECS=${4:-10}
P="Bruk referansebildet som første bilde: samme mann, samme rom, samme lys, samme utsnitt.
$(cat "$A/characters/julius/beskrivelse.txt")
HANDLING: $ACTION
REPLIKK (sies inn i mikrofonen, ordrett): \"$LINE\"
Lengde: $SECS sekunder.
[0–$((SECS-2)) s] Han sier replikken og er ferdig med siste ord.
[$((SECS-2))–$SECS s] Han er stille med lukket munn og smiler inn i mikrofonen.
Single continuous shot, no scene cuts.
Do not add, remove or change any object: no telephone, no cups other than the wooden mug, no bells, bottles, vases, quills or magnifying glass. Do not move the microphone to the left hand, do not use both hands on it, do not let it disappear. Do not show a third hand. Everything on the desk in the first frame is still there in the last frame."
# Hans' rules from Lærdom, outside the hashed P text above (medie.py records them in the sidecar)
U=$(python3 "$(dirname "$0")/medie.py" unngaa julius); P="$P$U"
if [ -n "${PREV:-}" ]; then  # Extend: the reply is the whole chain so far plus SECS (3-10) of new speech
P="Fortsett det samme klippet uten kutt: samme mann, samme rom, samme lys, samme utsnitt, samme stemme.
HANDLING: $ACTION
REPLIKK (sies inn i mikrofonen, ordrett): \"$LINE\"
Han begynner å snakke med en gang. Replikken er ferdig uttalt senest 1 sekund før klippet slutter; så er han stille og smiler inn i mikrofonen.
Single continuous shot, no scene cuts. Do not add, remove or change any object. Keep the microphone in his right hand.$U"
jq -n --arg p "$P" --arg secs "$SECS" --arg prev "$PREV" \
  '{model:"gemini-omni-1.2-flash",previous_interaction_id:$prev,input:[{type:"text",text:$p}],response_format:{type:"video",duration:($secs+"s")}}' > "$D/$NAME.req.json"
else
# KRYSTALL_FOTO: Hans' photo of the objects Julius holds, as a second reference image
[ -n "${KRYSTALL_FOTO:-}" ] && P="$P
Det andre bildet viser de tre bergkrystallene han holder i venstre håndflate: samme tre biter, samme form og farge."
jq -n --arg p "$P" --arg secs "$SECS" --rawfile img <(base64 -i "${REF:-$A/characters/julius/ref-v3.jpg}" | tr -d '\n') \
  --rawfile img2 <(if [ -n "${KRYSTALL_FOTO:-}" ]; then base64 -i "$KRYSTALL_FOTO" | tr -d '\n'; fi) \
  '{model:"gemini-omni-1.2-flash",input:([{type:"image",data:$img,mime_type:"image/jpeg"}] + (if $img2 != "" then [{type:"image",data:$img2,mime_type:"image/jpeg"}] else [] end) + [{type:"text",text:$p}]),response_format:{type:"video",duration:($secs+"s")}}' > "$D/$NAME.req.json"
fi
bruk video gemini-omni-1.2-flash "$NAME"
curl -s "https://generativelanguage.googleapis.com/v1beta/interactions" -H "x-goog-api-key: $K" -H 'Content-Type: application/json' -d @"$D/$NAME.req.json" > "$D/$NAME.resp.json"
if [ -n "${GENERER_LOGG:-}" ]; then echo "video $NAME" >> "$GENERER_LOGG"; fi  # generer.py counts sent requests
jq -e .error "$D/$NAME.resp.json" && exit 1
jq -r '.steps[] | select(.type=="model_output") | (.content // .output)[] | select(.type=="video") | .data' "$D/$NAME.resp.json" | base64 -d > "$D/$NAME.raw.mp4"
"$(dirname "$0")/julius-filter.sh" "$D/$NAME.raw.mp4" "$D/$NAME.mp4"  # look and sound: no API call, rerun alone to tweak
jq -r ".id // empty" "$D/$NAME.resp.json" > "$D/$NAME.id"; jq -c ".usage // {}" "$D/$NAME.resp.json" > "$D/$NAME.usage.json"; rm "$D/$NAME.resp.json"  # keep the interaction id for edit prompts
echo "$D/$NAME.mp4"
