import type { JSX } from 'solid-js';
import { For, splitProps } from 'solid-js';


import type { Props } from '@jankrajewskiit/ui';
import styles from './TradingViewChartOverlay.module.css';

interface ProjectedTrendLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface ProjectedLevelLine {
  id: string;
  y: number;
  x2: number;
}

interface ProjectedZone {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ProjectedDraftPoint {
  time: number;
  price: number;
  x: number;
  y: number;
}

interface TradingViewChartOverlayProps {
  overlayRef?: (element: SVGSVGElement) => void;
  width: number;
  height: number;
  onPointerDown: JSX.EventHandlerUnion<SVGSVGElement, PointerEvent>;
  zones: readonly ProjectedZone[];
  trendLines: readonly ProjectedTrendLine[];
  levels: readonly ProjectedLevelLine[];
  draftPoints: readonly ProjectedDraftPoint[];
}

const TradingViewChartOverlay = (props: Props<TradingViewChartOverlayProps>) => {
  const [local, rest] = splitProps(props, [
    'overlayRef',
    'width',
    'height',
    'zones',
    'trendLines',
    'levels',
    'draftPoints',
  ]);

  return (
    <svg
      {...rest}
      ref={local.overlayRef}
      class={styles.drawingOverlay}
      viewBox={`0 0 ${local.width || 1} ${local.height || 1}`}
    >
      <For each={local.zones}>
        {(zone) => <rect x={zone.left} y={zone.top} width={zone.width} height={zone.height} class={styles.zoneRect} />}
      </For>
      <For each={local.trendLines}>
        {(line) => <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} class={styles.trendLine} />}
      </For>
      <For each={local.levels}>
        {(level) => <line x1="0" y1={level.y} x2={level.x2} y2={level.y} class={styles.levelLine} />}
      </For>
      <For each={local.draftPoints}>
        {(point) => <circle cx={point.x} cy={point.y} r="4" class={styles.draftPoint} />}
      </For>
    </svg>
  );
};

export default TradingViewChartOverlay;
