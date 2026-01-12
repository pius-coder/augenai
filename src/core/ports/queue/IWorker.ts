// src/core/ports/queue/IWorker.ts
// Worker port (processes jobs from a queue)

import type { QueueJob } from './IQueue';

export interface IWorker<TPayload = unknown> {
  getName(): string;
  canHandle(type: string): boolean;

  process(job: QueueJob<TPayload>): Promise<void>;
}
