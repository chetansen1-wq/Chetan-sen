"""Debug render: tracked (smoothed) TV quad in red over the footage -> out/debug_quad.mp4 (540x960)."""
import json, subprocess, numpy as np, cv2
Q = np.array(json.load(open('public/tv_quad.json'))['frames'])
cap = cv2.VideoCapture('public/footage.mp4')
ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', '540x960', '-r', '25', '-i', '-',
                       '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', 'out/debug_quad.mp4'], stdin=subprocess.PIPE)
i = 0
while True:
    ok, fr = cap.read()
    if not ok: break
    cv2.polylines(fr, [np.round(Q[i] * 8).astype(np.int32)], True, (0, 0, 255), 4, cv2.LINE_AA, shift=3)
    for c in Q[i][[0, 3]]: cv2.circle(fr, tuple(np.round(c).astype(int)), 10, (0, 0, 255), -1)
    cv2.putText(fr, f'{i/25:5.2f}s  f{i}', (30, 1880), 0, 1.6, (0, 0, 255), 4)
    ff.stdin.write(cv2.resize(fr, (540, 960), interpolation=cv2.INTER_AREA).tobytes()); i += 1
ff.stdin.close(); ff.wait(); print('frames', i)
