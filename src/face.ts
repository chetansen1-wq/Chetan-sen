import face from './face.json';

/** smoothed face position (screen px) used as the push-in anchor */
export const FACE = (fr: number): [number, number] => {
  const a = face as [number, number][];
  return a[Math.max(0, Math.min(a.length - 1, fr))];
};
