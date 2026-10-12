export interface TradingPalette {
  readonly background: string;
  readonly text: string;
  readonly border: string;
  readonly up: string;
  readonly down: string;
  readonly indicators: readonly string[];
}

export const readTradingPalette = (element: HTMLElement): TradingPalette => {
  const style = getComputedStyle(element);
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas rendering is unavailable.');
  const color = (token: string): string => {
    const value = style.getPropertyValue(token).trim();
    if (!value) throw new Error(`Missing Velvet UI theme token: ${token}.`);
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return `rgba(${r ?? 0}, ${g ?? 0}, ${b ?? 0}, ${(a ?? 255) / 255})`;
  };
  return {
    background: color('--bg-raised'),
    text: color('--fg-secondary'),
    border: color('--border-subtle'),
    up: color('--status-success-solid'),
    down: color('--status-danger-solid'),
    indicators: [color('--dv-1'), color('--dv-2'), color('--dv-3')],
  };
};
