/** Adds delta to value and clamps the result between min and max. */
export function clampAdd(
  value: number,
  delta: number,
  min = 0,
  max = 100,
): number {
  return Math.min(max, Math.max(min, value + delta));
}
