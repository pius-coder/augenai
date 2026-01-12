// src/core/ports/queue/IQueue.ts
// Queue port (in-memory, Redis, etc.)

export interface QueueJob<TPayload = unknown> {
  id: string;
  type: string;
  payload: TPayload;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  availableAt?: Date;
}

export interface EnqueueOptions {
  jobId?: string;
  delayMs?: number;
  maxAttempts?: number;
}

export interface IQueue<TPayload = unknown> {
  getName(): string;

  enqueue(type: string, payload: TPayload, options?: EnqueueOptions): Promise<string>;
  dequeue(): Promise<QueueJob<TPayload> | null>;

  ack(jobId: string): Promise<void>;
  fail(jobId: string, error: unknown): Promise<void>;

  size(): Promise<number>;
}
