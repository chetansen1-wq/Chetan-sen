import {continueRender, delayRender, staticFile} from 'remotion';

export const FPS = 25;
export const W = 1080;
export const H = 1920;
export const DURATION = 1530; // 61.2 s

export const C = {
  navy: '#0A1230',
  blue: '#1F6BFF',
  cyan: '#22E5FF',
  white: '#FFFFFF',
  heatA: '#FF7A1A',
  heatB: '#FF3D2E',
  navyPill: 'rgba(10, 18, 48, 0.7)',
};

/*
 * Anton / Space Grotesk / STIX Two Text, self-hosted from Fontsource (public/fonts): the render
 * sandbox cannot reach fonts.gstatic.com, so @remotion/google-fonts would fail to load.
 */
const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const GREEK = 'U+0370-03FF';
const fontFiles: [string, string, string, string, string?][] = [
  ['Anton', 'anton-latin-400-normal', '400', 'normal'],
  ['Space Grotesk', 'space-grotesk-latin-500-normal', '500', 'normal'],
  ['Space Grotesk', 'space-grotesk-latin-600-normal', '600', 'normal'],
  ['Space Grotesk', 'space-grotesk-latin-700-normal', '700', 'normal'],
  ...(['500', '600'] as const).flatMap((wt) =>
    (['italic', 'normal'] as const).flatMap((st) => [
      ['STIX Two Text', `stix-two-text-latin-${wt}-${st}`, wt, st, LATIN] as [string, string, string, string, string],
      ['STIX Two Text', `stix-two-text-greek-${wt}-${st}`, wt, st, GREEK] as [string, string, string, string, string],
    ]),
  ),
];
let fontsRequested = false;
/**
 * Load the faces once per tab (called by screen-space components only; the TV layer has no text).
 * The handle is always released - a FontFace promise that never settles must not stall a render.
 */
export const ensureFonts = () => {
  if (fontsRequested || typeof document === 'undefined') return;
  fontsRequested = true;
  const handle = delayRender('fonts', {timeoutInMilliseconds: 60000});
  let done = false;
  const release = () => {
    if (!done) {
      done = true;
      continueRender(handle);
    }
  };
  const faces = fontFiles.map(([family, file, weight, style, unicodeRange]) =>
    new FontFace(family, `url(${staticFile(`fonts/${file}.woff2`)}) format('woff2')`, {weight, style, ...(unicodeRange ? {unicodeRange} : {})}),
  );
  Promise.allSettled(faces.map((ff) => ff.load().then(() => document.fonts.add(ff)))).then(release);
  setTimeout(release, 20000);
};

export const anton = 'Anton, sans-serif';
export const grotesk = '"Space Grotesk", sans-serif';
export const stix = '"STIX Two Text", serif';

/** seconds (reel time) -> frame */
export const f = (s: number) => Math.round(s * FPS);

/** cyan glow, kept within the 8-14 px band */
export const glow = (px = 10, color = C.cyan) => `drop-shadow(0 0 ${Math.min(14, Math.max(8, px))}px ${color})`;
