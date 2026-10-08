import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Bezel} from './tv/Bezel';
import {Arc, DiagramTraces, Glint, RingR, ScanLine, Sweep, Ticks} from './tv/Effects';
import {Grid} from './tv/Grid';
import {TVSpace} from './tv/TVSpace';

/**
 * Everything pinned to the TV plane. Rendered on transparent background and composited onto the
 * footage with the presenter matte (pipeline/composite.sh), so it always passes BEHIND the
 * presenter and the TV's own cartoon characters.
 */
export const TVLayer: React.FC = () => (
  <AbsoluteFill>
    <TVSpace>
      <Grid />
      <ScanLine />
      <Sweep />
      <Glint />
      <Arc />
      <Ticks />
      <DiagramTraces />
      <RingR />
    </TVSpace>
    <Bezel />
  </AbsoluteFill>
);
