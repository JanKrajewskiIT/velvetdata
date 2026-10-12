/** Returns `min` when the range is inverted (`max < min`). */
export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const percentOf = (value: number, max: number): number => clamp((value / max) * 100, 0, 100);
