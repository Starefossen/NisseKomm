#!/usr/bin/env bash
# julius-filter.sh <raw.mp4> <out.mp4>: the 1970s radio-studio look and sound on a raw Julius clip. No API calls.
# FILTER_VERSION goes in the sidecar (medie.py); bump it when you change the filter below.
# hiss = quiet pink noise under the voice. No per-clip «tape» thumps (v2): they doubled up as clicks at every join.
# Loudness is set once in julius-dag.py's join, not here.
set -euo pipefail
FILTER_VERSION=3
IN=$1; OUT=$2
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
ffmpeg -nostdin -y -v error -i "$IN" -f lavfi -i "anoisesrc=c=pink:a=0.006:d=$DUR" \
  -filter_complex "[0:v]eq=saturation=0.8:contrast=1.08,curves=preset=vintage,noise=alls=14:allf=t,vignette=PI/4.5,geq=lum='lum(X,Y)*(0.9+0.1*mod(Y\\,3))':cb='cb(X,Y)':cr='cr(X,Y)'[v];
  [0:a]highpass=f=250,lowpass=f=4000,equalizer=f=1200:t=q:w=1:g=4,acompressor=threshold=0.1:ratio=3,aecho=0.8:0.4:15:0.15[voice];
  [voice][1:a]amix=inputs=2:duration=first:normalize=0[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 20 -c:a aac "$OUT"
