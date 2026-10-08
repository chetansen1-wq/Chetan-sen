import React, {useState} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, ease, enterExit, sp} from '../anim';
import {CUE} from '../cues';
import {anton, C, ensureFonts, f, grotesk, stix} from '../theme';
import {Center, Chip, Pill, Reveal} from './ui';

/*
 * Screen-space layer. NOTE ON PLACEMENT: the brief's "lower third" cannot be used in this framing -
 * the shirt hem sits at y~1560-1590 and the clicker hand drops to ~1450, so the only legal
 * legs-only band above the 300 px Instagram safe zone (y < 1620) is ~40 px tall. All decode pills,
 * labels and the formula therefore live in an upper deck (y 140-470): white wall + the empty top
 * strip of the TV glass, above the TV's own titles and clear of the presenter's head (top ~600).
 */
export const Y = {tracker: 120, card: 150, pill: 274, chips: 372};

/* ---------- S1 headline ---------- */
const Word: React.FC<{text: string; inF: number; outF: number; style: React.CSSProperties}> = ({text, inF, outF, style}) => (
  <Reveal inF={inF} outF={outF} style={{display: 'inline-block'}}>
    <span style={{fontFamily: anton, textTransform: 'uppercase', letterSpacing: -0.5, lineHeight: 1, ...style}}>{text}</span>
  </Reveal>
);

const Headline: React.FC = () => {
  const fr = useCurrentFrame();
  const s = f(CUE.headlineIn), e = f(CUE.headlineOut);
  if (fr < s || fr > e + 6) return null;
  const bg = sp(fr, s, 16);
  const out = interpolate(fr, [e, e + 6], [0, 1], clamp);
  const words1 = ['5', 'FORMULAS'];
  const words2 = ['5', 'DESI', 'MNEMONICS'];
  return (
    <Center top={170}>
      <div style={{opacity: 1 - out, transform: `translateY(${-18 * out}px)`}}>
        <Pill style={{flexDirection: 'column', gap: 6, padding: '14px 34px 16px', transform: `scaleX(${0.85 + 0.15 * bg})`, opacity: bg}}>
          <div style={{display: 'flex', gap: 18}}>
            {words1.map((w, i) => (
              <Word key={i} text={w} inF={s + 4 + i * 5} outF={e} style={{fontSize: 84, color: C.white}} />
            ))}
          </div>
          <div style={{display: 'flex', gap: 14}}>
            {words2.map((w, i) => (
              <Word key={i} text={w} inF={s + 16 + i * 5} outF={e} style={{fontSize: 62, color: C.cyan}} />
            ))}
          </div>
        </Pill>
      </div>
    </Center>
  );
};

/* ---------- chapter tracker ---------- */
const SECTIONS = [CUE.s2, CUE.card2, CUE.card3, CUE.card4, CUE.card5];
const Tracker: React.FC = () => {
  const fr = useCurrentFrame();
  if (fr < f(CUE.s2)) return null;
  const appear = sp(fr, f(CUE.s2), 16);
  const active = SECTIONS.reduce((a, s, i) => (fr >= f(s) ? i : a), 0);
  return (
    <div style={{position: 'absolute', top: Y.tracker - 14, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22, opacity: appear}}>
      {SECTIONS.map((s, i) => {
        const on = sp(fr, f(s), 14) * (i === active ? 1 : 0);
        const size = 12 + 8 * on;
        return (
          <div key={i} style={{width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div
              style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: i === active ? C.cyan : i < active ? 'rgba(10,18,48,0.75)' : 'rgba(10,18,48,0.3)',
                border: i === active ? `2px solid ${C.navy}` : 'none',
                boxShadow: i === active ? `0 0 10px ${C.cyan}` : 'none',
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

/* ---------- chapter card ---------- */
const ChapterCard: React.FC<{n: string; lines: string[]; sub?: string; inF: number; outF: number; size?: number}> = ({n, lines, sub, inF, outF, size = 72}) => (
  <Center top={Y.card}>
    <Reveal inF={inF} outF={outF}>
      <Pill style={{gap: 20, padding: '14px 30px'}}>
        <Reveal inF={inF} outF={outF}>
          <span style={{fontFamily: grotesk, fontWeight: 700, fontSize: 34, color: C.cyan, letterSpacing: 1}}>{n}</span>
        </Reveal>
        <div style={{width: 2, alignSelf: 'stretch', background: 'rgba(34,229,255,0.5)'}} />
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
          {lines.map((l, i) => (
            <Reveal key={i} inF={inF + 3 + i * 3} outF={outF}>
              <span style={{fontFamily: anton, fontSize: size, lineHeight: 1.04, letterSpacing: -0.5, textTransform: 'uppercase', color: C.white, whiteSpace: 'nowrap'}}>{l}</span>
            </Reveal>
          ))}
          {sub && (
            <Reveal inF={inF + 8} outF={outF}>
              <span style={{fontFamily: grotesk, fontWeight: 600, fontSize: 26, letterSpacing: 2.5, color: C.cyan, whiteSpace: 'nowrap'}}>{sub}</span>
            </Reveal>
          )}
        </div>
      </Pill>
    </Reveal>
  </Center>
);

/* ---------- decode pill building blocks ---------- */
const Mn: React.FC<{children: React.ReactNode}> = ({children}) => (
  <span style={{fontFamily: grotesk, fontWeight: 700, fontSize: 44, letterSpacing: 3, color: C.white, whiteSpace: 'nowrap'}}>{children}</span>
);
const Arrow: React.FC<{p: number}> = ({p}) => (
  <svg width={64} height={30} style={{opacity: p, transform: `translateX(${(1 - p) * -12}px)`}}>
    <path d="M2 15 H54 M42 4 L56 15 L42 26" fill="none" stroke={C.cyan} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Sym: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({children, color = C.white, style}) => (
  <span style={{fontFamily: stix, fontStyle: 'italic', fontWeight: 600, fontSize: 56, lineHeight: 1, color, display: 'inline-block', ...style}}>{children}</span>
);
const Eq: React.FC<{style?: React.CSSProperties}> = ({style}) => (
  <span style={{fontFamily: stix, fontWeight: 500, fontSize: 52, lineHeight: 1, color: C.cyan, display: 'inline-block', margin: '0 4px', ...style}}>=</span>
);
/** letter that lands with a small spring from dy */
const Land: React.FC<{at: number; dx?: number; dy?: number; children: React.ReactNode}> = ({at, dx = 0, dy = -18, children}) => {
  const fr = useCurrentFrame();
  const p = sp(fr, at, 13);
  return <span style={{display: 'inline-block', opacity: Math.min(1, p * 1.6), transform: `translate(${(1 - p) * dx}px, ${(1 - p) * dy}px)`}}>{children}</span>;
};
const glowPulse = (fr: number, at: number) => {
  const g = interpolate(fr, [at, at + 4, at + 18], [0, 1, 0], clamp);
  return g > 0 ? `drop-shadow(0 0 ${8 + 6 * g}px rgba(34,229,255,${0.9 * g}))` : undefined;
};

/* ---------- S2 ---------- */
const S2: React.FC = () => {
  const fr = useCurrentFrame();
  const pin = f(CUE.pill1), out = f(CUE.card1Out);
  return (
    <>
      <ChapterCard n="01" lines={["OHM'S LAW"]} inF={f(CUE.s2)} outF={out} />
      <Center top={Y.pill}>
        <Reveal inF={pin} outF={out}>
          <Pill>
            <Mn>VIR</Mn>
            <Arrow p={interpolate(fr, [pin + 5, pin + 11], [0, 1], clamp)} />
            <span style={{display: 'inline-flex', alignItems: 'baseline', gap: 6}}>
              <Land at={pin + 9}><Sym>V</Sym></Land>
              <Land at={pin + 12}><Eq /></Land>
              <Land at={pin + 14}><Sym>I</Sym></Land>
              <Land at={pin + 16}><Sym>R</Sym></Land>
            </span>
          </Pill>
        </Reveal>
      </Center>
      <Center top={Y.chips}>
        <div style={{display: 'flex', gap: 12}}>
          {[['V', 'Voltage'], ['I', 'Current'], ['R', 'Resistance']].map(([k, v], i) => (
            <Reveal key={k} inF={f(CUE.labels1) + i * 6} outF={out}>
              <Chip k={k} v={v} kStyle={{fontFamily: stix, fontStyle: 'italic', fontSize: 34}} />
            </Reveal>
          ))}
        </div>
      </Center>
    </>
  );
};

/* ---------- S3 ---------- */
const S3: React.FC = () => {
  const fr = useCurrentFrame();
  const pin = f(CUE.pill2), out = f(CUE.s3Exit);
  return (
    <>
      <ChapterCard n="02" lines={['ELECTRIC POWER']} inF={f(CUE.card2)} outF={out} />
      <Center top={Y.pill}>
        <Reveal inF={pin} outF={out}>
          <Pill>
            <Mn>VIP</Mn>
            <Arrow p={interpolate(fr, [pin + 5, pin + 11], [0, 1], clamp)} />
            <span style={{display: 'inline-flex', alignItems: 'baseline', gap: 8}}>
              <Land at={pin + 9} dx={-60} dy={0}><Sym>V</Sym></Land>
              <Land at={pin + 9} dx={60} dy={0}><Sym>I</Sym></Land>
              <span style={{display: 'inline-flex', alignItems: 'baseline', filter: glowPulse(fr, pin + 18)}}>
                <Land at={pin + 17} dy={-26}><Eq /></Land>
                <Land at={pin + 18} dy={-26}><Sym color={C.cyan}>P</Sym></Land>
              </span>
            </span>
          </Pill>
        </Reveal>
      </Center>
    </>
  );
};

/* ---------- S4 ---------- */
const S4: React.FC = () => {
  const fr = useCurrentFrame();
  const pin = f(CUE.pill3), tr = f(CUE.pill3Transform), out = f(CUE.card4) - 2;
  const t = interpolate(fr, [tr, tr + 12], [0, 1], {...clamp, easing: ease});
  const eqW = interpolate(fr, [tr + 6, tr + 14], [0, 1], {...clamp, easing: ease});
  return (
    <>
      <ChapterCard n="03" lines={['HEATING EFFECT']} sub="OF ELECTRIC CURRENT" inF={f(CUE.card3)} outF={out} size={64} />
      <Center top={Y.pill + 18}>
        <Reveal inF={pin} outF={out}>
          <Pill>
            <Mn>HI TUTOR</Mn>
            <Arrow p={interpolate(fr, [pin + 5, pin + 11], [0, 1], clamp)} />
            <span style={{display: 'inline-flex', alignItems: 'baseline', gap: 6}}>
              <Land at={pin + 9}><Sym>H</Sym></Land>
              <span style={{display: 'inline-block', width: 44 * eqW, overflow: 'hidden', opacity: eqW, transform: `scale(${0.6 + 0.4 * eqW})`}}>
                <Eq />
              </span>
              <Land at={pin + 11}><Sym>I</Sym></Land>
              <Land at={pin + 13}>
                <Sym style={{fontSize: 56 - 22 * t, transform: `translateY(${-24 * t}px)`, color: t > 0.5 ? C.cyan : C.white, marginLeft: -2 - 2 * t}}>2</Sym>
              </Land>
              <Land at={pin + 15}><Sym>t</Sym></Land>
              <Land at={pin + 17}><Sym>R</Sym></Land>
            </span>
          </Pill>
        </Reveal>
      </Center>
      <Center top={Y.chips + 18}>
        <div style={{display: 'flex', gap: 10}}>
          {[['H', 'Heat'], ['I', 'Current'], ['t', 'Time'], ['R', 'Resistance']].map(([k, v], i) => (
            <Reveal key={k} inF={tr + 14 + i * 5} outF={out}>
              <Chip k={k} v={v} kStyle={{fontFamily: stix, fontStyle: 'italic', fontSize: 32}} />
            </Reveal>
          ))}
        </div>
      </Center>
    </>
  );
};

/* ---------- S5 ---------- */
const S5: React.FC = () => {
  const fr = useCurrentFrame();
  const out = f(CUE.s5Exit);
  const rows: [string, string][] = [['L', 'Length'], ['A', 'Cross-sectional Area'], ['T', 'Temperature'], ['M', 'Material']];
  return (
    <>
      <ChapterCard n="04" lines={['FACTORS AFFECTING', 'RESISTANCE']} inF={f(CUE.card4)} outF={out} size={54} />
      <div style={{position: 'absolute', top: Y.chips - 54, left: 0, right: 0, display: 'grid', gridTemplateColumns: 'auto auto', justifyContent: 'center', columnGap: 12, rowGap: 10}}>
        {rows.map(([k, v], i) => (
          <Reveal key={k} inF={f(CUE.rows[i])} outF={out}>
            <Pill style={{padding: '8px 16px', gap: 10}}>
              <div style={{width: 10, height: 10, borderRadius: '50%', background: C.cyan, boxShadow: `0 0 8px ${C.cyan}`}} />
              <span style={{fontFamily: grotesk, fontWeight: 700, fontSize: 30, color: C.cyan}}>{k}</span>
              <span style={{fontFamily: grotesk, fontWeight: 500, fontSize: 26, opacity: 0.6}}>·</span>
              <span style={{fontFamily: grotesk, fontWeight: 600, fontSize: 28}}>{v}</span>
            </Pill>
          </Reveal>
        ))}
      </div>
    </>
  );
};

/* ---------- S6 ---------- */
const S6: React.FC = () => {
  const fr = useCurrentFrame();
  const pin = f(CUE.pill5), [d0] = CUE.decode.map(f), fx = f(CUE.fraction);
  const morph = interpolate(fr, [d0, d0 + 8], [0, 1], {...clamp, easing: ease});
  const bounce = 1 + 0.35 * Math.sin(Math.PI * Math.min(1, Math.max(0, (fr - d0) / 12))) * (fr >= d0 ? 1 : 0);
  // formula
  const bar = interpolate(fr, [fx + 3, fx + 12], [0, 1], {...clamp, easing: ease});
  const breathe = fr >= f(CUE.holdFrom) ? 1 + 0.04 * Math.sin(((fr - f(CUE.holdFrom)) / 25) * Math.PI * 0.8) : 1;
  const ringT = interpolate(fr, [fx, fx + 22], [0, 1], {...clamp, easing: ease});
  const ringOn = fr >= fx && fr <= fx + 22;
  const FY = 168; // formula block top
  return (
    <>
      <ChapterCard n="05" lines={['BHAI KA FORMULA']} inF={f(CUE.card5)} outF={fx - 6} />
      <Center top={Y.pill}>
        <Reveal inF={pin} outF={fx - 6}>
          <Pill>
            <span style={{display: 'inline-flex', alignItems: 'baseline', gap: 22}}>
              <Sym>R</Sym>
              <span style={{position: 'relative', display: 'inline-block', width: 36, textAlign: 'center'}}>
                <Sym style={{opacity: 1 - morph}}>P</Sym>
                <Sym color={C.cyan} style={{position: 'absolute', left: 0, right: 0, opacity: morph, transform: `scale(${bounce})`, filter: glowPulse(fr, d0 + 2)}}>ρ</Sym>
              </span>
              <Sym>L</Sym>
              <Sym>A</Sym>
            </span>
          </Pill>
        </Reveal>
      </Center>
      {/* resistivity label: appears with the decode, then stays under the formula */}
      <Center top={fr < fx ? Y.chips : Y.chips + 30}>
        <Reveal inF={d0 + 10}>
          <Chip k="ρ" v="Resistivity (Material)" kStyle={{fontFamily: stix, fontStyle: 'italic', fontSize: 34}} />
        </Reveal>
      </Center>
      {fr >= fx && (
        <div style={{position: 'absolute', top: FY, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div style={{position: 'relative', transform: `scale(${1 + (breathe - 1) * 0.12})`}}>
            {ringOn && (
              <div style={{position: 'absolute', left: '50%', top: '50%', width: 520 * ringT, height: 520 * ringT, marginLeft: -260 * ringT, marginTop: -260 * ringT,
                borderRadius: '50%', border: `4px solid ${C.cyan}`, opacity: 0.6 * (1 - ringT), boxShadow: `0 0 12px ${C.cyan}`}} />
            )}
            <Reveal inF={fx}>
              <Pill style={{padding: '18px 40px', gap: 22, filter: `drop-shadow(0 0 ${10 * breathe}px rgba(34,229,255,${0.35 * breathe}))`}}>
                <span style={{display: 'inline-flex', alignItems: 'center', gap: 16, transform: `scale(${interpolate(sp(fr, fx, 12), [0, 1], [1.25, 1])})`}}>
                  <Sym style={{fontSize: 92}}>R</Sym>
                  <Eq style={{fontSize: 80}} />
                  <Sym color={C.cyan} style={{fontSize: 92}}>ρ</Sym>
                </span>
                <span style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'center', width: 96}}>
                  <Land at={fx + 7} dy={-60}><Sym style={{fontSize: 76}}>L</Sym></Land>
                  <div style={{height: 6, width: 96 * bar, alignSelf: 'flex-start', background: C.cyan, borderRadius: 3, margin: '6px 0', boxShadow: `0 0 8px ${C.cyan}`}} />
                  <Land at={fx + 9} dy={60}><Sym style={{fontSize: 76}}>A</Sym></Land>
                </span>
              </Pill>
            </Reveal>
          </div>
        </div>
      )}
    </>
  );
};

export const Screen: React.FC = () => {
  // load fonts only in tabs that actually render text (never at module level: Remotion's
  // metadata tab evaluates the bundle too, and an orphaned handle there times out the render)
  useState(() => ensureFonts());
  const fr = useCurrentFrame();
  const show = (a: number, b: number) => fr >= f(a) - 1 && fr <= f(b) + 8;
  return (
    <AbsoluteFill>
      <Headline />
      <Tracker />
      {show(CUE.s2, CUE.card1Out) && <S2 />}
      {show(CUE.card2, CUE.s3Exit) && <S3 />}
      {show(CUE.card3, CUE.card4) && <S4 />}
      {show(CUE.card4, CUE.s5Exit) && <S5 />}
      {show(CUE.card5, CUE.end) && <S6 />}
    </AbsoluteFill>
  );
};
