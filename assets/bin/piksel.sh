#!/usr/bin/env bash
# piksel.sh <inn> <ut.png> [px=96] [farger=32]: retro pixel version with a small palette.
# ffmpeg only (no ImageMagick on this machine); the app scales it up with image-rendering: pixelated.
set -euo pipefail
PX=${3:-96}; N=${4:-32}; PAL=$(mktemp).png
ffmpeg -v error -y -i "$1" -vf "scale=$PX:$PX:flags=area,palettegen=max_colors=$N:stats_mode=full" "$PAL"
ffmpeg -v error -y -i "$1" -i "$PAL" -lavfi "[0:v]scale=$PX:$PX:flags=area[x];[x][1:v]paletteuse=dither=none" "$2"
rm -f "$PAL"; echo "$2"
