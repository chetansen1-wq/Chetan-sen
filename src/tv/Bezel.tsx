import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {clamp, mixHex} from '../anim';
import {CUE} from '../cues';
import {C, f} from '../theme';
import {CH, CW, project} from './homography';
import {homographyAt} from './TVSpace';

const PAD = 12; // path sits just outside the glass, on the bezel
const RECT: [number, number][] = [[-PAD, -PAD], [CW + PAD, -PAD], [CW + PAD, CH + PAD], [-PAD, CH + PAD]];

type Look = {speed: number; len: number; width: number; bright: number; heat: number; shimmer: number; base: number};

/** per-concept pulse character; frame-accurate keyframes, interpolated */
const look = (fr: number): Look => {
  const k = (s: number) => f(s);
  const L = (pairs: [number, number][]) =>
    interpolate(fr, pairs.map((p) => k(p[0])), pairs.map((p) => p[1]), clamp);
  return {
    // canonical px per frame (perimeter ~5150): S1 slow, then medium
    speed: L([[11, 34], [14, 62], [22.6, 62], [23.0, 150], [23.4, 62], [61.2, 62]]),
    len: L([[11, 260], [14, 340], [23.4, 420], [31.5, 420], [32.3, 340]]),
    width: L([[11, 4], [22.5, 4], [23.0, 10], [23.5, 8], [31.3, 8], [31.8, 4], [61.2, 4]]),
    bright: L([[10.9, 0], [11.4, 0.9], [22.5, 0.9], [23.0, 1], [31.3, 1], [31.6, 0.25], [32.3, 0.25], [32.7, 0.9], [61.2, 0.9]]),
    heat: L([[CUE.heat[0], 0], [36.75, 0.5], [CUE.heat[1], 1], [38.8, 1], [39.3, 0]]),
    shimmer: L([[CUE.heat[0], 0], [36.0, 3], [38.8, 3], [39.3, 0]]),
    base: L([[10.9, 0], [11.6, 0.22], [61.2, 0.22]]),
  };
};

const pulseColor = (heat: number) =>
  heat <= 0 ? C.cyan : heat < 0.5 ? mixHex(C.cyan, C.heatA, heat * 2) : mixHex(C.heatA, C.heatB, (heat - 0.5) * 2);

/**
 * BEZEL CIRCUIT: faint trace + travelling current pulse around the tracked TV.
 * Drawn in SCREEN space (path corners projected through the frame's homography): SVG filters
 * inside a CSS matrix3d layer rasterise with tiling artefacts in Chromium.
 */
export const Bezel: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(CUE.bezelStart) - 1) return null;
  // integrate speed so changes in speed never make the pulse jump
  let pos = 0;
  for (let i = f(CUE.bezelStart); i < frame; i++) pos += look(i).speed;
  const lk = look(frame);
  const Hm = homographyAt(frame);
  const P = RECT.map(([x, y]) => project(Hm, x, y));
  const d = `M ${P.map((p) => p.join(' ')).join(' L ')} Z`;
  const PERIM = P.reduce((a, p, i) => a + Math.hypot(P[(i + 1) % 4][0] - p[0], P[(i + 1) % 4][1] - p[1]), 0);
  const col = pulseColor(lk.heat);
  const second = frame >= f(CUE.tvCut2) && frame < f(CUE.s3Exit); // S3: power = two pulses
  const dash = (offset: number) => ({
    strokeDasharray: `${lk.len} ${PERIM - lk.len}`,
    strokeDashoffset: -(pos + offset) + lk.len,
  });
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id="bz-shimmer" filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.09" numOctaves={2} seed={Math.floor(frame / 2)} />
          <feDisplacementMap in="SourceGraphic" scale={lk.shimmer} />
        </filter>
        <linearGradient id="bz-fade" x1="0" x2="1">
          <stop offset="0" stopColor={col} stopOpacity={0} />
          <stop offset="0.75" stopColor={col} stopOpacity={0.9} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={1} />
        </linearGradient>
      </defs>
      <g filter={lk.shimmer > 0.05 ? 'url(#bz-shimmer)' : undefined}>
        <path d={d} fill="none" stroke={col} strokeWidth={2} opacity={lk.base} />
        {[0, ...(second ? [PERIM / 2] : [])].map((o) => (
          <g key={o} opacity={lk.bright}>
            {/* glow = layered translucent strokes (SVG blur filters mis-render here) */}
            <path d={d} fill="none" stroke={col} strokeWidth={lk.width * 5} strokeLinecap="round" opacity={0.1} style={dash(o)} />
            <path d={d} fill="none" stroke={col} strokeWidth={lk.width * 3} strokeLinecap="round" opacity={0.2} style={dash(o)} />
            <path d={d} fill="none" stroke={col} strokeWidth={lk.width} strokeLinecap="round" style={dash(o)} />
            <path d={d} fill="none" stroke="#ffffff" strokeWidth={Math.max(1.5, lk.width * 0.35)} strokeLinecap="round" opacity={0.9}
              style={{strokeDasharray: `${lk.len * 0.25} ${PERIM - lk.len * 0.25}`, strokeDashoffset: -(pos + o) + lk.len * 0.25}} />
          </g>
        ))}
      </g>
    </svg>
  );
};
