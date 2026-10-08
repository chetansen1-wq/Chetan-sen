/**
 * Reel-time cues (seconds; reel = source - 3.0 s), verified against the footage at 0.2 s steps.
 * Values that differ from the brief carry the original in a comment.
 */
export const CUE = {
  // S1 hook
  gridEnd: 14.0,
  headlineIn: 0.6,
  headlineOut: 5.5,
  gridPulses: [6.2, 8.9], // speech pauses (silence onsets 6.20 / 8.89)
  pushA: [9.0, 14.0],
  bezelStart: 11.0, // hand raise 10.6-11.4

  // S2 Ohm's law
  s2: 14.0,
  card1Out: 22.5,
  scanLine: 14.5, // TV brush title animates 14.5-14.7
  glint: 15.4, // brief 15.0 - the VIR letters only finish forming at 15.3
  arc: 18.2, // brief 17.5 - the TV "=" lands at 18.2-18.3
  pill1: 18.3, // brief 18.0 - follows the corrected "=" beat
  labels1: 18.9, // brief 18.6 - keeps the 0.6 s offset from the pill

  // S3 electric power
  sweep: 23.0, // TV cuts to the next slide at 23.3: the sweep peaks there
  tvCut2: 23.3,
  card2: 23.2,
  punch: [24.3, 26.0],
  pill2: 26.6, // brief 26.3 - TV "VI=P" lands at 26.6-26.7
  s3Exit: 31.5,

  // S4 heating effect
  card3: 32.3,
  tvCut3: 32.4,
  pill3: 33.2, // brief 33.0 - TV "HI2tR" letters finish at 33.2
  pill3Transform: 35.6, // brief 35.3 - TV switches to "H=I²tR" at 35.6-35.7
  heat: [35.0, 38.5],

  // S5 factors affecting resistance
  pan: [38.5, 39.5], // no camera pan in this footage (TV corner moves <2 px/frame); the presenter turns
  card4: 39.3,
  tvCut4: 39.2,
  tickLAT: 39.4, // brief 39.0 - TV is still on the heating slide until 39.2; LAT appears 39.3-39.4
  tickM: 39.7, // brief 39.5 - M appears 39.6-39.7
  ticksOut: 41.4, // TV re-lays out LATM -> RLATM at 41.7
  diagram: 41.8, // brief 41.5 - RLATM + wire diagram land at 41.7-41.9
  rows: [42.8, 43.8, 44.8, 45.8],
  ringR: [42.7, 44.0], // brief 42.5 - pointing gesture starts 42.7
  s5Exit: 47.0,

  // S6 resistance formula
  card5: 47.5,
  tvCut5: 47.6,
  pill5: 48.5,
  decode: [49.0, 50.0],
  fraction: 50.7, // brief 50.5 - TV fraction builds 50.7-50.9
  holdFrom: 51.7,
  settle: [57.0, 60.2],
  end: 61.2,
};

export const SFX: {file: string; at: number}[] = [
  {file: 'whoosh', at: 14.0},
  {file: 'whoosh', at: 23.0},
  {file: 'whoosh', at: 32.3},
  {file: 'whoosh', at: 39.3},
  {file: 'whoosh', at: 47.5},
  {file: 'zap', at: CUE.arc},
  {file: 'hum', at: CUE.pill2},
  {file: 'warm', at: CUE.pill3Transform},
  ...CUE.rows.map((at) => ({file: 'tick', at})),
  {file: 'impact', at: CUE.fraction},
];
