import {Easing, interpolate, spring} from 'remotion';
import {FPS} from './theme';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** spring progress (damping ~14) starting at frame `start` */
export const sp = (frame: number, start: number, damping = 14, stiffness = 140) =>
  spring({frame: frame - start, fps: FPS, config: {damping, stiffness, mass: 1}});

/**
 * Standard enter / exit used by every on-screen text element:
 * enter = mask up 40 px with up to 6 px motion blur (spring); exit = fast 6-frame fade-up.
 */
export const enterExit = (frame: number, inF: number, outF?: number) => {
  const p = sp(frame, inF);
  const v = sp(frame, inF) - sp(frame - 1, inF); // per-frame velocity of the spring
  let y = (1 - p) * 40;
  const blur = Math.min(6, Math.abs(v) * 40 * 0.6);
  let opacity = frame < inF ? 0 : 1;
  if (outF !== undefined && frame >= outF) {
    const e = interpolate(frame, [outF, outF + 6], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
    opacity = 1 - e;
    y -= 18 * e;
  }
  return {y, blur, opacity, visible: frame >= inF && opacity > 0.001};
};

export const ease = Easing.bezier(0.45, 0, 0.2, 1);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(',')})`;
};

/** deterministic pseudo-random */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
