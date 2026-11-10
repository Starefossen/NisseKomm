#!/usr/bin/env bash
# seamless.sh in.mp4 out.mp4 [fade_s]: crossfade tail into head so the loop has no seam
set -euo pipefail
IN=$1; OUT=$2; D=${3:-1}
T=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
ffmpeg -nostdin -y -v error -i "$IN" -filter_complex "
[0:v]fps=24,format=yuv420p,split=3[a][b][c];
[a]trim=start=$(echo "$T-$D"|bc):end=$T,setpts=PTS-STARTPTS[tail];
[b]trim=start=0:end=$D,setpts=PTS-STARTPTS[head];
[tail][head]xfade=transition=fade:duration=$D:offset=0[blend];
[c]trim=start=$D:end=$(echo "$T-$D"|bc),setpts=PTS-STARTPTS[mid];
[blend][mid]concat=n=2:v=1[v]" -map "[v]" -an -c:v libx264 -crf 18 -g 24 -movflags +faststart "$OUT"
