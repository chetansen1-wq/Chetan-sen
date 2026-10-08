# Reel pipeline

Run from the repo root, in order:

| step | command | output |
|---|---|---|
| proxy | `sh pipeline/prep.sh <source.mp4>` | `public/footage.mp4` (reel time = source − 3.0 s) |
| presenter matte | `python3 pipeline/matte.py public/footage.mp4 <selfie_multiclass_256x256.tflite> pipeline/work/matte.mkv` | `pipeline/work/matte.mkv` |
| TV tracking | `python3 pipeline/track.py` then `python3 pipeline/export_quad.py` | `public/tv_quad.json` |
| tracking debug | `python3 pipeline/debug_video.py` | `out/debug_quad.mp4` |
| overlay coords | `python3 pipeline/rectify.py <dir> <times…>`, `python3 pipeline/masks.py` | `public/masks/*`, `src/tv/tvcoords.ts` |
| face anchor | `python3 pipeline/face.py` | `src/face.json` |
| SFX | `sh pipeline/sfx.sh` | `public/sfx/*.wav` |
| TV layer | `npx remotion render src/index.ts TVLayer pipeline/work/tv_layer.mov --codec=prores --prores-profile=4444 --image-format=png --pixel-format=yuva444p10le` | alpha layer |
| composite | `sh pipeline/composite.sh` | `public/base.mp4` (TV layer cut out behind presenter) |
| final | `npx remotion render src/index.ts Main out/reel_final.mp4 --codec=h264 --crf=17 --audio-bitrate=192k` | `out/reel_final.mp4` |
| checks | `python3 pipeline/verify.py <times>` / `python3 pipeline/verify_full.py` | safe-zone + presenter-overlap report |

Requires: ffmpeg, Node 22, Python 3 with opencv-contrib-python + mediapipe.
