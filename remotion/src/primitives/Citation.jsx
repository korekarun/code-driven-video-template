import { fontPrimary } from '../fonts.js';

export const Citation = ({ children }) => (
  <div style={{
    position: 'absolute', bottom: '0.8%', right: '1.2%',
    fontFamily: fontPrimary,
    fontSize: 'clamp(5px,.6vw,7px)',
    color: 'rgba(255,255,255,.18)',
    letterSpacing: '.04em',
    zIndex: 10,
  }}>
    {children}
  </div>
);
