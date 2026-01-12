// src/core/ports/queue/IQueueManager.ts
// Queue manager port (holds multiple named queues)

import type { IQueue } from './IQueue';

export interface IQueueManager {
  getQueue<TPayload = unknown>(name: string): IQueue<TPayload>;
  hasQueue(name: string): boolean;
}
