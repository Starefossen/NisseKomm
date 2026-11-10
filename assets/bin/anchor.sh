#!/usr/bin/env bash
# anchor.sh <in.mp4> <key.jpg> <out.mp4> [fade]: start and end an event clip exactly on the key frame,
# fading from/to the still over <fade> seconds, so it cuts into the state loop without a visible jump.
set -euo pipefail
IN=$1; KEY=$2; OUT=$3; F=${4:-0.6}
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
ffmpeg -nostdin -y -v error -i "$IN" -loop 1 -t "$D" -i "$KEY" -filter_complex "
[1:v]scale=1280:720,fps=24,format=yuva420p[k];
[0:v]fps=24,scale=1280:720,format=yuva420p[v];
[k]split[k1][k2];
[k1]fade=t=out:st=0:d=$F:alpha=1[kin];
[k2]fade=t=in:st=$(echo "$D-$F" | bc):d=$F:alpha=1[kout];
[v][kin]overlay[a];[a][kout]overlay,format=yuv420p[o]" -map "[o]" -an -c:v libx264 -crf 18 -movflags +faststart "$OUT"
