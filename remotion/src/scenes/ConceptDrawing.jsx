import {
  useCurrentFrame, useVideoConfig, spring, interpolate, Easing,
  AbsoluteFill, Audio, staticFile,
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

// ── レイアウト定数 ─────────────────────────────────────────────────────────────
const NODE_R   = 122;
const NODE_CY  = 490;
const CIRC     = 2 * Math.PI * NODE_R;
const ARROW_GAP = 14;
const sumLineY = NODE_CY + NODE_R + 110; // lower summary line

const nodeXs = (() => {
  const flowW = 1920 * 0.88;
  const left  = (1920 - flowW) / 2;
  const slot  = flowW / 4;
  return [0,1,2,3].map(i => Math.round(left + slot * i + slot / 2));
})();

const arrowCoords = [0,1,2].map(i => ({
  x1: nodeXs[i]     + NODE_R + ARROW_GAP,
  x2: nodeXs[i + 1] - NODE_R - ARROW_GAP,
  y:  NODE_CY,
}));

function wavePath(x1, x2, y) {
  const len = x2 - x1;
  const amp = 22;
  return `M ${x1} ${y} C ${x1 + len*0.33} ${y - amp}, ${x1 + len*0.67} ${y + amp}, ${x2} ${y}`;
}

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const bezierEase = { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) };

// ── Header ────────────────────────────────────────────────────────────────────
const Header = ({ slideNum, totalSlides, pal }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 12], [0, 1], clamp);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, opacity: op }}>
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
  );
};

// ── SectionLabel ──────────────────────────────────────────────────────────────
const SectionLabel = ({ children, pal }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [2, 16], [0, 1], clamp);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, opacity: op }}>
      <div style={{ width: 18, height: 3, background: pal.color, borderRadius: 2 }} />
      <span style={{ fontFamily: fontPrimary, fontSize: 40, fontWeight: 700, letterSpacing: '.08em', color: pal.color }}>
        {children}
      </span>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const ConceptDrawing = ({
  nodes        = [],
  keyMechanism = '',
  sectionLabel = '',
  slideNum     = 4,
  totalSlides  = 14,
  paperTitle   = '',
  sectionType  = 'prob',
  audioFile    = null,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pal = ACCENT_MAP[sectionType] || ACCENT_MAP.prob;

  const N = nodes.length;
  const lastTrigger = N > 0 ? Math.max(...nodes.map(n => n.triggerFrame ?? 0)) : 210;
  const summaryTrigger = lastTrigger + 30;
  const citTrigger = summaryTrigger + 30;

  const sumLineLeft  = N > 0 ? nodeXs[0] - NODE_R : 0;
  const sumLineRight = N > 0 ? nodeXs[N - 1] + NODE_R : 0;

  // ① 背景グリッドアニメーション ─────────────────────────────────────────────
  const hLineCount = Math.ceil(1080 / 80);
  const vLineCount = Math.ceil(1920 / 80);

  // ノードごとの「注目スケール」: 自ノード登場〜次ノード登場までの間だけ大きい
  const nodeFocusScales = nodes.map((nd, i) => {
    const tf     = nd.triggerFrame ?? 0;
    const nextTf = nodes[i + 1]?.triggerFrame ?? (lastTrigger + 999);
    const inSp  = spring({ frame: frame - tf,     fps, config: { damping: 14, stiffness: 140 } });
    const outSp = spring({ frame: frame - nextTf, fps, config: { damping: 14, stiffness: 140 } });
    const focus = Math.max(0, Math.min(1, inSp) - Math.max(0, outSp));
    return 1.0 + focus * 0.16; // 最大 1.16倍
  });

  // ⑧ 最終ノード強調オーバーレイ ───────────────────────────────────────────────
  const finalTf = N > 0 ? nodes[N - 1].triggerFrame : 210;
  const emphRaw = spring({ frame: frame - (finalTf + 5), fps, config: { damping: 12, stiffness: 180 } });
  const emphBg = Math.max(0, Math.sin(Math.min(1, emphRaw) * Math.PI) * 0.08);

  // ⑨ サマリーライン ──────────────────────────────────────────────────────────
  const summaryLineP = interpolate(frame, [summaryTrigger, summaryTrigger + 22], [0, 1], bezierEase);

  // ⑩ 出典 spring ─────────────────────────────────────────────────────────────
  const citSp = spring({ frame: frame - citTrigger, fps, config: { damping: 18, stiffness: 100 } });
  const citOp = interpolate(citSp, [0, 1], [0, 1], clamp);
  const citY  = interpolate(citSp, [0, 1], [16, 0], clamp);

  // サマリーテキスト spring
  const sumTextSp = spring({ frame: frame - (summaryTrigger + 18), fps, config: { damping: 14, stiffness: 180 } });
  const sumTextOp = interpolate(sumTextSp, [0, 1], [0, 1], clamp);
  const sumTextY  = interpolate(sumTextSp, [0, 1], [14, 0], clamp);

  return (
    <AbsoluteFill style={{ background: COLORS.bg, overflow: 'hidden' }}>

      {audioFile && <Audio src={staticFile(audioFile)} />}

      {/* ① 背景グリッドSVG */}
      <svg
        width="1920" height="1080"
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      >
        {/* 水平線 */}
        {Array.from({ length: hLineCount }, (_, i) => {
          const startF = i * 0.5;
          const w = interpolate(frame, [startF, startF + 16], [0, 100], clamp);
          const y = i * 80;
          return (
            <line
              key={`h${i}`}
              x1={0} y1={y} x2={`${w}%`} y2={y}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1"
            />
          );
        })}
        {/* 垂直線 */}
        {Array.from({ length: vLineCount }, (_, i) => {
          const startF = i * 0.4;
          const h = interpolate(frame, [startF, startF + 16], [0, 100], clamp);
          const x = i * 80;
          return (
            <line
              key={`v${i}`}
              x1={x} y1={0} x2={x} y2={`${h}%`}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1"
            />
          );
        })}
      </svg>

      {/* ⑧ 最終ノード強調オーバーレイ */}
      {emphBg > 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `rgba(${pal.rgb}, ${emphBg})`,
          pointerEvents: 'none',
          zIndex: 2,
        }} />
      )}

      {/* ラジアルグロー装飾 */}
      <div style={{
        position: 'absolute',
        width: '80%', height: '60%',
        background: `radial-gradient(ellipse, rgba(${pal.rgb},.06) 0%, transparent 70%)`,
        top: '20%', left: '10%',
        pointerEvents: 'none',
        zIndex: 2,
      }} />

      {/* メインSVG — 円・矢印・サマリーライン */}
      <svg
        width="1920" height="1080"
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0, zIndex: 5 }}
      >
        <defs>
          <filter id="cdGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ③ ノード円 */}
        {nodes.map((node, i) => {
          const tf = node.triggerFrame ?? 0;
          const cx = nodeXs[i];

          const drawP = interpolate(frame, [tf, tf + 30], [0, 1], bezierEase);
          const dashOffset = CIRC * (1 - drawP);

          // フラッシュ
          const flashP = interpolate(frame, [tf + 28, tf + 33, tf + 38], [0, 1, 0], clamp);
          const strokeColor = flashP > 0
            ? `rgba(255,255,255,${(0.55 + flashP * 0.45).toFixed(3)})`
            : pal.color;

          // 進捗ドット
          const dotAngle = -Math.PI / 2 + drawP * 2 * Math.PI;
          const dotX = cx + NODE_R * Math.cos(dotAngle);
          const dotY = NODE_CY + NODE_R * Math.sin(dotAngle);
          const dotOp = interpolate(frame, [tf, tf + 26, tf + 32], [0, 1, 0], clamp);

          // ⑦ 完成後の脈動
          const pulse = drawP >= 1
            ? Math.sin(frame * 0.05 + i * 1.4) * 0.015 + 1.0
            : 1.0;

          const totalScale = nodeFocusScales[i] * pulse;

          return (
            <g key={i}>
              {/* 注目スケール + 脈動グループ */}
              <g transform={`translate(${cx},${NODE_CY}) scale(${totalScale}) translate(${-cx},${-NODE_CY})`}>
                {/* トラック（薄い背景円） */}
                <circle
                  cx={cx} cy={NODE_CY} r={NODE_R}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="3"
                />
                {/* 完成後の内側フィル */}
                {drawP >= 1 && (
                  <circle
                    cx={cx} cy={NODE_CY} r={NODE_R}
                    fill={`rgba(${pal.rgb}, 0.07)`}
                  />
                )}
                {/* 円弧アニメーション */}
                <circle
                  cx={cx} cy={NODE_CY} r={NODE_R}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${CIRC.toFixed(2)} ${CIRC.toFixed(2)}`}
                  strokeDashoffset={dashOffset.toFixed(3)}
                  transform={`rotate(-90 ${cx} ${NODE_CY})`}
                  style={{ filter: `drop-shadow(0 0 6px ${pal.glow})` }}
                />
              </g>
              {/* 進捗ドット */}
              {dotOp > 0.01 && (
                <circle
                  cx={dotX.toFixed(2)} cy={dotY.toFixed(2)} r="7"
                  fill={pal.color}
                  opacity={dotOp.toFixed(3)}
                  style={{ filter: `drop-shadow(0 0 8px ${pal.color}) drop-shadow(0 0 16px ${pal.glow})` }}
                />
              )}
            </g>
          );
        })}

        {/* ⑥ 矢印（ウェーブベジェ + 矢印頭） */}
        {arrowCoords.map((ac, i) => {
          if (i + 1 >= nodes.length) return null;
          const arrowStart = nodes[i + 1].triggerFrame - 10;
          const drawP = interpolate(frame, [arrowStart, arrowStart + 15], [0, 1], bezierEase);
          const pathLen = (ac.x2 - ac.x1) * 1.06;

          // 矢印頭 spring（ポップ）
          const headSp = spring({ frame: frame - (arrowStart + 14), fps, config: { damping: 12, stiffness: 400 } });
          const headScale = Math.max(0, headSp);

          const { x1, x2, y } = ac;

          return (
            <g key={i}>
              {/* ▶ のみ (中央に配置) */}
              {headScale > 0.01 && (() => {
                const mx = (x1 + x2) / 2;
                return (
                  <polygon
                    points={`${mx - 14},${y - 12} ${mx - 14},${y + 12} ${mx + 14},${y}`}
                    fill={pal.color}
                    opacity={Math.min(1, headScale)}
                    style={{ filter: `drop-shadow(0 0 8px ${pal.glow})` }}
                  />
                );
              })()}
            </g>
          );
        })}

        {/* ⑨ サマリーセパレーターライン */}
        {N > 0 && (
          <line
            x1={sumLineLeft}
            y1={sumLineY}
            x2={sumLineLeft + (sumLineRight - sumLineLeft) * summaryLineP}
            y2={sumLineY}
            stroke={pal.color}
            strokeWidth="1.5"
            opacity="0.4"
          />
        )}
      </svg>

      {/* ② ステップ番号（大きく薄い・背景装飾） */}
      {nodes.map((node, i) => {
        const tf = node.triggerFrame ?? 0;
        const op = interpolate(frame, [tf - 20, tf + 5], [0, 0.12], clamp);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: nodeXs[i],
              top: NODE_CY - NODE_R - 95,
              transform: 'translateX(-50%)',
              fontFamily: fontSecondary,
              fontSize: 88,
              fontWeight: 900,
              color: pal.color,
              opacity: op,
              zIndex: 4,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {node.stepNum}
          </div>
        );
      })}

      {/* ④ 円内テキスト */}
      {nodes.map((node, i) => {
        const tf = node.triggerFrame ?? 0;
        const lines = node.lines ?? [];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: nodeXs[i] - NODE_R,
              top: NODE_CY - NODE_R,
              width: NODE_R * 2,
              height: NODE_R * 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              zIndex: 6,
              pointerEvents: 'none',
              transform: `scale(${nodeFocusScales[i]})`,
              transformOrigin: 'center center',
            }}
          >
            {lines.map((line, li) => {
              const lineStart = tf + 33 + li * 5;
              const sp = spring({ frame: frame - lineStart, fps, config: { damping: 14, stiffness: 220 } });
              const lineOp = interpolate(sp, [0, 1], [0, 1], clamp);
              const lineY  = interpolate(sp, [0, 1], [12, 0], clamp);
              return (
                <div
                  key={li}
                  style={{
                    fontFamily: fontPrimary,
                    fontSize: 40,
                    fontWeight: 900,
                    color: COLORS.white,
                    whiteSpace: 'nowrap',
                    opacity: lineOp,
                    transform: `translateY(${lineY}px)`,
                    wordBreak: 'keep-all',
                    lineBreak: 'strict',
                  }}
                >
                  {line}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* ⑤ サブタイトル（円の下） */}
      {nodes.map((node, i) => {
        const tf = node.triggerFrame ?? 0;
        const lines = node.lines ?? [];
        const subStart = tf + 33 + lines.length * 5 + 5;
        const sp = spring({ frame: frame - subStart, fps, config: { damping: 14, stiffness: 180 } });
        const subOp = interpolate(sp, [0, 1], [0, 1], clamp);
        const subY  = interpolate(sp, [0, 1], [10, 0], clamp);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: nodeXs[i],
              top: NODE_CY + NODE_R + 20,
              transform: `translate(-50%, ${subY}px)`,
              fontFamily: fontPrimary,
              fontSize: 34,
              fontWeight: 400,
              color: COLORS.g50,
              whiteSpace: 'nowrap',
              opacity: subOp,
              zIndex: 6,
              pointerEvents: 'none',
              wordBreak: 'keep-all',
              lineBreak: 'strict',
            }}
          >
            {node.subtitle}
          </div>
        );
      })}

      {/* ⑨ キーメカニズム */}
      {N > 0 && (
        <div
          style={{
            position: 'absolute',
            left: sumLineLeft,
            top: sumLineY + 28,
            right: 86,
            zIndex: 7,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              opacity: sumTextOp,
              transform: `translateY(${sumTextY}px)`,
              fontFamily: fontPrimary,
              fontSize: 38,
              fontWeight: 500,
              color: COLORS.g70,
              wordBreak: 'keep-all',
              lineBreak: 'strict',
            }}
          >
            <span style={{ fontWeight: 700, color: pal.color }}>キーメカニズム: </span>
            {keyMechanism}
          </div>
        </div>
      )}

      {/* ⑩ 出典（右下） */}
      <div style={{
        position: 'absolute',
        bottom: 52,
        right: 86,
        zIndex: 20,
        pointerEvents: 'none',
        opacity: citOp,
        transform: `translateY(${citY}px)`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{ width: 24, height: 1, background: pal.color, opacity: 0.5, borderRadius: 1 }} />
        <span style={{
          fontFamily: fontPrimary,
          fontSize: 22,
          fontWeight: 300,
          fontStyle: 'italic',
          color: COLORS.g30,
          letterSpacing: '.06em',
        }}>
          {paperTitle}
        </span>
      </div>

      {/* ヘッダー＋セクションラベル シェル */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '48px 86px',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <Header slideNum={slideNum} totalSlides={totalSlides} pal={pal} />
        <SectionLabel pal={pal}>{sectionLabel}</SectionLabel>
      </div>


    </AbsoluteFill>
  );
};

ConceptDrawing.defaultProps = {
  nodes: [
    { stepNum: '01', lines: ['足首で', '強く蹴る'],    subtitle: '底屈主導の推進',    triggerFrame: 60  },
    { stepNum: '02', lines: ['反復負荷', 'ふくらはぎ'], subtitle: '機械的張力が蓄積',  triggerFrame: 110 },
    { stepNum: '03', lines: ['末端が', '重くなる', '筋肥大'], subtitle: '慣性モーメント増', triggerFrame: 160 },
    { stepNum: '04', lines: ['さらに', '強く蹴る', '必要'], subtitle: '悪循環が止まらない', triggerFrame: 210 },
  ],
  keyMechanism: '末端質量増加が代謝負荷を増幅',
  sectionLabel: '蹴り動作が生む 負の連鎖',
  slideNum:     4,
  totalSlides:  14,
  paperTitle:   '蹴り動作研究, 2022',
  sectionType:  'prob',
  audioFile:    null,
};
