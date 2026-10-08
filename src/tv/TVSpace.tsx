import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import quads from '../../public/tv_quad.json';
import {CH, CW, Quad, rectToQuad, toMatrix3d} from './homography';

const frames = (quads as unknown as {frames: Quad[]}).frames;

export const quadAt = (frame: number): Quad => frames[Math.max(0, Math.min(frames.length - 1, frame))];
export const homographyAt = (frame: number) => rectToQuad(quadAt(frame));

/** Children are laid out in canonical TV space (CW x CH) and pinned to the tracked TV plane. */
export const TVSpace: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: CW,
          height: CH,
          transformOrigin: '0 0',
          transform: toMatrix3d(homographyAt(frame)),
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
