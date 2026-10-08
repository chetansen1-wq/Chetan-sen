import React from 'react';
import {AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {clamp, ease} from './anim';
import {CUE, SFX} from './cues';
import {Screen} from './screen/Screen';
import {f} from './theme';
import {FACE} from './face';

const SFX_GAIN = Math.pow(10, -21 / 20); // files peak at -1 dBFS -> -22 dBFS in the mix

/** digital push-ins, max 1.03, anchored on the presenter's face */
const zoomAt = (fr: number) => {
  const k = (pairs: [number, number][], easing = ease) =>
    interpolate(fr, pairs.map((p) => f(p[0])), pairs.map((p) => p[1]), {...clamp, easing});
  if (fr < f(21.0)) return k([[CUE.pushA[0], 1.0], [CUE.pushA[1], 1.03]]);
  if (fr < f(CUE.punch[0])) return k([[21.0, 1.03], [23.2, 1.0]]);
  if (fr < f(47.5)) {
    const p0 = f(CUE.punch[0]);
    if (fr < p0 + 10) return interpolate(fr, [p0, p0 + 10], [1.0, 1.02], {...clamp, easing: ease});
    return k([[25.2, 1.02], [CUE.punch[1], 1.0]]);
  }
  if (fr < f(CUE.settle[0])) return k([[47.5, 1.0], [CUE.settle[0], 1.024]]);
  return k([[CUE.settle[0], 1.024], [CUE.settle[1], 1.03]], (t) => 1 - Math.pow(1 - t, 3));
};

export const Main: React.FC = () => {
  const fr = useCurrentFrame();
  const z = zoomAt(fr);
  const [ax, ay] = FACE(fr);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: `${ax}px ${ay}px`}}>
        <OffthreadVideo src={staticFile('base.mp4')} volume={1} />
      </AbsoluteFill>
      <Screen />
      {SFX.map(({file, at}, i) => (
        <Sequence key={i} from={f(at)} durationInFrames={75} layout="none">
          <Audio src={staticFile(`sfx/${file}.wav`)} volume={SFX_GAIN} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
