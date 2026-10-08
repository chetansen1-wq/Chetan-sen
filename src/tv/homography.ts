export type Pt = [number, number];
export type Quad = [Pt, Pt, Pt, Pt]; // TL, TR, BR, BL

/** Canonical TV space: overlays are authored in a CW x CH rectangle that maps onto the tracked quad. */
export const CW = 1600;
export const CH = 900;

/** Solve the 3x3 homography taking the CW x CH rectangle to `q` (closed form, unit square -> quad). */
export const rectToQuad = (q: Quad): number[] => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const h = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, c = x0;
  const d = y1 - y0 + g * y1, e = y3 - y0 + h * y3, ff = y0;
  // unit square -> quad, then pre-scale by 1/CW, 1/CH
  return [a / CW, b / CH, c, d / CW, e / CH, ff, g / CW, h / CH, 1];
};

export const toMatrix3d = (m: number[]) => {
  const [a, b, c, d, e, ff, g, h, i] = m;
  return `matrix3d(${a},${d},0,${g},${b},${e},0,${h},0,0,1,0,${c},${ff},0,${i})`;
};

export const project = (m: number[], x: number, y: number): Pt => {
  const w = m[6] * x + m[7] * y + m[8];
  return [(m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w];
};
