"""TV-plane tracking.
The TV's right bezel is outside the frame for the entire take, so the quad cannot be found by
fitting 4 edges per frame, and the TV glass reflects the room, which fools plain feature trackers.
Per frame we solve the plane homography (reference -> frame, 8 DOF, Gauss-Newton + Huber) from:
  a) the visible top / left / bottom bezel edges (point-to-line, dark->bright transition search),
  b) the vertical wall-panel seam above the TV (same plane; anchors horizontal scale),
  c) SIFT matches restricted to the bright slide graphics (reflections are dim and excluded),
     matched against a keyframe of the current slide so they do not drift,
  d) a weak prior towards the previous frame for directions nothing else constrains.
Reference lines come from RANSAC fits in one frame; the reference quad's right edge is a virtual
line beyond the frame. Outputs pipeline/work/H_raw.npy and ref_quad.npy.
"""
import json, sys, numpy as np, cv2
SRC, MATTE = 'public/footage.mp4', 'pipeline/work/matte.mkv'
REF = 250            # reel 10.0 s
S = 0.5              # processing scale
W, H = 1080, 1920

def read_all(path, gray=True):
    cap = cv2.VideoCapture(path); out = []
    while True:
        ok, f = cap.read()
        if not ok: break
        f = cv2.resize(f, (int(W*S), int(H*S)), interpolation=cv2.INTER_AREA)
        out.append(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) if f.ndim == 3 else f)
    return out

frames = read_all(SRC); mattes = read_all(MATTE)
N = len(frames); print('frames', N)
h, w = frames[0].shape

def person_mask(i, dil=25):
    m = (mattes[i] > 40).astype(np.uint8)
    return cv2.dilate(m, np.ones((dil, dil), np.uint8))

# ---------- 1. reference lines ----------
def ransac_line(pts, iters=400, thr=1.5):
    best = None; rng = np.random.default_rng(0)
    for _ in range(iters):
        a, b = pts[rng.choice(len(pts), 2, replace=False)]
        d = b - a; n = np.array([-d[1], d[0]]); nn = np.linalg.norm(n)
        if nn < 1e-6: continue
        n /= nn; dist = np.abs((pts - a) @ n)
        inl = dist < thr
        if best is None or inl.sum() > best.sum(): best = inl
    p = pts[best]; vx, vy, x0, y0 = cv2.fitLine(p.astype(np.float32), cv2.DIST_HUBER, 0, 0.01, 0.01).ravel()
    return np.array([x0, y0]), np.array([vx, vy]), best.sum()

ref = frames[REF]; pm = person_mask(REF)
g = cv2.GaussianBlur(ref.astype(np.float32), (3, 3), 0)
dark = (ref < 80).astype(np.uint8) & (1 - pm)
dark = cv2.morphologyEx(dark, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(dark)
k = 1 + np.argmax(st[1:, 4]); tv = (lab == k)
bx, by, bw, bh = st[k, :4]
top, bot, left = [], [], []
for x in range(bx + 10, w - 3, 2):            # columns: first/last TV pixel
    col = np.where(tv[:, x])[0]
    if len(col) < 20: continue
    if not pm[max(col[0]-6, 0), x]: top.append((x, col[0] - 0.5))
    run = np.split(col, np.where(np.diff(col) > 1)[0] + 1)
    y1 = max(run, key=len)[-1]
    if y1 < h - 5 and not pm[min(y1+6, h-1), x] and not pm[y1-6, x]: bot.append((x, y1 + 0.5))
for y in range(by + 10, by + bh - 10, 2):
    row = np.where(tv[y, :])[0]
    if len(row) < 20: continue
    if not pm[y, min(row[0]+8, w-1)] and not pm[y, max(row[0]-6, 0)]: left.append((row[0] - 0.5, y))
lines = {}
for name, pts in [('top', top), ('bot', bot), ('left', left)]:
    pts = np.array(pts, float); p0, d, ni = ransac_line(pts)
    lines[name] = (p0, d); print(name, len(pts), 'inliers', ni)

def inter(l1, l2):
    (p, d), (q, e) = l1, l2
    A = np.array([d, -e]).T; t = np.linalg.solve(A, q - p); return p + t[0]*d

TL = inter(lines['top'], lines['left']); BL = inter(lines['bot'], lines['left'])
# virtual right edge: parallel to the left edge, through x = 1450 px (full-res) at mid height.
mid = (TL + BL) / 2; dl = lines['left'][1]
right = (np.array([1450*S, mid[1]]), dl)
TR = inter(lines['top'], right); BR = inter(lines['bot'], right)
ref_quad = np.array([TL, TR, BR, BL]) / S     # full-res coords
print('ref quad', ref_quad.round(1).tolist())

Ssc = np.diag([S, S, 1.0]); Sinv = np.linalg.inv(Ssc)
RQ = ref_quad
cap = cv2.VideoCapture(SRC); _cur = {'i': -1, 'fr': None}
def full_frame(i):
    """cached reader: sequential forward reads, seek only when jumping."""
    if i == _cur['i']: return _cur['fr']
    if i != _cur['i'] + 1: cap.set(cv2.CAP_PROP_POS_FRAMES, i)
    ok, fr = cap.read(); _cur.update(i=i, fr=fr); return fr

# --- wall seam in the reference frame (thin dark vertical line above the TV) ---
g0 = cv2.GaussianBlur(cv2.cvtColor(full_frame(REF), cv2.COLOR_BGR2GRAY), (3, 3), 0).astype(np.float32)
seam = []
for y in range(30, int(min(RQ[0, 1], RQ[1, 1])) - 30, 6):
    row = g0[y, 250:450]; x = 250 + int(np.argmin(row))
    if row.mean() - row.min() > 8: seam.append((x, y))
seam = np.array(seam, float); p0, dseam, ni = ransac_line(seam, thr=1.5)
SEAM = (p0 + dseam*((30 - p0[1])/dseam[1]), p0 + dseam*((seam[:, 1].max() - p0[1])/dseam[1]))
print('seam', np.round(SEAM, 1).tolist(), 'inliers', ni, '/', len(seam))

def proj(Hm, P):
    P = np.asarray(P, float); q = (Hm @ np.c_[P, np.ones(len(P))].T).T
    return q[:, :2] / q[:, 2:3]

def edge_meas(Hm, g, pm, search, sat=None):
    """ref points, measured image points and normals for the bezel edges + wall seam."""
    R, M, Nn = [], [], []
    segs = [(RQ[0], RQ[1], 140, 'step'), (RQ[0], RQ[3], 80, 'step'), (RQ[3], RQ[2], 140, 'step'), (SEAM[0], SEAM[1], 40, 'valley')]
    C = proj(Hm, [RQ.mean(0)])[0]
    offs = np.arange(-search, search + 1, 1.0)
    for A_, B_, n_s, kind in segs:
        ts = np.linspace(0.02, 0.98, n_s); rp = A_[None] + ts[:, None]*(B_ - A_)[None]
        ip = proj(Hm, rp); d = ip[-1] - ip[0]; d /= np.linalg.norm(d); n = np.array([-d[1], d[0]])
        if kind == 'step' and np.dot(n, ip[0] - C) < 0: n = -n
        for r, p in zip(rp, ip):
            if not (6 < p[0] < W - 6 and 6 < p[1] < 1700): continue
            q = p[None] + offs[:, None]*n[None]
            if (q < 2).any() or (q[:, 0] > W - 3).any() or (q[:, 1] > H - 3).any(): continue
            if pm[q[:, 1].astype(int), q[:, 0].astype(int)].any(): continue
            prof = cv2.remap(g, q[:, :1].astype(np.float32), q[:, 1:].astype(np.float32), cv2.INTER_LINEAR).ravel()
            if kind == 'step':
                dv = np.gradient(prof); k = int(np.argmax(dv))
                if dv[k] < 12: continue
                ins = prof[max(k-6, 0):max(k-2, 1)].mean(); out = prof[min(k+3, len(prof)-1):min(k+8, len(prof))].mean()
                if not (ins < 95 and out > ins + 35): continue
                if sat is not None:
                    qo = q[min(k+3, len(q)-1):min(k+12, len(q))]
                    if sat[qo[:, 1].astype(int), qo[:, 0].astype(int)].mean() > 60: continue
            else:
                k = int(np.argmin(prof))
                if k < 2 or k > len(prof) - 3 or np.median(prof) - prof[k] < 6: continue
            R.append(r); M.append(p + offs[k]*n); Nn.append(n)
    return np.array(R).reshape(-1, 2), np.array(M).reshape(-1, 2), np.array(Nn).reshape(-1, 2)

sift = cv2.SIFT_create(nfeatures=1200, contrastThreshold=0.03)
bf = cv2.BFMatcher(cv2.NORM_L2)
def content_feats(i, Hm):
    """SIFT on bright slide graphics inside the TV only (half-res); returns full-res points."""
    fr = cv2.resize(full_frame(i), (w, h), interpolation=cv2.INTER_AREA)
    hsv = cv2.cvtColor(fr, cv2.COLOR_BGR2HSV)
    bright = ((hsv[..., 2] > 110) | ((hsv[..., 1] > 120) & (hsv[..., 2] > 70))).astype(np.uint8)
    inside = np.zeros((h, w), np.uint8)
    cv2.fillPoly(inside, [np.round(proj(Ssc @ Hm, RQ)).astype(np.int32)], 1)
    inside = cv2.erode(inside, np.ones((15, 15), np.uint8))
    m = cv2.dilate(bright, np.ones((7, 7), np.uint8)) * inside * (1 - person_mask(i, 21))
    kp, de = sift.detectAndCompute(frames[i], (m*255).astype(np.uint8))
    return (np.float32([k.pt for k in kp]) / S if kp else np.zeros((0, 2), np.float32)), de

EMPTY = (np.zeros((0, 2)), np.zeros((0, 2)))
def content_meas(kf, cur):
    (pk, dk, Hk, _), (pc, dc) = kf, cur
    if dk is None or dc is None or len(pk) < 6 or len(pc) < 6: return EMPTY
    mm = [m for m, n in bf.knnMatch(dk, dc, k=2) if m.distance < 0.72*n.distance]
    if len(mm) < 8: return EMPTY
    a = pk[[m.queryIdx for m in mm]]; b = pc[[m.trainIdx for m in mm]]
    Hab, inl = cv2.findHomography(a, b, cv2.RANSAC, 3.0)
    if Hab is None or inl.sum() < 8: return EMPTY
    inl = inl.ravel() == 1
    return proj(np.linalg.inv(Hk), a[inl]), b[inl]

PRIOR_PTS = np.array([RQ[0], RQ[3], RQ[0] + 0.55*(RQ[1] - RQ[0]), RQ[3] + 0.55*(RQ[2] - RQ[3])])
T = np.diag([1/1000, 1/1000, 1.0]); Ti = np.linalg.inv(T)
def solve(Hm, Hprev, E, Cm, lam=0.3, iters=4):
    Rr, Mm, Nn = E; Rc, Mc = Cm
    def resid(Hx, wE, wC):
        r = []
        if len(Rr): r.append(((proj(Hx, Rr) - Mm)*Nn).sum(1) * wE)
        if len(Rc): r.append(((proj(Hx, Rc) - Mc) * wC[:, None]).ravel())
        r.append(((proj(Hx, PRIOR_PTS) - proj(Hprev, PRIOR_PTS))*lam).ravel())
        return np.concatenate(r)
    def Hof(Hb, dp):
        D = np.eye(3) + np.array([[dp[0], dp[1], dp[2]], [dp[3], dp[4], dp[5]], [dp[6], dp[7], 0]])
        return Ti @ D @ T @ Hb
    wE = np.ones(len(Rr)); wC = np.ones(len(Rc))
    for _ in range(iters):
        r0 = resid(Hm, wE, wC); J = np.zeros((len(r0), 8))
        for k in range(8):
            e = np.zeros(8); e[k] = 1e-6; J[:, k] = (resid(Hof(Hm, e), wE, wC) - r0) / 1e-6
        dp = np.linalg.lstsq(J, -r0, rcond=None)[0]
        Hm = Hof(Hm, dp); Hm = Hm / Hm[2, 2]
        if len(Rr):
            re = np.abs(((proj(Hm, Rr) - Mm)*Nn).sum(1)); wE = np.where(re < 1.5, 1, 1.5/np.maximum(re, 1e-9))
        if len(Rc):
            rc = np.linalg.norm(proj(Hm, Rc) - Mc, axis=1); wC = np.where(rc < 2.0, 1, 2.0/np.maximum(rc, 1e-9))
    res_e = float(np.median(np.abs(((proj(Hm, Rr) - Mm)*Nn).sum(1)))) if len(Rr) else -1
    res_c = float(np.median(np.linalg.norm(proj(Hm, Rc) - Mc, axis=1))) if len(Rc) else -1
    return Hm, res_e, res_c

def pm_full(i):
    return cv2.resize(person_mask(i, 15), (W, H), interpolation=cv2.INTER_NEAREST) > 0

import os
START = int(os.environ.get('START', REF))
Hs = [None]*N; Hs[REF] = np.eye(3); stats = {}
if START != REF:                      # resume forward from a previous run's good frame
    prevH = np.load('pipeline/work/H_raw.npy'); Hs = list(prevH)
    stats = {int(k): v for k, v in json.load(open('pipeline/work/track_stats.json')).items()}
for direction in ((1, -1) if START == REF else (1,)):
    i = START; kf = None
    while 0 <= i + direction < N:
        j = i + direction
        fj = full_frame(j)
        g = cv2.GaussianBlur(cv2.cvtColor(fj, cv2.COLOR_BGR2GRAY), (3, 3), 0).astype(np.float32)
        sat = cv2.cvtColor(fj, cv2.COLOR_BGR2HSV)[..., 1]
        pm = pm_full(j)
        cur = content_feats(j, Hs[i])
        Cm = content_meas(kf, cur) if kf is not None else EMPTY
        Hm = Hs[i]
        if len(Cm[0]) >= 12:   # large moves (the pan): initialise from the slide content
            Hc0, _ = cv2.findHomography(Cm[0].astype(np.float32), Cm[1].astype(np.float32), 0)
            if Hc0 is not None and np.abs(proj(Hc0, PRIOR_PTS) - proj(Hm, PRIOR_PTS)).max() < 80: Hm = Hc0
        for search in (22, 10, 5):                       # geometry-only solve first
            E = edge_meas(Hm, g, pm, search, sat)
            Hm, re, rc = solve(Hm, Hs[i], E, EMPTY)
        if len(Cm[0]):
            # slide graphics only count when static and consistent with the bezel/seam solution
            ok = np.linalg.norm(proj(Hm, Cm[0]) - Cm[1], axis=1) < 5
            Cm = (Cm[0][ok], Cm[1][ok]) if ok.sum() >= 12 and ok.mean() >= 0.6 else EMPTY
            if len(Cm[0]):
                for search in (6, 4):
                    E = edge_meas(Hm, g, pm, search, sat)
                    Hm, re, rc = solve(Hm, Hs[i], E, Cm)
        Hs[j] = Hm; nC = len(Cm[0])
        # keyframe refresh: none yet, or the slide changed (few matches, plenty of bright features)
        newk = kf is None or (nC < max(15, 0.35*kf[3]) and cur[1] is not None and len(cur[0]) >= 25)
        newk = newk and (kf is None or nC == 0 or rc < 2.5)
        if newk and cur[1] is not None: kf = (cur[0], cur[1], Hm, len(cur[0]))
        stats[j] = (len(E[0]), re, nC, rc)
        if j % 50 == 0 or (newk and cur[1] is not None): print(j, 'edges', len(E[0]), 'res %.2f' % re, 'content', nC, 'res %.2f' % rc, 'NEWKEY' if newk else ''); sys.stdout.flush()
        i = j

np.save('pipeline/work/H_raw.npy', np.array(Hs))
np.save('pipeline/work/ref_quad.npy', ref_quad)
json.dump({str(k): v for k, v in stats.items()}, open('pipeline/work/track_stats.json', 'w'))
print('done')
