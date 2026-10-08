import React from 'react';
import {AbsoluteFill, Composition, OffthreadVideo, staticFile} from 'remotion';
import {Main} from './Main';
import {Screen} from './screen/Screen';
import {DURATION, FPS, H, W} from './theme';
import {TVLayer} from './TVLayer';

/** studio preview only: raw footage + both layers, no matte */
const Preview: React.FC = () => (
  <AbsoluteFill>
    <OffthreadVideo src={staticFile('footage.mp4')} />
    <TVLayer />
    <Screen />
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
    <Composition id="TVLayer" component={TVLayer} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
    <Composition id="ScreenOnly" component={Screen} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
    <Composition id="Preview" component={Preview} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
  </>
);
