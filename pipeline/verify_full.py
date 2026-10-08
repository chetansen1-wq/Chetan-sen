"""Every-frame check of the screen-space layer (alpha) against the presenter matte and safe zones."""
import subprocess, numpy as np, cv2
W, H, HEM = 1080, 1920, 1555
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', 'pipeline/work/screen_only.mov', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], stdout=subprocess.PIPE)
mc = cv2.VideoCapture('pipeline/work/matte.mkv'); bad = []; i = 0
while True:
    buf = p.stdout.read(W * H * 4)
    if len(buf) < W * H * 4: break
    a = np.frombuffer(buf, np.uint8).reshape(H, W, 4)[..., 3] > 20
    m = mc.read()[1][..., 0] > 128; m[:, :100] = 0; m[:, 800:] = 0; m[HEM:] = 0
    o, b, r = int((a & m).sum()), int(a[1620:].sum()), int(a[900:1700, 940:].sum())
    if o or b or r: bad.append((i, o, b, r))
    i += 1
print('frames checked', i, 'violations', len(bad))
for v in bad[:40]: print('  %.2fs over=%d bottom=%d right=%d' % (v[0] / 25, *v[1:]))
