// src/infrastructure/queue/InMemoryQueue.ts
// In-memory queue implementation for development/testing

import {
  IQueue,
  QueueJob,
  EnqueueOptions,
} from '@/core/ports/queue/IQueue';
import { ValidationError } from '@/shared/utils/errors/AppError';

export class InMemoryQueue<TPayload = unknown> implements IQueue<TPayload> {
  private readonly jobs: Map<string, QueueJob<TPayload>> = new Map();
  private readonly queue: string[] = [];
  private readonly name: string;

  constructor(name: string) {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Queue name cannot be empty');
    }
    this.name = name;
  }

  getName(): string {
    return this.name;
  }

  async enqueue(
    type: string,
    payload: TPayload,
    options?: EnqueueOptions
  ): Promise<string> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date();

    const job: QueueJob<TPayload> = {
      id,
      type,
      payload,
      attempts: 0,
      maxAttempts: options?.maxAttempts || 3,
      createdAt: now,
      availableAt: options?.delayMs
        ? new Date(now.getTime() + options.delayMs)
        : undefined,
    };

    this.jobs.set(id, job);

    if (!options?.delayMs || options.delayMs <= 0) {
      this.queue.push(id);
    } else {
      // Delayed job - schedule it
      this.scheduleDelayedJob(id, options.delayMs);
    }

    return id;
  }

  async dequeue(): Promise<QueueJob<TPayload> | null> {
    const jobId = this.queue.shift();

    if (!jobId) {
      return null;
    }

    const job = this.jobs.get(jobId);

    if (!job) {
      return null;
    }

    return job;
  }

  async ack(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new ValidationError(`Job ${jobId} not found`);
    }

    this.jobs.delete(jobId);
  }

  async fail(jobId: string, error: unknown): Promise<void> {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new ValidationError(`Job ${jobId} not found`);
    }

    job.attempts++;

    if (job.attempts < job.maxAttempts) {
      // Re-queue for retry
      this.queue.push(jobId);
    } else {
      // Max attempts reached, remove from queue
      this.jobs.delete(jobId);

      console.error(
        `Job ${jobId} failed after ${job.attempts} attempts:`,
        error
      );
    }
  }

  async size(): Promise<number> {
    return this.queue.length;
  }

  private scheduleDelayedJob(jobId: string, delayMs: number): void {
    setTimeout(() => {
      if (this.jobs.has(jobId)) {
        this.queue.push(jobId);
      }
    }, delayMs);
  }
}
