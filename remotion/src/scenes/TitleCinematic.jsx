import {
  useCurrentFrame, useVideoConfig, spring, interpolate,
  AbsoluteFill, Audio, staticFile,
} from 'remotion';
import { fontPrimary, fontSecondary } from '../fonts.js';
import { BRAND_NAME } from '../brand.js';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

const fadeUp = (frame, fps, delay = 0) => {
  const sp = spring({
    frame: frame - delay,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });
  return {
    opacity: interpolate(sp, [0, 1], [0, 1], clamp),
    y:       interpolate(sp, [0, 1], [14, 0], clamp),
  };
};

const cardAnim = (frame, fps, delay) => {
  const sp = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 100, mass: 0.9 },
  });
  return {
    opacity: interpolate(sp, [0, 1], [0, 1], clamp),
    y:       interpolate(sp, [0, 1], [10, 0], clamp),
    scale:   interpolate(sp, [0, 1], [0.96, 1], clamp),
  };
};

export const TitleCinematic = ({
  imageSrc      = null,
  titleLines    = ['タイトル'],
  subtitle      = '',
  badgeText     = '論文ベースで解説',
  topics        = [],
  slideNum      = 1,
  totalSlides   = 17,
  sectionType   = 'prob',
  audioFile     = null,
  paperTitle    = '',
  accent        = '#ffa94d',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accentGlow = 'rgba(255,169,77,0.42)';

  const hdr  = fadeUp(frame, fps, 2);
  const tA   = fadeUp(frame, fps, 8);
  const tB   = fadeUp(frame, fps, 18);
  const sub  = fadeUp(frame, fps, 28);

  return (
    <AbsoluteFill style={{ background: '#0c0c14', overflow: 'hidden' }}>
      {audioFile && <Audio src={staticFile(audioFile)} />}

      {/* Background photo — right-positioned */}
      {imageSrc && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${staticFile(imageSrc)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat',
        }} />
      )}

      {/* Left-dark → right-reveal gradient (smooth, no hard edge) */}
      <div style={{
        position: 'absolute', inset: 0,
        background:
          'linear-gradient(90deg,' +
          'rgba(12,12,20,0.98) 0%,' +
          'rgba(12,12,20,0.96) 22%,' +
          'rgba(12,12,20,0.78) 42%,' +
          'rgba(12,12,20,0.38) 60%,' +
          'rgba(8,8,16,0.10) 80%,' +
          'rgba(0,0,0,0.02) 100%)',
      }} />

      {/* Bottom accent glow */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '18%',
        background: 'linear-gradient(0deg,rgba(180,60,10,0.10),transparent)',
      }} />

      {/* Layout shell */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        height: '100%', padding: '4% 5%',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          opacity: hdr.opacity, transform: `translateY(${hdr.y}px)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: accent,
              boxShadow: `0 0 6px ${accentGlow}`,
            }} />
            <span style={{
              fontFamily: fontPrimary, fontSize: 15, fontWeight: 700,
              letterSpacing: '.14em', color: 'rgba(255,180,120,0.55)',
            }}>{BRAND_NAME}</span>
          </div>
          {badgeText && (
            <div style={{
              background: 'rgba(255,107,53,0.88)', color: '#fff',
              fontFamily: fontPrimary, fontSize: 15, fontWeight: 900,
              padding: '0.25em 0.75em', borderRadius: 4,
            }}>{badgeText}</div>
          )}
        </div>

        {/* Main content — left half */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          paddingRight: '40%',
        }}>
          <div>
            {titleLines.map((line, i) => {
              const anim  = i === 0 ? tA : tB;
              const isLast = i === titleLines.length - 1;
              return (
                <div key={i} style={{
                  fontFamily: fontPrimary,
                  fontSize: isLast ? 82 : 72,
                  fontWeight: 900,
                  lineHeight: 1.1,
                  color: isLast ? accent : '#ffffff',
                  textShadow: isLast
                    ? `0 0 32px ${accentGlow}`
                    : '0 2px 10px rgba(0,0,0,0.85)',
                  opacity: anim.opacity,
                  transform: `translateY(${anim.y}px)`,
                }}>{line}</div>
              );
            })}

            {subtitle && (
              <div style={{
                fontFamily: fontPrimary,
                fontSize: 32, fontWeight: 700,
                color: 'rgba(255,255,255,0.85)',
                textShadow: '0 2px 12px rgba(0,0,0,0.9)',
                marginTop: 18, lineHeight: 1.5,
                opacity: sub.opacity,
                transform: `translateY(${sub.y}px)`,
              }}>{subtitle}</div>
            )}
          </div>
        </div>

        {/* Topic cards */}
        {topics.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${topics.length}, 1fr)`,
            gap: 14,
          }}>
            {topics.map((topic, i) => {
              const ca = cardAnim(frame, fps, 42 + i * 14);
              return (
                <div key={i} style={{
                  background: 'rgba(8,8,18,0.72)',
                  border: `1px solid rgba(255,169,77,0.30)`,
                  borderRadius: 8,
                  padding: '18px 22px',
                  opacity: ca.opacity,
                  transform: `translateY(${ca.y}px) scale(${ca.scale})`,
                }}>
                  <span style={{
                    fontFamily: fontSecondary,
                    fontSize: 34, fontWeight: 900,
                    color: accent,
                    textShadow: `0 0 14px ${accentGlow}`,
                  }}>{topic.num}</span>
                  <div style={{
                    fontFamily: fontPrimary,
                    fontSize: 22, fontWeight: 700,
                    color: '#ffffff',
                    textShadow: '0 1px 8px rgba(0,0,0,0.8)',
                    marginTop: 6, lineHeight: 1.4,
                  }}>{topic.label}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Paper title */}
      {paperTitle && (
        <div style={{
          position: 'absolute', bottom: '0.8%', right: '1.2%',
          fontFamily: fontSecondary, fontSize: 7,
          color: 'rgba(255,255,255,.18)', letterSpacing: '.04em',
        }}>{paperTitle}</div>
      )}
    </AbsoluteFill>
  );
};
