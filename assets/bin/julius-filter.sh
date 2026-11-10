#!/usr/bin/env bash
# julius-filter.sh <raw.mp4> <out.mp4>: the 1970s radio-studio look and sound on a raw Julius clip. No API calls.
# FILTER_VERSION goes in the sidecar (medie.py); bump it when you change the filter below.
# click = soft 25 ms «tape» thump (brown noise, lowpassed) at start and end; hiss = quiet pink noise under the voice.
set -euo pipefail
FILTER_VERSION=2
IN=$1; OUT=$2
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
ffmpeg -nostdin -y -v error -i "$IN" -f lavfi -i "anoisesrc=c=pink:a=0.006:d=$DUR" -f lavfi -i "anoisesrc=c=brown:a=0.12:d=0.025" \
  -filter_complex "[0:v]eq=saturation=0.8:contrast=1.08,curves=preset=vintage,noise=alls=14:allf=t,vignette=PI/4.5,geq=lum='lum(X,Y)*(0.9+0.1*mod(Y\\,3))':cb='cb(X,Y)':cr='cr(X,Y)'[v];
  [0:a]highpass=f=250,lowpass=f=4000,equalizer=f=1200:t=q:w=1:g=4,acompressor=threshold=0.1:ratio=3,aecho=0.8:0.4:15:0.15[voice];
  [2:a]lowpass=f=1500,afade=t=in:d=0.005,afade=t=out:st=0.02:d=0.005,asplit[c1][c2];[c2]adelay=$(awk "BEGIN{print int(($DUR-0.1)*1000)}")[c2d];
  [voice][1:a][c1][c2d]amix=inputs=4:duration=first:normalize=0[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 20 -c:a aac "$OUT"
