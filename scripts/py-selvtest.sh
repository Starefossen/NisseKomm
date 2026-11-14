#!/usr/bin/env bash
# All Python/shell selftests of the media scripts, in parallel. Stdlib only, no paid calls.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
B=assets/bin
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
i=0
# julius-dag selftest includes test-kutt (ffmpeg); test-port runs on its own.
# The dummy key keeps _key.sh from asking fnox for the real one; selftests make no calls.
for c in "python3 $B/medie.py --selvtest" "python3 $B/generer.py --selvtest" \
  "python3 $B/forbruk.py --selvtest" "python3 $B/tall.py --selvtest" \
  "python3 $B/inventar.py --selvtest" "python3 $B/piksel-sprite.py --selvtest" \
  "python3 $B/julius-dag.py selftest" "python3 $B/julius-dag.py test-port" \
  "bash $B/rampenissen-tts.sh selftest"; do
  i=$((i + 1))
  GEMINI_API_KEY=selvtest $c >"$T/$i.log" 2>&1 || echo "$c" >"$T/$i.feil" &
done
wait
shopt -s nullglob
f=("$T"/*.feil)
((${#f[@]} == 0)) && exit 0
for x in "${f[@]}"; do echo "SELVTEST FEIL: $(cat "$x")"; tail -20 "${x%.feil}.log"; done
exit 1
