import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {clamp, ease, rnd} from '../anim';
import {CUE} from '../cues';
import {C, f} from '../theme';
import {CH, CW} from './homography';
import {TVC} from './tvcoords';

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={CW} height={CH} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
    {children}
  </svg>
);

/** 14.5: cyan scan line sweeping down the glass as the TV's title animates in. */
export const ScanLine: React.FC = () => {
  const fr = useCurrentFrame();
  const s = f(CUE.scanLine);
  if (fr < s || fr > s + 18) return null;
  const t = interpolate(fr, [s, s + 16], [0, 1], {...clamp, easing: ease});
  const y = -40 + t * (CH + 80);
  const op = interpolate(fr, [s, s + 3, s + 13, s + 18], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', opacity: op}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: y - 90, height: 90, background: `linear-gradient(180deg, transparent, ${C.cyan}33)`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: y - 2, height: 4, background: C.cyan, boxShadow: `0 0 12px ${C.cyan}`}} />
    </div>
  );
};

/** 23.0: a bright pulse becomes a sweep across the glass, hiding the slide change at 23.3. */
export const Sweep: React.FC = () => {
  const fr = useCurrentFrame();
  const s = f(CUE.sweep);
  const e = f(CUE.tvCut2) + 9;
  if (fr < s || fr > e) return null;
  const t = interpolate(fr, [s, e], [0, 1], {...clamp, easing: ease});
  const x = -400 + t * (CW * 0.95 + 400); // ends where the glass leaves frame
  const flash = interpolate(fr, [f(CUE.tvCut2) - 3, f(CUE.tvCut2), f(CUE.tvCut2) + 5], [0, 0.22, 0], clamp);
  const op = interpolate(fr, [s, s + 3, e - 4, e], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', opacity: op}}>
      <div style={{position: 'absolute', inset: 0, background: C.cyan, opacity: flash}} />
      <div style={{position: 'absolute', top: 0, bottom: 0, left: x, width: 400,
        background: `linear-gradient(90deg, transparent, ${C.cyan}55 55%, ${C.cyan}cc 88%, #ffffff 97%, transparent)`}} />
    </div>
  );
};

/** canvas-masked glint: a white band travelling across the TV's own VIR letters only. */
export const Glint: React.FC = () => {
  const fr = useCurrentFrame();
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [handle] = useState(() => delayRender('glint mask'));
  useEffect(() => {
    const im = new Image();
    im.onload = () => {
      setImg(im);
      continueRender(handle);
    };
    im.onerror = () => continueRender(handle);
    im.src = staticFile('masks/vir.png');
  }, [handle]);
  const ref = React.useRef<HTMLCanvasElement>(null);
  const {x, y, w, h} = TVC.vir;
  const s = f(CUE.glint);
  const active = fr >= s && fr <= s + 16;
  useEffect(() => {
    const cv = ref.current;
    if (!cv || !img) return;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);
    if (!active) return;
    const t = interpolate(fr, [s, s + 16], [0, 1], {...clamp, easing: ease});
    const cx = -0.4 * w + t * 1.8 * w;
    const g = ctx.createLinearGradient(cx - 70, 0, cx + 70, h * 0.35);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(img, 0, 0, w, h);
  }, [fr, img, active, s, w, h]);
  return <canvas ref={ref} width={w} height={h} style={{position: 'absolute', left: x, top: y, width: w, height: h, filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))'}} />;
};

/** 18.2: electric arc jumping V <-> IR where the TV's "=" appears, plus a 4-frame bloom. */
export const Arc: React.FC = () => {
  const fr = useCurrentFrame();
  const s = f(CUE.arc);
  if (fr < s - 4 || fr > s + 8) return null;
  const [ax, ay] = TVC.arcFrom;
  const [bx, by] = TVC.arcTo;
  const live = fr < s + 5;
  const pts = (seed: number) =>
    Array.from({length: 11}, (_, i) => {
      const t = i / 10;
      const j = i === 0 || i === 10 ? 0 : (rnd(seed * 31 + i) - 0.5) * 34;
      return `${ax + (bx - ax) * t},${ay + (by - ay) * t + j}`;
    }).join(' ');
  const bloom = interpolate(fr, [s, s + 1, s + 4], [0, 0.85, 0], clamp);
  const cx = (ax + bx) / 2, cy = (ay + by) / 2;
  return (
    <Svg>
      <defs>
        <radialGradient id="arc-bloom">
          <stop offset="0" stopColor="#ffffff" stopOpacity={1} />
          <stop offset="0.35" stopColor={C.cyan} stopOpacity={0.6} />
          <stop offset="1" stopColor={C.cyan} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={150} fill="url(#arc-bloom)" opacity={bloom} />
      {live && fr >= s - 4 && (
        <g style={{filter: `drop-shadow(0 0 8px ${C.cyan})`}} opacity={fr < s ? 0.5 : 1}>
          <polyline points={pts(fr)} fill="none" stroke={C.cyan} strokeWidth={5} strokeLinejoin="round" />
          <polyline points={pts(fr + 500)} fill="none" stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" />
        </g>
      )}
    </Svg>
  );
};

/** cyan underline ticks appearing under L, A, T then M as the TV writes them. */
export const Ticks: React.FC = () => {
  const fr = useCurrentFrame();
  const out = f(CUE.ticksOut);
  if (fr < f(CUE.tickLAT) || fr > out + 6) return null;
  const fade = interpolate(fr, [out, out + 6], [1, 0], clamp);
  return (
    <Svg>
      <g style={{filter: `drop-shadow(0 0 8px ${C.cyan})`}} opacity={fade}>
        {TVC.latm.map(([x, y, w], i) => {
          const s = f(i < 3 ? CUE.tickLAT : CUE.tickM) + (i < 3 ? i * 2 : 0);
          const p = interpolate(fr, [s, s + 5], [0, 1], {...clamp, easing: ease});
          return p > 0 ? <rect key={i} x={x - (w * p) / 2} y={y} width={w * p} height={7} rx={3.5} fill={C.cyan} /> : null;
        })}
      </g>
    </Svg>
  );
};

/** stroke that draws on (dash) then fades; used to trace parts of the TV diagram. */
const Trace: React.FC<{d: string; start: number; len?: number}> = ({d, start, len = 1600}) => {
  const fr = useCurrentFrame();
  if (fr < start || fr > start + 45) return null;
  const p = interpolate(fr, [start, start + 12], [0, 1], {...clamp, easing: ease});
  const op = interpolate(fr, [start, start + 2, start + 30, start + 45], [0, 1, 1, 0], clamp);
  return (
    <path d={d} fill="none" stroke={C.cyan} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round"
      pathLength={len} strokeDasharray={`${len * p} ${len}`} opacity={op} style={{filter: `drop-shadow(0 0 9px ${C.cyan})`}} />
  );
};

export const DiagramTraces: React.FC = () => (
  <Svg>
    {TVC.traces.map((d, i) => (
      <Trace key={i} d={d} start={f(CUE.rows[i])} />
    ))}
  </Svg>
);

/** 42.7-44.0: ring pulsing around the TV's "R" while the presenter points at it. */
export const RingR: React.FC = () => {
  const fr = useCurrentFrame();
  const [s, e] = CUE.ringR.map(f);
  if (fr < s || fr > e + 6) return null;
  const [cx, cy, r] = TVC.r;
  const env = interpolate(fr, [s, s + 5, e, e + 6], [0, 1, 1, 0], clamp);
  const ph = ((fr - s) % 16) / 16;
  return (
    <Svg>
      <g style={{filter: `drop-shadow(0 0 8px ${C.cyan})`}} opacity={env}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.cyan} strokeWidth={5} />
        <circle cx={cx} cy={cy} r={r * (1 + 0.45 * ph)} fill="none" stroke={C.cyan} strokeWidth={3} opacity={1 - ph} />
      </g>
    </Svg>
  );
};
