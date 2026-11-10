#!/usr/bin/env bash
# Usage: julius.sh <out-name> "<replikk på bokmål>" ["<handling>"] [seconds]
# ponytail: one clip per call, synchronous; batch/parallel if we do all 24 days
set -euo pipefail
source "$(dirname "$0")/_key.sh"; A="$ROOT/assets"; D="$A/out"; mkdir -p "$D"; NAME=$1; LINE=$2; ACTION=${3:-"Han smiler lurt mot slutten."}; SECS=${4:-10}
P="Bruk referansebildet som første bilde: samme mann, samme rom, samme lys, samme utsnitt.
$(cat "$A/characters/julius/beskrivelse.txt")
HANDLING: $ACTION
REPLIKK (sies inn i mikrofonen, ordrett): \"$LINE\"
Lengde: $SECS sekunder. Single continuous shot, no scene cuts.
Do not add, remove or change any object: no telephone, no cups other than the wooden mug, no bells, bottles, vases, quills or magnifying glass. Do not move the microphone to the left hand, do not use both hands on it, do not let it disappear. Do not show a third hand. Everything on the desk in the first frame is still there in the last frame."
jq -n --arg p "$P" --arg secs "$SECS" --rawfile img <(base64 -i "$A/characters/julius/ref-v3.jpg" | tr -d '\n') \
  '{model:"gemini-omni-1.2-flash",input:[{type:"image",data:$img,mime_type:"image/jpeg"},{type:"text",text:$p}],response_format:{type:"video",duration:($secs+"s")}}' > "$D/$NAME.req.json"
curl -s "https://generativelanguage.googleapis.com/v1beta/interactions" -H "x-goog-api-key: $K" -H 'Content-Type: application/json' -d @"$D/$NAME.req.json" > "$D/$NAME.resp.json"
jq -e .error "$D/$NAME.resp.json" && exit 1
jq -r '.steps[] | select(.type=="model_output") | (.content // .output)[] | select(.type=="video") | .data' "$D/$NAME.resp.json" | base64 -d > "$D/$NAME.raw.mp4"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$D/$NAME.raw.mp4")
# click = 15 ms noise burst at start and end; hiss = quiet pink noise under the voice
ffmpeg -nostdin -y -v error -i "$D/$NAME.raw.mp4" -f lavfi -i "anoisesrc=c=pink:a=0.006:d=$DUR" -f lavfi -i "anoisesrc=c=white:a=0.5:d=0.015" \
  -filter_complex "[0:v]eq=saturation=0.8:contrast=1.08,curves=preset=vintage,noise=alls=14:allf=t,vignette=PI/4.5,geq=lum='lum(X,Y)*(0.9+0.1*mod(Y\\,3))':cb='cb(X,Y)':cr='cr(X,Y)'[v];
  [0:a]highpass=f=250,lowpass=f=4000,equalizer=f=1200:t=q:w=1:g=4,acompressor=threshold=0.1:ratio=3,aecho=0.8:0.4:15:0.15[voice];
  [2:a]asplit[c1][c2];[c2]adelay=$(awk "BEGIN{print int(($DUR-0.1)*1000)}")[c2d];
  [voice][1:a][c1][c2d]amix=inputs=4:duration=first:normalize=0[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 20 -c:a aac "$D/$NAME.mp4"
jq -r ".id // empty" "$D/$NAME.resp.json" > "$D/$NAME.id"; rm "$D/$NAME.resp.json"  # keep the interaction id for edit prompts
echo "$D/$NAME.mp4"
