// src/infrastructure/queue/QueueManager.ts
// Queue manager that holds multiple named queues

import { IQueueManager } from '@/core/ports/queue/IQueueManager';
import { IQueue } from '@/core/ports/queue/IQueue';
import { InMemoryQueue } from './InMemoryQueue';

export class QueueManager implements IQueueManager {
  private readonly queues: Map<string, IQueue> = new Map();

  constructor() {
    // Initialize default queues
    this.initializeDefaultQueues();
  }

  getQueue<TPayload = unknown>(name: string): IQueue<TPayload> {
    let queue = this.queues.get(name);

    if (!queue) {
      // Create queue on demand
      queue = new InMemoryQueue<TPayload>(name);
      this.queues.set(name, queue);
    }

    return queue as IQueue<TPayload>;
  }

  hasQueue(name: string): boolean {
    return this.queues.has(name);
  }

  async getQueueSize(name: string): Promise<number> {
    const queue = this.queues.get(name);

    if (!queue) {
      return 0;
    }

    return await queue.size();
  }

  async getAllQueueSizes(): Promise<Record<string, number>> {
    const sizes: Record<string, number> = {};

    for (const [name, queue] of this.queues.entries()) {
      sizes[name] = await queue.size();
    }

    return sizes;
  }

  private initializeDefaultQueues(): void {
    // Pre-create common queues used in the pipeline
    const defaultQueues = [
      'validation',
      'text-generation',
      'text-chunking',
      'audio-generation',
      'audio-merge',
      'upload',
      'metrics',
    ];

    for (const queueName of defaultQueues) {
      this.queues.set(queueName, new InMemoryQueue(queueName));
    }
  }
}
