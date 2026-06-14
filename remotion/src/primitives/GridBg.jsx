export const GridBg = () => (
  <div style={{
    position: 'absolute', inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)
    `,
    backgroundSize: '80px 80px',
    pointerEvents: 'none',
    zIndex: 0,
  }} />
);
