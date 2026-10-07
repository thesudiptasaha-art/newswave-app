/*
  Teleprompter utility functions.
  
  Examples:
  clampFontSize(10) -> 24
  clampFontSize(150) -> 140
  speedToPixelsPerSecond(4) -> 60
  speedToPixelsPerSecond(10) -> 150
  computeScroll(100, 2000, 60) -> 100 + (2 * 60) = 220
*/

export function clampFontSize(px) {
  return Math.max(24, Math.min(140, px));
}

export function speedToPixelsPerSecond(level) {
  const lvl = Math.max(1, Math.min(10, level));
  return lvl * 15;
}

export function computeScroll(currentPos, deltaMs, pixelsPerSecond) {
  return currentPos + (deltaMs / 1000) * pixelsPerSecond;
}
