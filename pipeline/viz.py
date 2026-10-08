import sys, numpy as np, cv2
H = np.load(sys.argv[1]); q = np.load('pipeline/work/ref_quad.npy'); idx = [int(x) for x in sys.argv[2].split(',')]
cap = cv2.VideoCapture('public/footage.mp4'); tiles = []
for i in idx:
    cap.set(cv2.CAP_PROP_POS_FRAMES, i); ok, f = cap.read()
    p = cv2.perspectiveTransform(q[None].astype(np.float64), H[i])[0]
    cv2.polylines(f, [np.round(p).astype(np.int32)], True, (0, 0, 255), 4)
    cv2.putText(f, f'{i} ({i/25:.1f}s)', (30, 1850), 0, 2.2, (0, 0, 255), 5)
    tiles.append(cv2.resize(f, (360, 640)))
cv2.imwrite(sys.argv[3], np.hstack(tiles))
