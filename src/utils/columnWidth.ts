export const DEFAULT_COLUMN_MIN_WIDTH = 64;

export const columnWidthBounds = (min?: number, max?: number) => {
  const minimum = typeof min === 'number' && Number.isFinite(min) ? Math.max(1, min) : DEFAULT_COLUMN_MIN_WIDTH;
  const maximum = typeof max === 'number' && Number.isFinite(max) ? Math.max(minimum, max) : Infinity;
  return { min: minimum, max: maximum };
};

export const constrainColumnWidth = (width: number, bounds: ReturnType<typeof columnWidthBounds>): number =>
  Math.min(bounds.max, Math.max(bounds.min, Math.round(width)));
