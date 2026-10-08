#!/bin/sh
# STEP 1 proxy. The supplied file (Sequence_01.mp4) is already an upright 1080x1920 25 fps H.264
# export (66.36 s), so no rotation is applied; trim source 3.0 s -> 64.2 s (61.2 s = 1530 frames).
set -e
SRC=${1:?usage: prep.sh <source video>}
mkdir -p public out pipeline/work
ffmpeg -v error -y -ss 3.0 -i "$SRC" -t 61.2 -vf "scale=1080:1920,fps=25,format=yuv420p" \
  -c:v libx264 -crf 16 -preset slow -c:a aac -b:a 192k -movflags +faststart public/footage.mp4
