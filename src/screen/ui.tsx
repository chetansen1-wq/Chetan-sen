import React from 'react';
import {useCurrentFrame} from 'remotion';
import {enterExit} from '../anim';
import {C, grotesk} from '../theme';

/** white-on-navy glass pill (70%, 12 px radius) - legible on both the white wall and the dark TV */
export const Pill: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div
    style={{
      background: C.navyPill,
      borderRadius: 12,
      padding: '14px 28px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 18,
      color: C.white,
      backdropFilter: 'blur(6px)',
      boxShadow: '0 6px 24px rgba(10,18,48,0.25)',
      ...style,
    }}
  >
    {children}
  </div>
);

/** mask-up enter (40 px, motion blur <= 6 px) + 6-frame fade-up exit */
export const Reveal: React.FC<{inF: number; outF?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  inF,
  outF,
  children,
  style,
}) => {
  const fr = useCurrentFrame();
  const {y, blur, opacity, visible} = enterExit(fr, inF, outF);
  if (!visible) return null;
  return (
    <div style={{overflow: 'hidden', paddingTop: 6, paddingBottom: 6, marginTop: -6, marginBottom: -6, ...style}}>
      <div style={{transform: `translateY(${y}px)`, filter: blur > 0.2 ? `blur(${blur}px)` : undefined, opacity}}>{children}</div>
    </div>
  );
};

/** small "X · Meaning" chip */
export const Chip: React.FC<{k: string; v: string; kStyle?: React.CSSProperties}> = ({k, v, kStyle}) => (
  <Pill style={{padding: '8px 16px', gap: 10, borderRadius: 12}}>
    <span style={{fontFamily: grotesk, fontWeight: 700, fontSize: 30, color: C.cyan, ...kStyle}}>{k}</span>
    <span style={{fontFamily: grotesk, fontWeight: 500, fontSize: 26, opacity: 0.6}}>·</span>
    <span style={{fontFamily: grotesk, fontWeight: 600, fontSize: 28, letterSpacing: 0.2}}>{v}</span>
  </Pill>
);

export const Center: React.FC<{top: number; children: React.ReactNode; gap?: number}> = ({top, children, gap = 0}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', flexDirection: 'column', alignItems: 'center', gap}}>
    {children}
  </div>
);
