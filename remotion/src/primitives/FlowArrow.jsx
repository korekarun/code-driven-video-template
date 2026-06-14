export const FlowArrow = ({ acc = '#ff6b6b', style = {} }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
    <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
      <line x1="0" y1="12" x2="38" y2="12" stroke={acc} strokeWidth="2" strokeDasharray="4 3" opacity="0.6" />
      <polyline points="32,4 44,12 32,20" stroke={acc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  </div>
);
