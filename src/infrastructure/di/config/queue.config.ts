// src/infrastructure/di/config/queue.config.ts
import { IJobQueue } from '@/core/ports/queue/IJobQueue';
import { IItemQueue } from '@/core/ports/queue/IItemQueue';
import { IProcessItemQueue } from '@/core/ports/queue/IProcessItemQueue';
import { InMemoryJobQueue } from '@/infrastructure/queue/InMemoryJobQueue';
import { InMemoryItemQueue } from '@/infrastructure/queue/InMemoryItemQueue';
import { container } from '../Container';

export interface QueueConfig {
  concurrency: number;
  retryAttempts: number;
  retryDelay: number;
  maxTimeout: number;
}

export const defaultQueueConfig: QueueConfig = {
  concurrency: 5,
  retryAttempts: 3,
  retryDelay: 1000,
  maxTimeout: 1800000, // 30 minutes
};

export function initializeQueues(config: QueueConfig = defaultQueueConfig) {
  const jobQueue = new InMemoryJobQueue(config);
  const itemQueue = new InMemoryItemQueue(config);
  const processItemQueue = new InMemoryItemQueue(config);

  container.bind('IJobQueue').toConstantValue(jobQueue);
  container.bind('IItemQueue').toConstantValue(itemQueue);
  container.bind('IProcessItemQueue').toConstantValue(processItemQueue);

  return {
    jobQueue,
    itemQueue,
    processItemQueue,
  };
}

export function getQueue(name: 'job' | 'item' | 'process') {
  switch (name) {
    case 'job':
      return container.get<IJobQueue>('IJobQueue');
    case 'item':
      return container.get<IItemQueue>('IItemQueue');
    case 'process':
      return container.get<IProcessItemQueue>('IProcessItemQueue');
    default:
      throw new Error(`Unknown queue type: ${name}`);
  }
}