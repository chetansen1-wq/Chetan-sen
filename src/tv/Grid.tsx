import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {clamp, rnd} from '../anim';
import {CUE} from '../cues';
import {C, f} from '../theme';
import {CH, CW} from './homography';

const STEP = 80;

const Lines: React.FC<{stroke: number}> = ({stroke}) => (
  <svg width={CW} height={CH} style={{position: 'absolute', inset: 0}}>
    {Array.from({length: Math.floor(CW / STEP) + 1}, (_, i) => (
      <line key={`v${i}`} x1={i * STEP} y1={0} x2={i * STEP} y2={CH} stroke={C.cyan} strokeWidth={stroke} />
    ))}
    {Array.from({length: Math.floor(CH / STEP) + 1}, (_, i) => (
      <line key={`h${i}`} x1={0} y1={i * STEP} x2={CW} y2={i * STEP} stroke={C.cyan} strokeWidth={stroke} />
    ))}
  </svg>
);

/** S1: faint perspective grid on the TV glass (0.08) + soft light pulses + drifting particles. */
export const Grid: React.FC = () => {
  const frame = useCurrentFrame();
  const end = f(CUE.gridEnd);
  if (frame > end + 8) return null;
  const master = interpolate(frame, [0, 10, end - 10, end + 6], [0, 1, 1, 0], clamp);

  const pulses = CUE.gridPulses.map((s) => {
    const t = interpolate(frame, [f(s), f(s) + 22], [0, 1], clamp);
    return {t, on: frame >= f(s) && frame <= f(s) + 22};
  });

  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', opacity: master}}>
      <div style={{position: 'absolute', inset: 0, opacity: 0.08}}>
        <Lines stroke={2} />
      </div>
      {pulses.map(({t, on}, i) =>
        on ? (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.32 * Math.sin(Math.PI * t),
              WebkitMaskImage: `linear-gradient(100deg, transparent ${t * 140 - 40}%, black ${t * 140 - 20}%, transparent ${t * 140}%)`,
              maskImage: `linear-gradient(100deg, transparent ${t * 140 - 40}%, black ${t * 140 - 20}%, transparent ${t * 140}%)`,
            }}
          >
            <Lines stroke={3} />
          </div>
        ) : null,
      )}
      <svg width={CW} height={CH} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 13}, (_, i) => {
          const x0 = rnd(i + 1) * CW;
          const y0 = rnd(i + 51) * CH;
          const vx = (rnd(i + 101) - 0.5) * 1.2;
          const vy = -0.4 - rnd(i + 151) * 0.8;
          const x = (((x0 + vx * frame) % CW) + CW) % CW;
          const y = (((y0 + vy * frame) % CH) + CH) % CH;
          const r = 2 + rnd(i + 201) * 2.5;
          const tw = 0.45 + 0.35 * Math.sin(frame / 9 + i);
          return <circle key={i} cx={x} cy={y} r={r} fill={C.cyan} opacity={tw} style={{filter: `drop-shadow(0 0 6px ${C.cyan})`}} />;
        })}
      </svg>
    </div>
  );
};
