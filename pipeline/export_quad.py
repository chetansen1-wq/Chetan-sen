"""Smooth the tracked quad (5-frame median to drop single-frame solver glitches, then the 5-frame centred moving average) and export public/tv_quad.json.
Also reports how far the smoothing moves corners vs. the raw per-frame track (lag check for the pan)."""
import json, numpy as np, cv2
H = np.load('pipeline/work/H_raw.npy'); q = np.load('pipeline/work/ref_quad.npy')
raw = np.array([cv2.perspectiveTransform(q[None], h)[0] for h in H])          # N x 4 x 2
k = 5
def win(a):
    pad = np.concatenate([a[:1].repeat(k // 2, 0), a, a[-1:].repeat(k // 2, 0)])
    return np.stack([pad[i:i + len(a)] for i in range(k)])
med = np.median(win(raw), 0)
sm = win(med).mean(0)
dm = np.abs(med - raw)[:, [0, 3]].max(axis=(1, 2))
print('median filter removed glitches > 5 px on %d frames' % (dm > 5).sum())
dev = np.abs(sm - med)[:, [0, 3]].max(axis=(1, 2))   # visible corners only (TL, BL)
print('smoothing deviation (visible corners) px: mean %.2f  p99 %.2f  max %.2f @ %.2fs' % (dev.mean(), np.percentile(dev, 99), dev.max(), dev.argmax() / 25))
np.save('pipeline/work/quad_raw.npy', raw); np.save('pipeline/work/quad_smooth.npy', sm)
json.dump({'fps': 25, 'width': 1080, 'height': 1920, 'order': ['TL', 'TR', 'BR', 'BL'],
           'note': 'TR/BR lie on a virtual right edge beyond the frame (the real right bezel is never in shot).',
           'frames': [[[round(float(x), 2), round(float(y), 2)] for x, y in c] for c in sm]},
          open('public/tv_quad.json', 'w'))
