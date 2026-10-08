/**
 * Positions of the TV's own graphics in canonical TV space (CW x CH = 1600 x 900), measured on
 * rectified frames (pipeline/rectify.py). The visible glass ends near x~1250 (frame edge).
 */
export const TVC = {
  /** VIR letters box (glint mask public/masks/vir.png covers exactly this box) */
  vir: {x: 830, y: 222, w: 185, h: 100},
  /** arc endpoints: right side of V -> left side of I, where the "=" lands */
  arcFrom: [852, 284] as [number, number],
  arcTo: [924, 284] as [number, number],
  /** underline ticks [centre x, y, width] under L, A, T, M */
  latm: [
    [853, 300, 52],
    [926, 300, 52],
    [993, 300, 52],
    [1064, 300, 52],
  ] as [number, number, number][],
  /** diagram traces, in row order: L (length), A (cross-section), T (thermometer), M (material) */
  traces: [
    'M 878 488 L 1115 428 M 878 470 L 878 506 M 1115 410 L 1115 446',
    'M 835 578 A 46 62 -12 1 1 834 578 Z',
    'M 1098 522 A 15 15 0 0 1 1128 522 L 1128 612 A 27 27 0 1 1 1098 612 Z',
    'M 934 598 L 1046 566 L 1058 612 L 946 644 Z',
  ],
  /** ring around the "R" of RLATM: [cx, cy, r] */
  r: [797, 255, 58] as [number, number, number],
};
