#!/usr/bin/env bash
# rampenissen-tts.sh <dag> [stemme] [--force]: Rampenissen's radio clip from the locked script, via Gemini TTS.
# Writes public/audio/rampenissen/dag-NN.mp3. Default voice: Fenrir, nordnorsk delivery, +4 semitones, -16 LUFS
# (Hans chose it 10 Nov). The clips are written in nordlandsk (Bodø/Salten) since 10 Nov; see «Skrivemåte» in the script.
# Script gate: refuses TTS unless manus/radio/dag-NN is approved in the guide on today's text (medie.py radio-port).
# --uten-manusgodkjenning skips it: use it ONLY when Hans has said yes explicitly.
# Skips a day whose clip is current (medie.py) unless --force; writes dag-NN.mp3.meta.json.
set -euo pipefail
source "$(dirname "$0")/_key.sh"
FORCE=; UTEN=
ARGS=()
for a in "$@"; do
  case $a in --force) FORCE=1 ;; --uten-manusgodkjenning) UTEN=1 ;; *) ARGS+=("$a") ;; esac
done
[ ${#ARGS[@]} -gt 0 ] && set -- "${ARGS[@]}" || set --
D=$1; V=${2:-Fenrir}; O="$ROOT/public/audio/rampenissen"; T="$ROOT/assets/out/rampenissen"; mkdir -p "$O" "$T"
M="python3 $ROOT/assets/bin/medie.py"; F="$O/dag-$(printf %02d "$D").mp3"
# «synger»: the hidden NisseMusikk track, Rampenissen sings a short carol badly (text in characters/rampenissen/synger.txt)
SRC="$ROOT/docs/manus/rampenissen-radio-2026.md"; SEC="Dag $D"; STIL=$($M stil rampenissen)
if [ "$D" = synger ]; then
  SRC="$ROOT/assets/characters/rampenissen/synger.txt"; SEC=-; F="$ROOT/public/music/rampenissen-synger.mp3"; mkdir -p "$(dirname "$F")"
  STIL="Sing this short Christmas song badly and happily, off-key, too fast, with a giggle, in a sweet silly voice with a Northern Norwegian (Tromsø) accent:"
fi
[ -z "$FORCE" ] && $M status "$F" >/dev/null && { echo "$F er oppdatert; --force for å lage den på nytt"; exit 0; }
if [ "$D" = synger ]; then text=$(cat "$SRC"); else text=$($M tekst rampenissen "$D"); fi
[ -n "$text" ] || { echo "Fant ikke klipp for dag $D"; exit 1; }
[ "$D" = synger ] || [ -n "$UTEN" ] || $M radio-port "$D"
bruk tts gemini-3.8-flash-tts "$F"
# The style as plain prose before the text was sometimes read aloud (days 5, 9, 10, 17, 21). systemInstruction is refused
# by the TTS model (400), so use the director's-notes/transcript layout Google documents: only TRANSCRIPT is spoken.
# radio-start.sh below still checks the start.
jq -n --arg t "### DIRECTOR'S NOTES (never read aloud)
$STIL

#### TRANSCRIPT
$text" --arg v "$V" \
  '{contents:[{parts:[{text:$t}]}],generationConfig:{responseModalities:["AUDIO"],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:$v}}}}}' \
| curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent" -H "x-goog-api-key: $K" -H 'Content-Type: application/json' -d @- > "$T/r.json"
jq -e '.error' "$T/r.json" >/dev/null && { jq -c .error "$T/r.json"; exit 1; }
jq -r '.candidates[0].content.parts[0].inlineData.data' "$T/r.json" | base64 -d > "$T/r.pcm"
# +4 semitones via asetrate (rubberband is not available), then two-pass EBU R128 loudnorm to -16 LUFS / -1.5 dBTP
# (single-pass lands several LU off). Raw PCM is kept per day so post-processing can rerun without a TTS call.
cp "$T/r.pcm" "$T/$(basename "$F" .mp3).pcm"
r=$(python3 -c "print(2**(4/12))")
pre="asetrate=24000*$r,aresample=24000,atempo=1/$r"
in=(-nostdin -y -f s16le -ar 24000 -ac 1 -i "$T/r.pcm")
m=$(ffmpeg "${in[@]}" -af "$pre,loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$m" | jq -r ".$1"; }
ffmpeg -v error "${in[@]}" -af "$pre,loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=24000" -ac 1 -c:a libmp3lame -b:a 128k "$F"
"$ROOT/assets/bin/radio-start.sh" "$F" || { echo "Engelsk instruks hørt i starten av $F"; exit 1; }
$M skriv rampenissen-tts.sh "$F" "$SRC" "$SEC" "gemini-3.8-flash-tts/$V"
echo "$F"
