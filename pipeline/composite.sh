#!/bin/sh
# base.mp4 = footage + TV layer, with the TV layer cut out wherever the presenter matte is (matte
# dilated ~4 px + feathered), so tracked graphics always sit behind the presenter. Audio is copied.
set -e
ffmpeg -v error -y -i public/footage.mp4 -i pipeline/work/tv_layer.mov -i pipeline/work/matte.mkv -filter_complex "\
[2:v]format=gray,dilation,dilation,dilation,dilation,gblur=sigma=2,negate[keep];\
[1:v]format=yuva444p,split[tvc][tva];[tva]alphaextract[a];\
[a][keep]blend=all_mode=multiply[am];\
[tvc][am]alphamerge[tvm];\
[0:v][tvm]overlay=format=auto:shortest=1,format=yuv420p[v]" \
 -map "[v]" -map 0:a -c:v libx264 -preset slow -crf 10 -c:a copy -movflags +faststart public/base.mp4
