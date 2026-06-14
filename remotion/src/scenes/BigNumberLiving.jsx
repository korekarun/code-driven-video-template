import {
  useCurrentFrame, interpolate, spring, useVideoConfig,
  Audio, staticFile, AbsoluteFill, Easing,
} from 'remotion';
import { COLORS } from '../theme.js';
import { fontPrimary, fontSecondary } from '../fonts.js';
import { BRAND_NAME } from '../brand.js';

// ── パレット ──────────────────────────────────────────────────────────────────
const ACCENT_MAP = {
  prob: { color: '#ff6b6b', glow: 'rgba(255,107,107,.5)', rgb: '255,107,107' },
  data: { color: '#4dabf7', glow: 'rgba(77,171,247,.5)',  rgb: '77,171,247'  },
  sol:  { color: '#69db7c', glow: 'rgba(105,219,124,.5)', rgb: '105,219,124' },
};

// Ring geometry (viewBox 0 0 500 500, r=205)
const CIRC     = 2 * Math.PI * 205;
const R_TICK   = 228;
const TICK_GAP = (2 * Math.PI * R_TICK / 36) - 2;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

function useFadeUp(startFrame, dur = 22) {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [startFrame, startFrame + dur], [0, 1], {
    ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return { opacity: p, transform: `translateY(${interpolate(p, [0, 1], [18, 0])}px)` };
}

// ── Header ────────────────────────────────────────────────────────────────────
const Header = ({ slideNum, totalSlides, acc, glow }) => {
  const s = useFadeUp(2);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2%', ...s }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: acc, boxShadow: `0 0 8px ${glow}` }} />
        <span style={{ fontFamily: fontPrimary, fontSize: 18, fontWeight: 700, letterSpacing: '.14em', color: COLORS.g50 }}>
          {BRAND_NAME}
        </span>
      </div>
      <span style={{ fontFamily: fontPrimary, fontSize: 18, fontWeight: 700, letterSpacing: '.08em', color: COLORS.g30 }}>
        {String(slideNum).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
      </span>
    </div>
  );
};

// ── SectionLabel ──────────────────────────────────────────────────────────────
const SectionLabel = ({ children, acc }) => {
  const s = useFadeUp(5);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.8%', ...s }}>
      <div style={{ width: 18, height: 3, background: acc, borderRadius: 2 }} />
      <span style={{ fontFamily: fontPrimary, fontSize: 44, fontWeight: 700, letterSpacing: '.08em', color: acc }}>
        {children}
      </span>
    </div>
  );
};

// ── Word highlight ────────────────────────────────────────────────────────────
const HlWord = ({ word, fs, frame, acc, glow }) => {
  const on  = interpolate(frame, [fs,     fs + 3 ], [0, 1], clamp);
  const off = interpolate(frame, [fs + 5, fs + 14], [1, 0], clamp);
  const t   = Math.max(0, Math.min(1, on * off));
  return (
    <span style={{ position: 'relative', display: 'inline' }}>
      <span style={{ color: COLORS.g50 }}>{word}</span>
      <span style={{
        position: 'absolute', left: 0, top: 0,
        color: acc, opacity: t,
        textShadow: `0 0 14px ${glow}`,
        pointerEvents: 'none',
      }}>
        {word}
      </span>
    </span>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const BigNumberLiving = ({
  number           = '85',
  unit             = '% が目安',
  label            = 'VO₂max の強度',
  ringFraction     = 0.85,
  segments         = [],
  chips            = [],
  slideNum         = 1,
  totalSlides      = 18,
  triggerFrame     = 60,
  sectionType      = 'data',
  audioFile        = null,
  paperTitle       = '',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pal = ACCENT_MAP[sectionType] || ACCENT_MAP.data;
  const { color: acc, glow } = pal;

  // ① 数字 spring
  const numberSpring = spring({
    frame: frame - triggerFrame,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.8 },
  });

  // ② リング進捗
  const ringProgress = interpolate(
    frame,
    [triggerFrame, triggerFrame + 30],
    [0, ringFraction],
    { extrapolateRight: 'clamp' },
  );
  const ringDash  = ringProgress * CIRC;
  const dotAngle  = -Math.PI / 2 + ringProgress * 2 * Math.PI;
  const dotX      = 250 + 205 * Math.cos(dotAngle);
  const dotY      = 250 + 205 * Math.sin(dotAngle);
  const dotOpacity = interpolate(frame, [triggerFrame + 28, triggerFrame + 36], [0, 1], clamp);

  // ③ 数字の呼吸
  const breathe = Math.sin(frame * 0.08) * 0.015 + 1;

  // ④ 背景パーティクル (deterministic)
  const particles = Array.from({ length: 20 }, (_, i) => {
    const seed = i * 1000;
    const x       = ((frame * 2 + seed) % 1920);
    const y       = 540 + Math.sin((frame + seed) * 0.05) * 200;
    const opacity = ((Math.sin((frame + seed) * 0.03) + 1) / 2) * 0.25;
    return { x, y, opacity, size: 3 + (i % 3) };
  });

  // ナレーション opacity
  const narOp = interpolate(
    frame,
    [0, 3, triggerFrame, triggerFrame + 20],
    [0.2, 0.7, 0.7, 0.45],
    clamp,
  );

  // ⑥ チップ スタッガード spring
  const chipSprings = chips.map((_, i) => {
    const cs = triggerFrame + 30 + i * 6;
    const s  = spring({ frame: frame - cs, fps, config: { damping: 15, stiffness: 200 } });
    return {
      opacity:   Math.max(0, Math.min(1, s)),
      transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
    };
  });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, overflow: 'hidden' }}>

      {audioFile && <Audio src={staticFile(audioFile)} />}

      {/* 背景パーティクル */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: p.x, top: p.y,
          width: p.size, height: p.size,
          background: acc, borderRadius: '50%',
          opacity: p.opacity, filter: 'blur(1px)',
        }} />
      ))}

      {/* ラジアルグロー */}
      <div style={{
        position: 'absolute', width: '60%', height: '70%',
        background: `radial-gradient(circle, rgba(${pal.rgb},.10) 0%, transparent 70%)`,
        top: '15%', left: '20%', pointerEvents: 'none',
      }} />

      {/* レイアウト */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        padding: '3% 4.5%',
      }}>
        <Header slideNum={slideNum} totalSlides={totalSlides} acc={acc} glow={glow} />
        <SectionLabel acc={acc}>{label}</SectionLabel>

        {/* センターボディ */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', gap: 32,
        }}>

          {/* リング + 数字 */}
          <div style={{
            position: 'relative', width: 500, height: 500,
            opacity: numberSpring,
            transform: `scale(${numberSpring * breathe})`,
          }}>
            <svg viewBox="0 0 500 500" width="500" height="500"
              style={{ position: 'absolute', inset: 0 }}>
              <circle cx="250" cy="250" r="205" fill="none"
                stroke="rgba(255,255,255,.08)" strokeWidth="12" />
              <circle cx="250" cy="250" r={R_TICK} fill="none"
                stroke="rgba(255,255,255,.18)" strokeWidth="10"
                strokeDasharray={`2 ${TICK_GAP.toFixed(1)}`}
                transform="rotate(-90 250 250)" />
              <circle cx="250" cy="250" r="205" fill="none"
                stroke={acc}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${ringDash.toFixed(2)} ${CIRC.toFixed(2)}`}
                transform="rotate(-90 250 250)"
                style={{ filter: `drop-shadow(0 0 8px ${glow}) drop-shadow(0 0 20px rgba(${pal.rgb},.35))` }}
              />
              <circle cx={dotX.toFixed(2)} cy={dotY.toFixed(2)} r="9"
                fill={acc} opacity={dotOpacity.toFixed(3)}
                style={{ filter: `drop-shadow(0 0 10px ${acc}) drop-shadow(0 0 22px ${glow})` }}
              />
            </svg>

            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: fontSecondary,
                fontSize: 160,
                fontWeight: 900,
                color: acc,
                lineHeight: 1,
                textShadow: `0 0 60px ${glow}, 0 0 120px rgba(${pal.rgb},.25)`,
              }}>
                {number}
              </span>
              <span style={{
                fontFamily: fontSecondary,
                fontSize: 40,
                fontWeight: 900,
                color: COLORS.white,
                marginTop: 10,
                opacity: 0.9,
              }}>
                {unit}
              </span>
            </div>
          </div>

          {/* ナレーション */}
          {segments.length > 0 && (
            <div style={{
              fontFamily: fontPrimary,
              fontSize: 36,
              color: COLORS.g50,
              textAlign: 'center',
              maxWidth: '68%',
              lineHeight: 1.65,
              opacity: narOp,
              wordBreak: 'keep-all',
              lineBreak: 'strict',
            }}>
              {segments.map((seg, i) =>
                seg.hl
                  ? <HlWord key={i} word={seg.t} fs={seg.fs ?? 0} frame={frame} acc={acc} glow={glow} />
                  : <span key={i}>{seg.t}</span>
              )}
            </div>
          )}

          {/* チップ */}
          {chips.length > 0 && (
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
              {chips.map((chip, i) => (
                <div key={i} style={{
                  textAlign: 'center',
                  background: COLORS.g04,
                  border: `1px solid ${COLORS.bdr}`,
                  borderRadius: 8,
                  padding: '16px 32px',
                  ...chipSprings[i],
                }}>
                  <div style={{ fontFamily: fontPrimary, fontSize: 30, fontWeight: 700, color: COLORS.g70 }}>
                    {chip.cv}
                  </div>
                  <div style={{ fontFamily: fontPrimary, fontSize: 26, color: COLORS.g50, marginTop: 6 }}>
                    {chip.cl}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {paperTitle && (
        <div style={{
          position: 'absolute', bottom: '0.8%', right: '1.2%',
          fontSize: 7, color: 'rgba(255,255,255,.18)', letterSpacing: '.04em',
        }}>{paperTitle}</div>
      )}

    </AbsoluteFill>
  );
};

BigNumberLiving.defaultProps = {
  number:       '85',
  unit:         '% が目安',
  label:        'VO₂max の強度',
  ringFraction: 0.85,
  segments: [
    { t: '最大', hl: true,  fs: 2  },
    { t: '酸素', hl: true,  fs: 15 },
    { t: '摂取', hl: true,  fs: 25 },
    { t: '量',   hl: true,  fs: 34 },
    { t: 'の85%を目安に、ペースをコントロールします', hl: false },
  ],
  chips: [
    { cv: 'サブ3ペース',   cl: '4分15秒/km 程度' },
    { cv: '最大心拍数',    cl: '165〜170 bpm 相当' },
    { cv: 'RPE スケール',  cl: '13〜15（少しきつい）' },
  ],
  slideNum:    3,
  totalSlides: 18,
  triggerFrame: 60,
  sectionType: 'data',
  audioFile:   null,
};
