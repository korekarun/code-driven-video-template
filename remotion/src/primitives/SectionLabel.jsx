import { fontPrimary } from '../fonts.js';
import { SEC, D, useFadeUp } from './theme.js';

export const SectionLabel = ({ children, sec = 'prob' }) => {
  const s = useFadeUp(D[0]);
  const { acc } = SEC[sec] || SEC.prob;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.8%', ...s }}>
      <div style={{ width: 18, height: 3, background: acc, borderRadius: 2 }} />
      <span style={{ fontFamily: fontPrimary, fontSize: 40, fontWeight: 700, letterSpacing: '.08em', color: acc }}>
        {children}
      </span>
    </div>
  );
};
