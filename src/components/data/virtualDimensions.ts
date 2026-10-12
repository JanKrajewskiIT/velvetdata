export const DEFAULT_VIEWPORT_HEIGHT = 400;

export const positiveSize = (value: number, fallback: number) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

export const nonnegativeInteger = (value: number, fallback: number) =>
  Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
