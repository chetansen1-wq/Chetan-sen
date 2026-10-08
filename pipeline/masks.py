"""Letter mask for the glint: the TV's own VIR letters, cut from a rectified frame (canonical TV space)."""
import json, numpy as np, cv2
CW, CH = 1600, 900
X, Y, Wd, Ht = 830, 222, 185, 100           # VIR box in canonical space (rectified @ 16.5 s)
Q = np.array(json.load(open('public/tv_quad.json'))['frames'], np.float32)
cap = cv2.VideoCapture('public/footage.mp4'); i = int(16.5 * 25)
cap.set(cv2.CAP_PROP_POS_FRAMES, i); fr = cap.read()[1]
M = cv2.getPerspectiveTransform(Q[i], np.float32([[0, 0], [CW, 0], [CW, CH], [0, CH]]))
r = cv2.warpPerspective(fr, M, (CW, CH))[Y:Y + Ht, X:X + Wd]
v = cv2.cvtColor(r, cv2.COLOR_BGR2HSV)[..., 2]
a = cv2.GaussianBlur(np.clip((v.astype(float) - 70) * 4, 0, 255).astype(np.uint8), (3, 3), 0)
out = np.dstack([np.full_like(a, 255)] * 3 + [a])
cv2.imwrite('public/masks/vir.png', out); print('mask coverage %.2f' % (a > 128).mean())
