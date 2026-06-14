import { interpolate, useCurrentFrame, Easing } from 'remotion';

export const SEC = {
  prob: { acc: '#ff6b6b', glow: 'rgba(255,107,107,.4)', dim: 'rgba(255,107,107,.12)', rgb: '255,107,107', chCol: 'rgba(255,180,180,.55)' },
  data: { acc: '#4dabf7', glow: 'rgba(77,171,247,.4)',  dim: 'rgba(77,171,247,.12)',  rgb: '77,171,247',  chCol: 'rgba(140,200,255,.55)' },
  sol:  { acc: '#69db7c', glow: 'rgba(105,219,124,.4)', dim: 'rgba(105,219,124,.12)', rgb: '105,219,124', chCol: 'rgba(140,255,160,.55)' },
};

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

export const D = [7, 18, 30, 42, 54, 66]; // stagger frames

export function useFadeUp(startFrame, dur = 22) {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [startFrame, startFrame + dur], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  return { opacity: p, transform: `translateY(${interpolate(p, [0, 1], [18, 0])}px)` };
}

export function useFadeScale(startFrame, dur = 20) {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [startFrame, startFrame + dur], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  return { opacity: p, transform: `scale(${interpolate(p, [0, 1], [0.92, 1])})` };
}
