import { SEC } from './theme.js';

export const RadialGlow = ({ sec = 'prob' }) => {
  const { rgb } = SEC[sec] || SEC.prob;
  return (
    <div style={{
      position: 'absolute', width: '70%', height: '70%',
      background: `radial-gradient(circle, rgba(${rgb},.08) 0%, transparent 70%)`,
      top: '15%', left: '15%',
      pointerEvents: 'none', zIndex: 1,
    }} />
  );
};
