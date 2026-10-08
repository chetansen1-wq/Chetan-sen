"""Rectify given reel times into canonical TV space (1600x900) for authoring overlay coordinates."""
import sys, json, numpy as np, cv2
CW, CH = 1600, 900
Q = np.array(json.load(open('public/tv_quad.json'))['frames'], np.float32)
cap = cv2.VideoCapture('public/footage.mp4')
dst = np.float32([[0, 0], [CW, 0], [CW, CH], [0, CH]])
for t in sys.argv[2:]:
    i = int(round(float(t) * 25)); cap.set(cv2.CAP_PROP_POS_FRAMES, i); fr = cap.read()[1]
    M = cv2.getPerspectiveTransform(Q[i], dst)
    r = cv2.warpPerspective(fr, M, (CW, CH))
    for x in range(0, CW, 100):
        cv2.line(r, (x, 0), (x, CH), (0, 255, 0) if x % 500 else (0, 0, 255), 1); cv2.putText(r, str(x), (x + 2, 14), 0, 0.45, (0, 255, 0), 1)
    for y in range(0, CH, 100):
        cv2.line(r, (0, y), (CW, y), (0, 255, 0) if y % 500 else (0, 0, 255), 1); cv2.putText(r, str(y), (2, y + 14), 0, 0.45, (0, 255, 0), 1)
    cv2.imwrite(f'{sys.argv[1]}/rect_{t}.png', r)
