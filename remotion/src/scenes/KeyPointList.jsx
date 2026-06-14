import {
  useCurrentFrame, useVideoConfig, spring, interpolate, Easing,
  AbsoluteFill, Audio, Sequence, staticFile,
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
const clamp      = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const bezierEase = { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) };

// ── Lucide Icons (inline SVG) ──────────────────────────────────────────────────
const SvgIcon = ({ children, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const ICON_MAP = {
  Activity:   (p) => <SvgIcon {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></SvgIcon>,
  Zap:        (p) => <SvgIcon {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></SvgIcon>,
  Target:     (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></SvgIcon>,
  Star:       (p) => <SvgIcon {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></SvgIcon>,
  TrendingUp: (p) => <SvgIcon {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></SvgIcon>,
  BarChart2:  (p) => <SvgIcon {...p}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></SvgIcon>,
  Layers:     (p) => <SvgIcon {...p}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></SvgIcon>,
  Award:      (p) => <SvgIcon {...p}><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></SvgIcon>,
  CheckCircle:(p) => <SvgIcon {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></SvgIcon>,
  Clock:      (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></SvgIcon>,
  Heart:      (p) => <SvgIcon {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></SvgIcon>,
  Repeat:     (p) => <SvgIcon {...p}><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></SvgIcon>,
  BookOpen:   (p) => <SvgIcon {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></SvgIcon>,
  Battery:    (p) => <SvgIcon {...p}><rect x="1" y="6" width="18" height="12" rx="2" ry="2" /><line x1="23" y1="13" x2="23" y2="11" /></SvgIcon>,
  Flame:      (p) => <SvgIcon {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></SvgIcon>,
  Wind:       (p) => <SvgIcon {...p}><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" /></SvgIcon>,
};
const LucideIcon = ({ name, color, size = 48 }) => {
  const fn = ICON_MAP[name];
  if (fn) return fn({ color, size });
  return <SvgIcon color={color} size={size}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></SvgIcon>;
};

// ── 三角レイアウト定数 ────────────────────────────────────────────────────────
const BADGE_R = 56;                    // バッジ半径
const TRI_POS = [
  { x: 960,  y: 255  },               // 頂点（上）
  { x: 490,  y: 790  },               // 左下
  { x: 1430, y: 790  },               // 右下
];
const TRI_LINES = [[0, 1], [0, 2], [1, 2]];

// バッジ端から始まる短縮済み線分
const triLineEP = (i, j) => {
  const A = TRI_POS[i], B = TRI_POS[j];
  const dx = B.x - A.x, dy = B.y - A.y;
  const d  = Math.hypot(dx, dy);
  const ux = dx / d, uy = dy / d;
  const pad = BADGE_R + 14;
  return {
    x1: A.x + ux * pad, y1: A.y + uy * pad,
    x2: B.x - ux * pad, y2: B.y - uy * pad,
    len: d - 2 * pad,
  };
};

// 三角形の重心
const CENTROID = {
  x: TRI_POS.reduce((s, p) => s + p.x, 0) / 3,
  y: TRI_POS.reduce((s, p) => s + p.y, 0) / 3,
};

// ── TriNode ───────────────────────────────────────────────────────────────────
const TriNode = ({ item, idx, pal, frame, fps, exitStart }) => {
  const pos = TRI_POS[idx];
  const tf  = item.triggerFrame ?? 0;
  const D   = BADGE_R * 2;

  // 登場: scale 0→1 + fade
  const enSp = spring({ frame: frame - tf, fps, config: { damping: 11, stiffness: 60 } });
  const enSc = interpolate(enSp, [0, 1], [0, 1], clamp);
  const enOp = interpolate(enSp, [0, 1], [0, 1], clamp);

  // アイコン回転登場 (10f遅延)
  const icSp  = spring({ frame: frame - (tf + 10), fps, config: { damping: 13, stiffness: 100 } });
  const icRot = interpolate(icSp, [0, 1], [-120, 0], clamp);
  const icOp  = interpolate(icSp, [0, 1], [0, 1],    clamp);

  // テキスト登場 (15f遅延)
  const txSp = spring({ frame: frame - (tf + 15), fps, config: { damping: 14, stiffness: 120 } });
  const txOp = interpolate(txSp, [0, 1], [0, 1],  clamp);
  const txTy = interpolate(txSp, [0, 1], [22, 0], clamp);

  // 退場 (idx * 6f 時差)
  const exSp = spring({ frame: frame - (exitStart + idx * 6), fps, config: { damping: 20, stiffness: 200 } });
  const exOp = interpolate(exSp, [0, 1], [1, 0],    clamp);
  const exSc = interpolate(exSp, [0, 1], [1, 0.88], clamp);

  // 登場後のゆっくりパルス
  const pulseAge = Math.max(0, frame - tf - 35);
  const pulse    = pulseAge > 0 ? 0.97 + 0.03 * Math.cos(pulseAge * 2 * Math.PI / 50) : 1.0;

  const num = item.number ?? String(idx + 1).padStart(2, '0');

  return (
    <div style={{ position: 'absolute', left: pos.x, top: pos.y, zIndex: 9 }}>

      {/* バッジ円 */}
      <div style={{
        position: 'absolute',
        left: -BADGE_R, top: -BADGE_R,
        width: D, height: D, borderRadius: '50%',
        border: `3px solid ${pal.color}`,
        background: `radial-gradient(circle, rgba(${pal.rgb},.20) 0%, rgba(${pal.rgb},.04) 100%)`,
        boxShadow: `0 0 48px rgba(${pal.rgb},.32), 0 0 96px rgba(${pal.rgb},.12)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 5,
        opacity: enOp * exOp,
        transform: `scale(${(enSc * exSc * pulse).toFixed(4)})`,
      }}>
        <div style={{ opacity: icOp, transform: `rotateZ(${icRot.toFixed(2)}deg)` }}>
          <LucideIcon name={item.icon} color={pal.color} size={50} />
        </div>
        <span style={{
          fontFamily: fontSecondary, fontSize: 22, fontWeight: 700,
          color: pal.color, lineHeight: 1,
        }}>{num}</span>
      </div>

      {/* テキスト（バッジ下）*/}
      <div style={{
        position: 'absolute',
        top: BADGE_R + 22,
        width: 520, left: -260,
        textAlign: 'center',
        opacity: txOp * exOp,
        transform: `translateY(${txTy.toFixed(2)}px)`,
      }}>
        <div style={{
          fontFamily: fontPrimary, fontSize: 56, fontWeight: 700,
          color: COLORS.white, lineHeight: 1.2,
          wordBreak: 'keep-all',
        }}>{item.heading}</div>
        <div style={{
          fontFamily: fontPrimary, fontSize: 28, fontWeight: 400,
          color: COLORS.g50, marginTop: 10, lineHeight: 1.5,
          wordBreak: 'keep-all',
        }}>{item.detail}</div>
      </div>

    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export const KeyPointList = ({
  items                  = [],
  highlightIndex         = null,
  keyMessage             = '',
  bgNumber               = '03',
  sectionLabel           = '',
  slideNum               = 9,
  totalSlides            = 14,
  paperTitle             = '',
  sectionType            = 'sol',
  audioFile              = null,
  conclusionStartFrame   = 0,
  conclusionMainWords    = [],
  conclusionSubText      = '',
  conclusionAudioFile    = null,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: totalDuration } = useVideoConfig();
  const pal = ACCENT_MAP[sectionType] || ACCENT_MAP.sol;

  const hasConcl = conclusionMainWords.length > 0 && conclusionStartFrame > 0;

  const N           = items.length;
  const lastTrigger = N > 0 ? Math.max(...items.map((it) => it.triggerFrame ?? 0)) : 120;
  const lineStart   = lastTrigger + 20;
  const centerStart = lastTrigger + 90;
  const citStart    = lastTrigger + 80;
  const EXIT_START  = hasConcl ? conclusionStartFrame - 20 : totalDuration - 30;

  const fadeOut  = interpolate(frame, [totalDuration - 6, totalDuration], [1, 0], clamp);
  const headerOp = interpolate(frame, [2, 14], [0, 1], clamp);
  const glowOp   = interpolate(frame, [10, 45], [0, 1], clamp);

  // 背景装飾数字
  const bgSp    = spring({ frame: frame - 5, fps, config: { damping: 18, stiffness: 55 } });
  const bgScale = interpolate(bgSp, [0, 1], [0.8, 1.0], clamp);
  const bgOp    = interpolate(bgSp, [0, 1], [0, 0.04], clamp);

  // ライン退場
  const lineExOp = interpolate(frame, [EXIT_START, EXIT_START + 20], [1, 0], clamp);

  // 中央メッセージ
  const cSp  = spring({ frame: frame - centerStart, fps, config: { damping: 15, stiffness: 110 } });
  const cOp  = interpolate(cSp, [0, 1], [0, 1],    clamp);
  const cSc  = interpolate(cSp, [0, 1], [0.82, 1], clamp);
  const cExOp = interpolate(frame, [EXIT_START, EXIT_START + 18], [1, 0], clamp);

  // 出典
  const citSp  = spring({ frame: frame - citStart, fps, config: { damping: 18, stiffness: 100 } });
  const citOp  = interpolate(citSp, [0, 1], [0, 1],   clamp);
  const citY   = interpolate(citSp, [0, 1], [14, 0],  clamp);
  const citEOp = interpolate(frame, [EXIT_START + 8, EXIT_START + 24], [1, 0], clamp);

  const isTriangle = N === 3;
  const isList     = N > 3;

  return (
    <AbsoluteFill style={{ background: COLORS.bg, overflow: 'hidden', opacity: fadeOut }}>

      {audioFile && <Audio src={staticFile(audioFile)} />}
      {conclusionAudioFile && (
        <Sequence from={conclusionStartFrame}>
          <Audio src={staticFile(conclusionAudioFile)} />
        </Sequence>
      )}

      {/* ── 背景斜線 ─────────────────────────────────────────────────────── */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        {Array.from({ length: 50 }, (_, i) => (
          <line key={i}
            x1={-1080 + i * 60} y1={0} x2={-1080 + i * 60 + 1080} y2={1080}
            stroke="rgba(255,255,255,0.025)" strokeWidth="1"
          />
        ))}
      </svg>

      {/* ── 背景装飾数字 ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', right: 30, top: 40,
        fontFamily: fontSecondary, fontSize: 280, fontWeight: 900,
        color: COLORS.white, lineHeight: 1,
        opacity: bgOp, transform: `rotate(-5deg) scale(${bgScale.toFixed(4)})`,
        transformOrigin: 'top right', pointerEvents: 'none', zIndex: 2, userSelect: 'none',
      }}>{bgNumber}</div>

      {/* ── ラジアルグロー ────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        left: `${((isList ? 960 : CENTROID.x) / 1920 * 100).toFixed(1)}%`,
        top:  `${((isList ? 540  : CENTROID.y) / 1080 * 100).toFixed(1)}%`,
        width: '80%', height: '80%',
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(ellipse, rgba(${pal.rgb},.08) 0%, transparent 65%)`,
        opacity: glowOp, pointerEvents: 'none', zIndex: 1,
      }} />

      {/* ── リストレイアウト (N>3) ──────────────────────────────────────── */}
      {isList && (
        <div style={{
          position: 'absolute',
          top: 160, left: 120, right: 120,
          zIndex: 8,
          display: 'flex', flexDirection: 'column', gap: 22,
        }}>
          {items.map((item, i) => {
            const tf  = item.triggerFrame ?? item.frameOffset ?? 0;
            const sp  = spring({ frame: frame - tf, fps, config: { damping: 14, stiffness: 100 } });
            const op  = interpolate(sp, [0, 1], [0, 1], clamp);
            const tx  = interpolate(sp, [0, 1], [-56, 0], clamp);
            const exOp = interpolate(frame, [EXIT_START - i * 3, EXIT_START + 10 - i * 3], [1, 0], clamp);
            const sym = item.number ?? item.icon ?? String(i + 1);
            const label = item.heading ?? item.text ?? '';

            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 36,
                opacity: op * exOp,
                transform: `translateX(${tx.toFixed(2)}px)`,
              }}>
                <div style={{
                  fontFamily: fontSecondary, fontSize: 52, fontWeight: 900,
                  color: pal.color, minWidth: 72, textAlign: 'center', lineHeight: 1,
                  textShadow: `0 0 24px ${pal.glow}`,
                  flexShrink: 0,
                }}>{sym}</div>
                <div style={{
                  width: 2, height: 48, background: pal.color,
                  opacity: 0.35, borderRadius: 2, flexShrink: 0,
                }} />
                <div style={{
                  fontFamily: fontPrimary, fontSize: 40, fontWeight: 600,
                  color: COLORS.white, lineHeight: 1.3, wordBreak: 'keep-all',
                }}>{label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 三角コネクターライン (N=3) ──────────────────────────────────── */}
      {isTriangle && (
        <svg width="1920" height="1080" viewBox="0 0 1920 1080"
          style={{ position: 'absolute', inset: 0, zIndex: 7, pointerEvents: 'none', opacity: lineExOp }}>
          <defs>
            {/* 両端の小さな丸マーカー */}
            <marker id="dot" markerWidth="6" markerHeight="6" refX="3" refY="3">
              <circle cx="3" cy="3" r="2" fill={pal.color} fillOpacity="0.55" />
            </marker>
          </defs>
          {TRI_LINES.map(([i, j], li) => {
            const { x1, y1, x2, y2, len } = triLineEP(i, j);
            const trig = lineStart + li * 15;
            const p    = interpolate(frame, [trig, trig + 30], [0, 1], bezierEase);
            const dl   = len + 4;
            return (
              <line key={li}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={pal.color} strokeWidth={1.8} strokeOpacity={0.38}
                strokeDasharray={`${dl.toFixed(0)}`}
                strokeDashoffset={`${(dl * (1 - p)).toFixed(2)}`}
                markerEnd="url(#dot)" markerStart="url(#dot)"
              />
            );
          })}
        </svg>
      )}

      {/* ── 三角ノード ──────────────────────────────────────────────────── */}
      {isTriangle && items.map((item, i) => (
        <TriNode key={i} item={item} idx={i} pal={pal} frame={frame} fps={fps} exitStart={EXIT_START} />
      ))}

      {/* ── 中央メッセージ（三角の重心） ────────────────────────────────── */}
      {isTriangle && keyMessage && (
        <div style={{
          position: 'absolute',
          left: CENTROID.x, top: CENTROID.y,
          transform: `translate(-50%, -50%) scale(${cSc.toFixed(4)})`,
          opacity: cOp * cExOp,
          zIndex: 15, textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            display: 'inline-block',
            background: `rgba(${pal.rgb}, 0.11)`,
            border: `1.5px solid rgba(${pal.rgb}, 0.40)`,
            borderRadius: 10,
            padding: '14px 36px',
            backdropFilter: 'blur(2px)',
          }}>
            <div style={{
              fontFamily: fontPrimary, fontSize: 34, fontWeight: 600,
              color: pal.color, letterSpacing: '.04em', lineHeight: 1.3,
            }}>{keyMessage}</div>
          </div>
        </div>
      )}

      {/* ── ヘッダー + セクションラベル ─────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        padding: '48px 86px',
        zIndex: 10, pointerEvents: 'none',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 16, opacity: headerOp,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: pal.color, boxShadow: `0 0 8px ${pal.glow}` }} />
            <span style={{ fontFamily: fontPrimary, fontSize: 18, fontWeight: 700, letterSpacing: '.14em', color: COLORS.g50 }}>
              {BRAND_NAME}
            </span>
          </div>
          <span style={{ fontFamily: fontPrimary, fontSize: 18, fontWeight: 700, letterSpacing: '.08em', color: COLORS.g30 }}>
            {String(slideNum).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          opacity: headerOp,
        }}>
          <div style={{ width: 18, height: 3, background: pal.color, borderRadius: 2 }} />
          <span style={{ fontFamily: fontPrimary, fontSize: 40, fontWeight: 700, letterSpacing: '.08em', color: pal.color }}>
            {sectionLabel}
          </span>
        </div>
      </div>

      {/* ── 出典 (右下) ──────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 52, right: 86,
        zIndex: 20, pointerEvents: 'none',
        opacity: citOp * citEOp,
        transform: `translateY(${citY.toFixed(2)}px)`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 24, height: 1, background: pal.color, opacity: 0.45, borderRadius: 1 }} />
        <span style={{
          fontFamily: fontPrimary, fontSize: 22, fontWeight: 300,
          color: COLORS.g30, letterSpacing: '.06em', fontStyle: 'italic',
        }}>{paperTitle}</span>
      </div>

      {/* ── 結論フェーズ（ノード退場後に同画面でフェードイン） ─────────── */}
      {hasConcl && (() => {
        const breathOfs = frame > conclusionStartFrame + 60
          ? Math.sin((frame - conclusionStartFrame) * 0.04) * 2.5 : 0;
        const glowReveal = interpolate(frame,
          [conclusionStartFrame, conclusionStartFrame + 40], [0, 1], clamp);
        const lineP = interpolate(frame,
          [conclusionStartFrame + 48, conclusionStartFrame + 68], [0, 1], bezierEase);
        const subSp = spring({
          frame: frame - (conclusionStartFrame + 72), fps,
          config: { damping: 15, stiffness: 78 },
        });
        const subOp = interpolate(subSp, [0, 1], [0, 1], clamp);
        const subTy = interpolate(subSp, [0, 1], [20, 0], clamp);

        return (
          <>
            {/* 拡大グロー */}
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%', height: '70%',
              background: `radial-gradient(ellipse, rgba(${pal.rgb},.09) 0%, transparent 65%)`,
              opacity: glowReveal, pointerEvents: 'none', zIndex: 18,
            }} />

            {/* 結論テキストブロック */}
            <div style={{
              position: 'absolute', left: 0, right: 0, top: '50%',
              transform: `translateY(calc(-50% + ${breathOfs.toFixed(2)}px))`,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              paddingTop: 20, zIndex: 20, pointerEvents: 'none',
            }}>
              {/* メインワード */}
              <div style={{
                fontFamily: fontPrimary, fontSize: 82, fontWeight: 900,
                lineHeight: 1.35, textAlign: 'center',
                maxWidth: 1360, padding: '0 80px',
                wordBreak: 'keep-all', lineBreak: 'strict',
              }}>
                {(() => {
                  const wordItems = conclusionMainWords.filter(w => !w.isBreak);
                  const totalWords = wordItems.length;
                  let wordIdx = 0;
                  return conclusionMainWords.map((w, i) => {
                    if (w.isBreak) return <br key={`br-${i}`} />;
                    const wi  = wordIdx++;
                    const tf  = conclusionStartFrame + (w.frameOffset ?? wi * 18);
                    const sp  = spring({ frame: frame - tf, fps,
                      config: { damping: 13, stiffness: 110 } });
                    const op  = interpolate(sp, [0, 1], [0, 1], clamp);
                    const ty  = interpolate(sp, [0, 1], [28, 0], clamp);
                    const bl  = interpolate(sp, [0, 1], [6, 0],  clamp);
                    // 中心収束: 前半は左から、後半は右から集まる
                    const txDir = wi < totalWords / 2 ? -1 : 1;
                    const tx = interpolate(sp, [0, 1], [txDir * 90, 0], clamp);
                    return (
                      <span key={i} style={{
                        display: 'inline-block',
                        opacity: op,
                        transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`,
                        filter: `blur(${bl.toFixed(2)}px)`,
                        color: w.isKey ? pal.color : COLORS.white,
                        textShadow: w.isKey ? `0 0 28px ${pal.glow}` : 'none',
                      }}>{w.text}</span>
                    );
                  });
                })()}
              </div>

              {/* 装飾ライン */}
              <div style={{
                width: `${(lineP * 280).toFixed(1)}px`, height: 1.5,
                background: `linear-gradient(90deg, transparent, ${pal.color}, transparent)`,
                opacity: 0.48, marginTop: 32, marginBottom: 32,
              }} />

              {/* サブテキスト */}
              {conclusionSubText && (
                <div style={{
                  fontFamily: fontPrimary, fontSize: 36, fontWeight: 400,
                  color: COLORS.g50, textAlign: 'center',
                  opacity: subOp, transform: `translateY(${subTy.toFixed(2)}px)`,
                  maxWidth: 1100, lineHeight: 1.6,
                  wordBreak: 'keep-all',
                }}>
                  {conclusionSubText}
                </div>
              )}
            </div>
          </>
        );
      })()}

    </AbsoluteFill>
  );
};

KeyPointList.defaultProps = {
  items: [
    { number: '01', icon: 'Activity', heading: 'ランニングフォーム', detail: '接地位置と振動の最適化', triggerFrame: 60  },
    { number: '02', icon: 'Battery',  heading: '生体エネルギー効率', detail: 'ATP合成系の鍛錬',       triggerFrame: 100 },
    { number: '03', icon: 'Zap',      heading: '腱バネ機構',         detail: '弾性エネルギーの活用',   triggerFrame: 140 },
  ],
  highlightIndex: null,
  keyMessage:   '3要素は独立に鍛えられる',
  bgNumber:     '03',
  sectionLabel: 'ランニングエコノミーを決める3要素',
  slideNum:     9,
  totalSlides:  14,
  paperTitle:   'Saunders et al., 2004',
  sectionType:  'sol',
  audioFile:    null,
};
