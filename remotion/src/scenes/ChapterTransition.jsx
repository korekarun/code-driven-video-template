import {
  useCurrentFrame, useVideoConfig, spring, interpolate, Easing,
  AbsoluteFill, Audio, staticFile,
} from 'remotion';
import { COLORS } from '../theme.js';
import { fontPrimary, fontSecondary } from '../fonts.js';

// ── パレット ──────────────────────────────────────────────────────────────────
const ACCENT_MAP = {
  prob: { color: '#ff6b6b', glow: 'rgba(255,107,107,.5)', rgb: '255,107,107' },
  data: { color: '#4dabf7', glow: 'rgba(77,171,247,.5)',  rgb: '77,171,247'  },
  sol:  { color: '#69db7c', glow: 'rgba(105,219,124,.5)', rgb: '105,219,124' },
};
const clamp      = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const bezierEase = { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) };

// ── タイミング ────────────────────────────────────────────────────────────────
// Phase 1: 前章の終わり (0-60)
const P1_ENTER    = 5;    // 前章ラベル登場
const P1_FADE     = 28;   // フェードアウト開始
const P1_END      = 60;   // Phase 1 終了

// Phase 2: 切替演出 (60-148)
const P2_BIGNUM   = 58;   // 巨大数字フェードイン
const P2_FLIP_A   = 62;   // "01" rotateX 0→-90 (15f)
const P2_FLIP_B   = 84;   // "02" rotateX 90→0  (15f, 7f gap)
const P2_LINE_ST  = 100;  // 水平線 中央から両端へ (28f)
const P2_LINE_END = 128;
const P2_MARKER   = 108;  // マーカー進行 (14f)

// Phase 3: 次章の始まり (148-)
const P3_START    = 148;
const P3_TITLE    = 152;  // 新章ラベル + タイトル
const P3_LINE     = 204;  // 装飾ライン
const P3_PRV_HDR  = 216;  // プレビューヘッダー
const P3_PRV_0    = 228;  // 最初のプレビュー項目
const P3_PRV_GAP  = 13;   // 項目間隔 (f)

const EXIT_ST     = 326;
const TOTAL       = 360;

// ── 粒子 seed (上方向浮遊) ────────────────────────────────────────────────────
const PTCL = Array.from({ length: 30 }, (_, i) => ({
  s1: ((i * 2654435761) % 997) / 997,
  s2: ((i * 1234567891) % 991) / 991,
}));

// ── 章マーカー (横一列ドット) ─────────────────────────────────────────────────
const ChapterMarkers = ({ total, fromIdx, toIdx, frame, fps, pal, uiOp }) => {
  const spread  = Math.min(560, total * 90);
  const startX  = 960 - spread / 2;
  const spacing = total > 1 ? spread / (total - 1) : 0;

  // fromIdx → toIdx への進行アニメ
  const markerProg = interpolate(frame, [P2_MARKER, P2_MARKER + 14], [0, 1], bezierEase);

  return (
    <svg
      width="1920" height="60"
      style={{ position: 'absolute', bottom: 40, left: 0, pointerEvents: 'none', opacity: uiOp }}
    >
      {/* グレートラック */}
      <line
        x1={startX} y1={30} x2={startX + spread} y2={30}
        stroke="rgba(255,255,255,0.12)" strokeWidth={1.5}
      />
      {/* 着色済みトラック */}
      {fromIdx >= 0 && (
        <line
          x1={startX} y1={30}
          x2={startX + spacing * (fromIdx + markerProg)}
          y2={30}
          stroke={pal.color} strokeWidth={1.5} strokeOpacity={0.45}
        />
      )}
      {/* 各マーカー */}
      {Array.from({ length: total }, (_, i) => {
        const cx       = total > 1 ? startX + i * spacing : 960;
        const isPast   = i < fromIdx || (i === fromIdx && markerProg > 0.97);
        const isFrom   = i === fromIdx && markerProg < 0.5;
        const isTo     = i === toIdx;
        const toActive = isTo && markerProg > 0.45;
        const r        = (isFrom || toActive) ? 10 : 7;
        const fillCol  = isPast ? pal.color : toActive ? pal.color : isFrom ? pal.color : 'none';
        const strCol   = (isPast || isFrom || isTo) ? pal.color : 'rgba(255,255,255,0.22)';
        const pulse    = (isFrom || toActive) ? 1 + Math.sin(frame * 0.08) * 0.12 : 1;

        return (
          <g key={i}>
            {(isFrom || toActive) && (
              <circle cx={cx} cy={30} r={(r + 8) * pulse} fill={pal.color} fillOpacity={0.06} />
            )}
            <circle
              cx={cx} cy={30} r={r}
              fill={fillCol} stroke={strCol} strokeWidth={1.5}
              style={(isFrom || toActive) ? { filter: `drop-shadow(0 0 5px ${pal.glow})` } : undefined}
            />
            {isPast && (
              <polyline
                points={`${cx - 4},${30} ${cx - 1},${33} ${cx + 5},${25}`}
                fill="none" stroke="white" strokeWidth={1.8}
                strokeLinecap="round" strokeLinejoin="round"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ── プレビュー項目 ────────────────────────────────────────────────────────────
const PreviewItem = ({ text, triggerFrame, pal, frame, fps, exitOp }) => {
  const sp = spring({ frame: frame - triggerFrame, fps, config: { damping: 14, stiffness: 110 } });
  const op = interpolate(sp, [0, 1], [0, 1], clamp);
  const ty = interpolate(sp, [0, 1], [14, 0], clamp);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 18,
      opacity: op * exitOp,
      transform: `translateY(${ty.toFixed(2)}px)`,
    }}>
      <div style={{
        width: 11, height: 11, borderRadius: '50%', flexShrink: 0,
        background: pal.color, boxShadow: `0 0 10px ${pal.glow}`,
      }} />
      <span style={{
        fontFamily: fontPrimary, fontSize: 38, fontWeight: 400,
        color: COLORS.g70, wordBreak: 'keep-all', lineBreak: 'strict',
      }}>
        {text}
      </span>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const ChapterTransition = ({
  fromChapter         = {},
  toChapter           = {},
  totalChapters       = 5,
  currentChapterIndex = 1,   // 0-based, 切替後の章を指す
  sectionType         = 'data',
  audioFile           = null,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pal     = ACCENT_MAP[sectionType] || ACCENT_MAP.data;
  const fromIdx = currentChapterIndex - 1;
  const toIdx   = currentChapterIndex;

  // ── 粒子 (上方向浮遊) ────────────────────────────────────────────────────────
  const ptcls = PTCL.map(({ s1, s2 }) => ({
    x:  s1 * 1960 + Math.sin(frame * 0.018 + s2 * 5) * 22,
    y:  (((s2 * 1100 - frame * (0.22 + s1 * 0.28)) % 1100) + 1100) % 1100,
    op: 0.12 + s1 * 0.16,
    sz: 1.5 + s2 * 2.5,
  }));

  // ── 全体 ─────────────────────────────────────────────────────────────────────
  const overallFade = interpolate(frame, [TOTAL - 6, TOTAL], [1, 0], clamp);
  const glowOp      = interpolate(frame, [10, 50], [0, 1], clamp);
  const uiOp        = interpolate(frame, [EXIT_ST, EXIT_ST + 24], [1, 0], clamp);

  // ── Phase 1: 前章ラベル ───────────────────────────────────────────────────────
  const p1EnterSp = spring({ frame: frame - P1_ENTER, fps, config: { damping: 15, stiffness: 100 } });
  const p1EnterOp = interpolate(p1EnterSp, [0, 1], [0, 1], clamp);
  const p1EnterTy = interpolate(p1EnterSp, [0, 1], [16, 0], clamp);
  const p1FadeOp  = interpolate(frame, [P2_BIGNUM, P2_FLIP_A + 18], [1, 0], clamp);
  const p1Op      = p1EnterOp * p1FadeOp * 0.62; // 0.62 → やや薄く (終わりの感)

  // ── Phase 2: 巨大章番号 ───────────────────────────────────────────────────────
  const bigNumEnterOp = interpolate(frame, [P2_BIGNUM, P2_BIGNUM + 10], [0, 1], clamp);
  const bigNumExitOp  = interpolate(frame, [P3_START, P3_START + 20], [1, 0], clamp);
  const bigNumOp      = bigNumEnterOp * bigNumExitOp;

  // "01" が rotateX 0 → -90 で裏返る
  const flipASp    = spring({ frame: frame - P2_FLIP_A, fps, config: { damping: 18, stiffness: 130 } });
  const flipAAngle = interpolate(flipASp, [0, 1], [0, -90], clamp);
  const showFlipA  = frame < P2_FLIP_A + 20; // 裏返り切ったら非表示

  // "02" が rotateX 90 → 0 で表れる
  const flipBSp    = spring({ frame: frame - P2_FLIP_B, fps, config: { damping: 15, stiffness: 100 } });
  const flipBAngle = interpolate(flipBSp, [0, 1], [90, 0], clamp);
  const flipBBreath = frame >= P2_FLIP_B + 40
    ? Math.sin(frame * 0.04) * 0.005 + 1.0
    : 1.0;

  // ── Phase 2: 水平線 (中央から両端へ) ─────────────────────────────────────────
  const lineHalfW   = interpolate(frame, [P2_LINE_ST, P2_LINE_END], [0, 576], bezierEase);
  const lineFinalOp = interpolate(frame, [P2_LINE_ST, P2_LINE_ST + 6], [0, 1], clamp)
                    * interpolate(frame, [P3_LINE - 4, P3_LINE + 20], [1, 0], clamp);

  // ── Phase 3: 新章タイトル ─────────────────────────────────────────────────────
  const p3TitleSp = spring({ frame: frame - P3_TITLE, fps, config: { damping: 14, stiffness: 100 } });
  const p3TitleOp = interpolate(p3TitleSp, [0, 1], [0, 1], clamp);
  const p3TitleTy = interpolate(p3TitleSp, [0, 1], [20, 0], clamp);
  const p3ExitOp  = interpolate(frame, [EXIT_ST + 6, EXIT_ST + 28], [1, 0], clamp);

  // 装飾ライン
  const p3LineP  = interpolate(frame, [P3_LINE, P3_LINE + 18], [0, 1], bezierEase);
  const p3LineOp = interpolate(frame, [P3_LINE, P3_LINE + 6], [0, 1], clamp)
                 * p3ExitOp;

  // プレビューヘッダー
  const prvHdrSp = spring({ frame: frame - P3_PRV_HDR, fps, config: { damping: 16, stiffness: 110 } });
  const prvHdrOp = interpolate(prvHdrSp, [0, 1], [0, 1], clamp);
  const prvHdrTy = interpolate(prvHdrSp, [0, 1], [12, 0], clamp);

  // Phase 3 背景装飾数字 (薄く呼吸)
  const bgNumOp  = interpolate(frame, [P3_TITLE, P3_TITLE + 30], [0, 1], clamp);
  const bgNumBreath = 1 + Math.sin(frame * 0.04) * 0.005;

  // ── 退場 ─────────────────────────────────────────────────────────────────────
  const exitPrvOp = interpolate(frame, [EXIT_ST, EXIT_ST + 16], [1, 0], clamp);

  const previewItems = toChapter.previewItems ?? [];

  return (
    <AbsoluteFill style={{ background: COLORS.bg, overflow: 'hidden', opacity: overallFade }}>

      {audioFile && <Audio src={staticFile(audioFile)} />}

      {/* ── 粒子 ─────────────────────────────────────────────────────────── */}
      {ptcls.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: p.x, top: p.y,
          width: p.sz, height: p.sz,
          background: pal.color, borderRadius: '50%',
          opacity: p.op, filter: 'blur(1px)', pointerEvents: 'none',
        }} />
      ))}

      {/* ── ラジアルグロー ────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', left: '50%', top: '48%',
        transform: 'translate(-50%, -50%)',
        width: '78%', height: '75%',
        background: `radial-gradient(ellipse, rgba(${pal.rgb},.065) 0%, transparent 65%)`,
        opacity: glowOp, pointerEvents: 'none',
      }} />

      {/* ── Phase 3 背景装飾数字 ─────────────────────────────────────────── */}
      {frame >= P3_TITLE && (
        <div style={{
          position: 'absolute', right: -10, top: 50,
          fontFamily: fontSecondary, fontSize: 480, fontWeight: 900,
          color: `rgba(${pal.rgb}, 0.038)`, lineHeight: 1,
          transform: `scale(${bgNumBreath.toFixed(4)}) rotate(-6deg)`,
          transformOrigin: 'top right',
          opacity: bgNumOp, pointerEvents: 'none', userSelect: 'none', zIndex: 1,
        }}>
          {toChapter.number ?? '02'}
        </div>
      )}

      {/* ── 背景斜線 ─────────────────────────────────────────────────────── */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        {Array.from({ length: 40 }, (_, i) => (
          <line key={i}
            x1={-1080 + i * 64} y1={0} x2={-1080 + i * 64 + 1080} y2={1080}
            stroke="rgba(255,255,255,0.02)" strokeWidth="1"
          />
        ))}
      </svg>

      {/* ══════════════════════════════════
          Phase 1: 前章ラベル + タイトル
      ══════════════════════════════════ */}
      {p1Op > 0.005 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 240,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          opacity: p1Op,
          transform: `translateY(${p1EnterTy.toFixed(2)}px)`,
          pointerEvents: 'none', zIndex: 8,
        }}>
          <div style={{
            fontFamily: fontPrimary, fontSize: 30, fontWeight: 400,
            color: pal.color, letterSpacing: '.22em',
          }}>
            Chapter {fromChapter.number ?? '01'}
          </div>
          <div style={{
            fontFamily: fontPrimary, fontSize: 76, fontWeight: 700,
            color: COLORS.white, letterSpacing: '.04em',
            wordBreak: 'keep-all', lineBreak: 'strict', textAlign: 'center',
            maxWidth: 1100, padding: '0 60px',
          }}>
            {fromChapter.title ?? ''}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          Phase 2: 巨大章番号フリップ
          perspective を固定高コンテナに設定し
          flex で自然センタリング
      ══════════════════════════════════ */}
      {bigNumOp > 0.005 && (
        <div style={{
          position: 'absolute',
          left: 0, right: 0, top: 260, height: 380,
          perspective: '1200px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 6, pointerEvents: 'none',
          opacity: bigNumOp,
        }}>
          {/* "01" — rotateX 0→-90 で裏返る */}
          {showFlipA && (
            <div style={{
              fontFamily: fontSecondary, fontSize: 320, fontWeight: 900,
              color: pal.color, lineHeight: 1,
              textShadow: `0 0 80px rgba(${pal.rgb},.45), 0 0 160px rgba(${pal.rgb},.20)`,
              transform: `rotateX(${flipAAngle.toFixed(2)}deg)`,
              opacity: Math.abs(flipAAngle) > 85 ? 0 : 1,
            }}>
              {fromChapter.number ?? '01'}
            </div>
          )}
          {/* "02" — rotateX 90→0 で表れる */}
          {frame >= P2_FLIP_B && (
            <div style={{
              fontFamily: fontSecondary, fontSize: 320, fontWeight: 900,
              color: pal.color, lineHeight: 1,
              textShadow: `0 0 80px rgba(${pal.rgb},.45), 0 0 160px rgba(${pal.rgb},.20)`,
              transform: `rotateX(${flipBAngle.toFixed(2)}deg) scale(${flipBBreath.toFixed(4)})`,
              opacity: Math.abs(flipBAngle) > 85 ? 0 : 1,
            }}>
              {toChapter.number ?? '02'}
            </div>
          )}
        </div>
      )}

      {/* ── Phase 2: 水平線 (中央から両端へ) ────────────────────────────── */}
      {lineFinalOp > 0.005 && (
        <svg width="1920" height="8"
          style={{ position: 'absolute', top: 668, left: 0, pointerEvents: 'none', zIndex: 7 }}>
          <line x1={960} y1={4} x2={960 + lineHalfW} y2={4}
            stroke={pal.color} strokeWidth={1.5} strokeOpacity={0.4 * lineFinalOp} />
          <line x1={960} y1={4} x2={960 - lineHalfW} y2={4}
            stroke={pal.color} strokeWidth={1.5} strokeOpacity={0.4 * lineFinalOp} />
        </svg>
      )}

      {/* ══════════════════════════════════
          Phase 3: 新章タイトル + プレビュー
      ══════════════════════════════════ */}
      {frame >= P3_TITLE && p3TitleOp > 0.005 && (
        <div style={{
          position: 'absolute', left: 0, right: 0,
          top: 240,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          pointerEvents: 'none', zIndex: 8,
        }}>

          {/* Chapter XX ラベル + タイトル */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            opacity: p3TitleOp * p3ExitOp,
            transform: `translateY(${p3TitleTy.toFixed(2)}px)`,
          }}>
            <div style={{
              fontFamily: fontPrimary, fontSize: 30, fontWeight: 400,
              color: pal.color, letterSpacing: '.22em',
            }}>
              Chapter {toChapter.number ?? '02'}
            </div>
            <div style={{
              fontFamily: fontPrimary, fontSize: 76, fontWeight: 700,
              color: COLORS.white, letterSpacing: '.04em',
              wordBreak: 'keep-all', lineBreak: 'strict',
              textAlign: 'center', maxWidth: 1100, padding: '0 60px',
              textShadow: `0 0 40px rgba(${pal.rgb},.18)`,
            }}>
              {toChapter.title ?? ''}
            </div>
          </div>

          {/* 装飾ライン (中央から両端へ展開) */}
          <div style={{
            marginTop: 40,
            width: `${(p3LineP * 220).toFixed(1)}px`, height: 1.5,
            background: `linear-gradient(90deg, transparent, ${pal.color}, transparent)`,
            opacity: 0.46 * p3LineOp,
            boxShadow: `0 0 6px rgba(${pal.rgb},.35)`,
          }} />

          {/* プレビューセクション */}
          {previewItems.length > 0 && (
            <div style={{
              marginTop: 40,
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              gap: 24, maxWidth: 760,
            }}>
              {/* プレビューヘッダー */}
              {toChapter.previewHeader && (
                <div style={{
                  fontFamily: fontPrimary, fontSize: 30, fontWeight: 400,
                  color: COLORS.g30, letterSpacing: '.14em',
                  opacity: prvHdrOp * p3ExitOp,
                  transform: `translateY(${prvHdrTy.toFixed(2)}px)`,
                  alignSelf: 'center',
                }}>
                  {toChapter.previewHeader}
                </div>
              )}
              {/* 項目リスト */}
              {previewItems.map((item, i) => (
                <PreviewItem
                  key={i}
                  text={item}
                  triggerFrame={P3_PRV_0 + i * P3_PRV_GAP}
                  pal={pal}
                  frame={frame}
                  fps={fps}
                  exitOp={exitPrvOp}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════
          章マーカー (常時表示)
      ══════════════════════════════════ */}
      <ChapterMarkers
        total={totalChapters}
        fromIdx={fromIdx}
        toIdx={toIdx}
        frame={frame}
        fps={fps}
        pal={pal}
        uiOp={uiOp}
      />

    </AbsoluteFill>
  );
};

ChapterTransition.defaultProps = {
  fromChapter: {
    number: '01',
    title:  '問題の発見',
  },
  toChapter: {
    number:        '02',
    title:         '仕組みの解明',
    previewHeader: 'この章で扱う3つのテーマ',
    previewItems: [
      'なぜ起きるのか',
      'どこで起きるのか',
      'どう改善するか',
    ],
  },
  totalChapters:       5,
  currentChapterIndex: 1,
  sectionType:         'data',
  audioFile:           null,
};
