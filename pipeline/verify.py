"""Automated checks on screen-space graphics at given reel times:
 - no pixels over the presenter above the shirt hem (face/torso/hands); legs are allowed
 - nothing in the bottom 300 px, nor in the right 140 px between y=900 and y=1700
Renders the ScreenOnly composition (transparent PNG) per time and compares with the matte."""
import sys, subprocess, numpy as np, cv2
HEM = 1555
mc = cv2.VideoCapture('pipeline/work/matte.mkv')
for t in [float(x) for x in sys.argv[1].split(',')]:
    fr = int(round(t * 25))
    out = f'pipeline/work/scr_{fr}.png'
    subprocess.run(['npx', 'remotion', 'still', 'src/index.ts', 'ScreenOnly', out, f'--frame={fr}', '--image-format=png', '--log=error'], check=True, capture_output=True)
    a = cv2.imread(out, cv2.IMREAD_UNCHANGED)[..., 3] > 20
    mc.set(cv2.CAP_PROP_POS_FRAMES, fr); m = mc.read()[1][..., 0] > 128
    m[:, :100] = 0; m[:, 800:] = 0   # presenter column only (matte also contains TV cartoons)
    body = m.copy(); body[HEM:] = 0
    over = (a & body).sum()
    bottom = a[1620:].sum(); right = a[900:1700, 940:].sum()
    print(f'{t:5.1f}s  over-presenter px={over:6d}  bottom300 px={bottom:5d}  right-edge px={right:5d}  {"OK" if over == 0 and bottom == 0 and right == 0 else "CHECK"}')
