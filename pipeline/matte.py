"""Person matte per frame (mediapipe selfie_multiclass). Writes pipeline/work/matte.mkv (gray, ffv1, 1080x1920)."""
import sys, subprocess, numpy as np, cv2, mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
src, model, out = sys.argv[1], sys.argv[2], sys.argv[3]
seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
    base_options=BaseOptions(model_asset_path=model), output_confidence_masks=True,
    running_mode=vision.RunningMode.VIDEO))
cap = cv2.VideoCapture(src)
W, H = 1080, 1920
ff = subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','gray','-s',f'{W}x{H}','-r','25','-i','-',
                       '-c:v','ffv1','-pix_fmt','gray',out], stdin=subprocess.PIPE)
prev = None; i = 0
while True:
    ok, fr = cap.read()
    if not ok: break
    rgb = cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)
    # run at half-res for speed, two vertical halves would lose context; whole frame is fine
    small = cv2.resize(rgb, (540, 960))
    res = seg.segment_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=small), int(i*40))
    bg = res.confidence_masks[0].numpy_view()
    p = np.clip(1.0 - bg, 0, 1)
    p = cv2.resize(p, (W, H), interpolation=cv2.INTER_LINEAR)
    if prev is not None: p = np.maximum(p, 0.5*prev + 0.5*p)  # mild temporal hold (favours protecting the person)
    prev = p
    ff.stdin.write((p*255).astype(np.uint8).tobytes()); i += 1
ff.stdin.close(); ff.wait(); print('frames', i)
