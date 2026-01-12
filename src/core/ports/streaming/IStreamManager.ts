// src/core/ports/streaming/IStreamManager.ts
// Subscription manager port for real-time streams

import type { SSEChannel, SSEEvent } from './ISSEService';

export type StreamSubscriber<T = unknown> = (event: SSEEvent<T>) => void;

export interface UnsubscribeStreamFn {
  (): void;
}

export interface IStreamManager {
  subscribe<T>(channel: SSEChannel, subscriber: StreamSubscriber<T>): UnsubscribeStreamFn;
  broadcast<T>(channel: SSEChannel, event: SSEEvent<T>): Promise<void>;
}
