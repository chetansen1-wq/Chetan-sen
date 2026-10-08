import sys, cv2, numpy as np
cap = cv2.VideoCapture('public/footage.mp4')
def frame(i):
    cap.set(cv2.CAP_PROP_POS_FRAMES, i); return cap.read()[1]
def sheet(cues, crop, size, out, span=0.6, step=0.2):
    rows = []
    for c in cues:
        tiles = []
        for k in np.arange(-span, span + 1e-6, step):
            t = c + k; fr = frame(int(round(t * 25)))
            x0, y0, x1, y1 = crop; im = cv2.resize(fr[y0:y1, x0:x1], size)
            cv2.putText(im, f'{t:.1f}', (4, 22), 0, 0.7, (0, 0, 255) if abs(k) < 1e-6 else (0, 255, 255), 2)
            tiles.append(im)
        rows.append(np.hstack(tiles))
    cv2.imwrite(out, np.vstack(rows))
cues = [float(x) for x in sys.argv[1].split(',')]
crop = [int(x) for x in sys.argv[2].split(',')]; size = tuple(int(x) for x in sys.argv[3].split('x'))
sheet(cues, crop, size, sys.argv[4], float(sys.argv[5]) if len(sys.argv) > 5 else 0.6)
