import { fontPrimary } from '../fonts.js';
import { COLORS } from '../theme.js';
import { SEC, D, useFadeUp } from './theme.js';
import { BRAND_NAME } from '../brand.js';

export const Header = ({ slideNum, totalSlides, sec = 'prob' }) => {
  const s = useFadeUp(D[0]);
  const { acc, chCol } = SEC[sec] || SEC.prob;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, paddingBottom: 14, ...s }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: acc, boxShadow: `0 0 8px ${chCol}` }} />
        <span style={{ fontFamily: fontPrimary, fontSize: 18, fontWeight: 700, letterSpacing: '.14em', color: chCol }}>
          {BRAND_NAME}
        </span>
      </div>
      <span style={{ fontFamily: fontPrimary, fontSize: 18, fontWeight: 700, letterSpacing: '.08em', color: COLORS.g30 }}>
        {String(slideNum).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
      </span>
    </div>
  );
};
