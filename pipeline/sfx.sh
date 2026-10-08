#!/bin/sh
# Synthesised SFX, each peak-normalised to -1 dBFS; the mix level (-20..-24 dB) is applied in Remotion.
set -e
O=public/sfx; A="-ar 48000 -ac 2"
norm() { ffmpeg -v error -y -i "$1" -af "loudnorm=I=-16:TP=-1:LRA=11,alimiter=limit=0.89" $A "$2"; rm "$1"; }
# whoosh: band-passed noise with a rising/falling filter sweep and a swell envelope
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=0.9:c=pink:a=0.8" -af "highpass=f=300,lowpass=f=5000,afade=t=in:d=0.45:curve=qsin,afade=t=out:st=0.45:d=0.45:curve=qsin,aphaser=in_gain=0.6:speed=1.8,stereotools=mlev=1" $A /tmp/w.wav; norm /tmp/w.wav $O/whoosh.wav
# zap: short crackling electric burst
ffmpeg -v error -y -f lavfi -i "aevalsrc='0.6*sin(2*PI*(1800-1400*t/0.35)*t)*sgn(sin(2*PI*90*t))*exp(-6*t)+0.3*(random(0)-0.5)*exp(-10*t)':d=0.4:s=48000" -af "highpass=f=200,afade=t=out:st=0.25:d=0.15" $A /tmp/z.wav; norm /tmp/z.wav $O/zap.wav
# hum swell: 100 Hz mains-like hum with harmonics, swelling up then down
ffmpeg -v error -y -f lavfi -i "aevalsrc='(0.5*sin(2*PI*100*t)+0.25*sin(2*PI*200*t)+0.12*sin(2*PI*300*t)+0.06*sin(2*PI*500*t))*sin(PI*t/1.6)^2':d=1.6:s=48000" $A /tmp/h.wav; norm /tmp/h.wav $O/hum.wav
# warm swell: soft detuned pad
ffmpeg -v error -y -f lavfi -i "aevalsrc='(0.4*sin(2*PI*220*t)+0.4*sin(2*PI*221.7*t)+0.25*sin(2*PI*330*t)+0.15*sin(2*PI*440.8*t))*sin(PI*t/2.0)^2':d=2.0:s=48000" -af "lowpass=f=1800" $A /tmp/s.wav; norm /tmp/s.wav $O/warm.wav
# tick: tiny UI click
ffmpeg -v error -y -f lavfi -i "aevalsrc='0.8*sin(2*PI*2400*t)*exp(-90*t)+0.4*sin(2*PI*5200*t)*exp(-140*t)':d=0.08:s=48000" $A /tmp/t.wav; norm /tmp/t.wav $O/tick.wav
# soft impact: low thump with a short air tail
ffmpeg -v error -y -f lavfi -i "aevalsrc='0.9*sin(2*PI*(90-40*t)*t)*exp(-7*t)+0.15*(random(0)-0.5)*exp(-18*t)':d=0.7:s=48000" -af "lowpass=f=2500" $A /tmp/i.wav; norm /tmp/i.wav $O/impact.wav
# exact peak normalisation to -1 dBFS
for f in $O/*.wav; do
  m=$(ffmpeg -i $f -af volumedetect -f null - 2>&1 | grep max_volume | awk '{print $5}')
  g=$(python3 -c "print(-1-($m))")
  ffmpeg -v error -y -i $f -af "volume=${g}dB" $A $f.tmp.wav && mv $f.tmp.wav $f
done
