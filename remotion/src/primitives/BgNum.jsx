import { fontSecondary } from '../fonts.js';

export const BgNum = ({ n }) => (
  <div style={{
    position: 'absolute', right: '-1%', bottom: '-6%',
    fontFamily: fontSecondary,
    fontSize: 380, fontWeight: 900,
    color: 'rgba(255,255,255,.025)',
    lineHeight: 1, pointerEvents: 'none', userSelect: 'none', zIndex: 1,
  }}>
    {String(n).padStart(2, '0')}
  </div>
);
