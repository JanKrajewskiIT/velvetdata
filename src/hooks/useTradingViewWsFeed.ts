import type {
  TradingViewChartPoint,
  TradingViewFeedContext,
  TradingViewLiveFeedConfig,
} from '../charts/TradingViewChart/TradingViewChart';

interface TradingViewWsFeedOptions {
  mapData: (
    payload: unknown,
    context: TradingViewFeedContext,
  ) => TradingViewChartPoint | TradingViewChartPoint[] | null;
  url: string | ((context: TradingViewFeedContext) => string);
  enabled?: boolean;
  protocols?: string | string[] | ((context: TradingViewFeedContext) => string | string[] | undefined);
  webSocketFactory?: (url: string, protocols?: string | string[]) => WebSocket;
  parseMessage?: (event: MessageEvent, context: TradingViewFeedContext) => unknown;
  buildSubscribeMessage?: (
    context: TradingViewFeedContext,
  ) => string | ArrayBuffer | Blob | ArrayBufferView<ArrayBuffer> | null;
  buildUnsubscribeMessage?: (
    context: TradingViewFeedContext,
  ) => string | ArrayBuffer | Blob | ArrayBufferView<ArrayBuffer> | null;
  onOpen?: (event: Event, context: TradingViewFeedContext) => void;
  onError?: (event: Event, context: TradingViewFeedContext) => void;
  onClose?: (event: CloseEvent, context: TradingViewFeedContext) => void;
}

const resolveValue = <T>(value: T | ((context: TradingViewFeedContext) => T), context: TradingViewFeedContext): T => {
  if (typeof value === 'function') return (value as (ctx: TradingViewFeedContext) => T)(context);
  return value;
};

const defaultParseMessage = (event: MessageEvent): unknown => {
  if (typeof event.data !== 'string') return event.data;
  try {
    return JSON.parse(event.data) as unknown;
  } catch {
    return event.data;
  }
};

const useTradingViewWsFeed = (options: TradingViewWsFeedOptions): TradingViewLiveFeedConfig => {
  return {
    mode: 'websocket',
    enabled: options.enabled ?? true,
    subscribe: (emit, context) => {
      if (typeof WebSocket === 'undefined' && !options.webSocketFactory) return undefined;

      const socketFactory =
        options.webSocketFactory ?? ((url: string, protocols?: string | string[]) => new WebSocket(url, protocols));
      const url = resolveValue(options.url, context);
      const protocols = options.protocols ? resolveValue(options.protocols, context) : undefined;
      const socket = socketFactory(url, protocols);
      const parseMessage = options.parseMessage ?? defaultParseMessage;

      const handleOpen = (event: Event) => {
        const message = options.buildSubscribeMessage?.(context);
        if (message !== undefined && message !== null && socket.readyState === WebSocket.OPEN) socket.send(message);
        options.onOpen?.(event, context);
      };

      const handleMessage = (event: MessageEvent) => {
        const payload = parseMessage(event, context);
        const bars = options.mapData(payload, context);
        if (bars) emit(bars);
      };

      const handleError = (event: Event) => options.onError?.(event, context);
      const handleClose = (event: CloseEvent) => options.onClose?.(event, context);

      socket.addEventListener('open', handleOpen);
      socket.addEventListener('message', handleMessage);
      socket.addEventListener('error', handleError);
      socket.addEventListener('close', handleClose);

      return () => {
        const message = options.buildUnsubscribeMessage?.(context);
        if (message !== undefined && message !== null && socket.readyState === WebSocket.OPEN) socket.send(message);
        socket.removeEventListener('open', handleOpen);
        socket.removeEventListener('message', handleMessage);
        socket.removeEventListener('error', handleError);
        socket.removeEventListener('close', handleClose);
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) socket.close();
      };
    },
  };
};

export type { TradingViewWsFeedOptions };
export default useTradingViewWsFeed;
