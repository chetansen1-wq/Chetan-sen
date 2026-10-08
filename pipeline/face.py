"""Face anchor for the digital push-ins: head-top from the presenter matte (x limited to the
presenter's column so TV cartoon characters are ignored), smoothed over ~2 s. Writes src/face.json."""
import json, numpy as np, cv2
mc = cv2.VideoCapture('pipeline/work/matte.mkv'); pts = []
while True:
    ok, m = mc.read()
    if not ok: break
    m = m[..., 0] > 128; m[:, :100] = 0; m[:, 760:] = 0
    rows = np.where(m.any(1))[0]; top = rows.min()
    band = m[top:top + 160]; ys, xs = np.where(band)
    pts.append((float(np.median(xs)), float(top + 130)))
p = np.array(pts); k = 51; ker = np.ones(k) / k
sm = np.stack([np.convolve(np.pad(p[:, i], k // 2, mode='edge'), ker, 'valid') for i in range(2)], 1)
json.dump([[round(x, 1), round(y, 1)] for x, y in sm], open('src/face.json', 'w'))
print(sm[::125].round(0).tolist())
