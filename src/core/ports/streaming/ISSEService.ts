// src/core/ports/streaming/ISSEService.ts
// Server-Sent Events (SSE) service port

export type SSEChannel = string;

export interface SSEEvent<T = unknown> {
  event?: string;
  data: T;
  id?: string;
}

export interface ISSEService {
  publish<T>(channel: SSEChannel, event: SSEEvent<T>): Promise<void>;
}
