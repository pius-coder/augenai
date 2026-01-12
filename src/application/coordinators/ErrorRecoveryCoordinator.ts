// src/application/coordinators/ErrorRecoveryCoordinator.ts
// Coordinator for handling errors, retries, and recovery in the pipeline

import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { IQueue } from '@/core/ports/queue/IQueue';
import { Job } from '@/core/domain/entities/Job';
import { JobStatus } from '@/core/domain/value-objects/JobStatus';
import { ItemStatus } from '@/core/domain/value-objects/ItemStatus';
import { RetryScheduledEvent } from '@/core/domain/events/error/RetryScheduledEvent';
import { ErrorOccurredEvent } from '@/core/domain/events/error/ErrorOccurredEvent';
import { logger } from '@/shared/lib/logger';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface ErrorContext {
  context: 'job' | 'item' | 'chunk' | 'system';
  entityId: string;
  error: Error;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
}

export interface RecoveryResult {
  success: boolean;
  errorResolved: boolean;
  retryScheduled?: boolean;
  nextRetryAt?: Date;
  fallbackApplied?: boolean;
}

export class ErrorRecoveryCoordinator {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly itemRepository: IContentItemRepository,
    private readonly eventBus: IEventBus,
    private readonly retryQueue: IQueue
  ) {}

  async handleError(context: ErrorContext): Promise<RecoveryResult> {
    const {
      context: errorContext,
      entityId,
      error,
      severity,
      retryable,
      retryCount,
      maxRetries,
      metadata = {},
    } = context;

    logger.error(`${errorContext} error occurred`, {
      entityId,
      error: error.message,
      severity,
      retryCount,
    });

    // Emit error occurred event
    await this.eventBus.publish(
      new ErrorOccurredEvent({
        errorContext,
        entityId,
        error: error.message,
        severity,
        timestamp: new Date(),
        stack: error.stack,
      })
    );

    // Determine if we should retry
    const shouldRetry = this.shouldRetry(errorContext, retryable, retryCount, maxRetries, severity);

    if (shouldRetry) {
      return await this.scheduleRetry(context);
    } else {
      return await this.handlePermanentError(context);
    }
  }

  private shouldRetry(
    context: string,
    retryable: boolean,
    retryCount: number,
    maxRetries: number,
    severity: string
  ): boolean {
    // Don't retry critical errors or non-retryable errors
    if (!retryable || severity === 'critical') {
      return false;
    }

    // Check if we've exceeded max retries
    return retryCount < maxRetries;
  }

  private async scheduleRetry(context: ErrorContext): Promise<RecoveryResult> {
    const { entityId, retryCount, maxRetries, error } = context;

    // Calculate exponential backoff delay
    const baseDelay = 1000; // 1 second
    const maxDelay = 300000; // 5 minutes
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    const nextRetryAt = new Date(Date.now() + delay);

    logger.warn(`Scheduling retry for ${context.context}`, {
      entityId,
      retryCount: retryCount + 1,
      maxRetries,
      delay,
    });

    // Schedule retry in queue
    await this.retryQueue.enqueue({
      entityId,
      context: context.context,
      retryCount: retryCount + 1,
      maxRetries,
      scheduledFor: nextRetryAt,
      error: error.message,
    });

    // Emit retry scheduled event
    await this.eventBus.publish(
      new RetryScheduledEvent({
        entityId,
        context: context.context,
        retryCount: retryCount + 1,
        maxRetries,
        scheduledFor: nextRetryAt,
        timestamp: new Date(),
      })
    );

    return {
      success: false,
      errorResolved: false,
      retryScheduled: true,
      nextRetryAt,
    };
  }

  private async handlePermanentError(context: ErrorContext): Promise<RecoveryResult> {
    const { entityId, context: errorContext, error, metadata } = context;

    logger.error(`Permanent error - no more retries`, {
      entityId,
      errorContext,
      error: error.message,
    });

    // Handle based on context
    switch (errorContext) {
      case 'job':
        await this.handleJobError(entityId, error, metadata);
        break;
      case 'item':
        await this.handleItemError(entityId, error, metadata);
        break;
      case 'chunk':
        await this.handleChunkError(entityId, error, metadata);
        break;
      default:
        logger.warn('Unknown error context', { errorContext });
    }

    return {
      success: false,
      errorResolved: false,
      retryScheduled: false,
      fallbackApplied: false,
    };
  }

  private async handleJobError(jobId: string, error: Error, metadata: Record<string, any>): Promise<void> {
    try {
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        logger.warn(`Job ${jobId} not found when handling error`);
        return;
      }

      // Mark job as failed
      job.fail();
      await this.jobRepository.save(job);

      logger.info(`Job ${jobId} marked as failed due to permanent error`, {
        error: error.message,
      });
    } catch (saveError) {
      logger.error(`Failed to save job error state`, {
        jobId,
        error: saveError instanceof Error ? saveError.message : 'Unknown error',
        originalError: error.message,
      });
    }
  }

  private async handleItemError(itemId: string, error: Error, metadata: Record<string, any>): Promise<void> {
    try {
      const item = await this.itemRepository.findById(itemId);
      if (!item) {
        logger.warn(`Item ${itemId} not found when handling error`);
        return;
      }

      // Mark item as failed
      item.setStatus(ItemStatus.FAILED);
      (item as any).errorMessage = error.message;
      (item as any).completedAt = new Date();

      await this.itemRepository.save(item);

      logger.info(`Item ${itemId} marked as failed`, {
        error: error.message,
        jobId: item.jobId,
      });

      // For failed items, we might want to emit an event for downstream processing
      await this.eventBus.publish({
        type: 'item.permanent.failure',
        data: {
          itemId,
          jobId: item.jobId,
          error: error.message,
          step: metadata.step,
          timestamp: new Date(),
        },
      });
    } catch (saveError) {
      logger.error(`Failed to save item error state`, {
        itemId,
        error: saveError instanceof Error ? saveError.message : 'Unknown error',
        originalError: error.message,
      });
    }
  }

  private async handleChunkError(chunkId: string, error: Error, metadata: Record<string, any>): Promise<void> {
    logger.warn(`Chunk ${chunkId} failed - no specific action taken`, {
      error: error.message,
      metadata,
    });
  }

  async getErrorStats(jobId?: string): Promise<{
    totalErrors: number;
    retryableErrors: number;
    permanentErrors: number;
    errorsByType: Record<string, number>;
  }> {
    // Note: In a real implementation, this would fetch from database/error tracking system
    // For now, return mock data
    return {
      totalErrors: 0,
      retryableErrors: 0,
      permanentErrors: 0,
      errorsByType: {},
    };
  }

  async resetEntity(entityType: 'job' | 'item' | 'chunk', entityId: string): Promise<void> {
    logger.info(`Resetting entity after error`, { entityType, entityId });

    switch (entityType) {
      case 'job':
        await this.resetJob(entityId);
        break;
      case 'item':
        await this.resetItem(entityId);
        break;
      case 'chunk':
        logger.debug('No reset implemented for chunks');
        break;
    }
  }

  private async resetJob(jobId: string): Promise<void> {
    const job = await this.jobRepository.findById(jobId);
    if (job) {
      // Reset job to paused state for manual review
      if (job.status === JobStatus.FAILED) {
        job.setStatus(JobStatus.PAUSED);
        job.completedAt = undefined;
        await this.jobRepository.save(job);
      }
    }
  }

  private async resetItem(itemId: string): Promise<void> {
    const item = await this.itemRepository.findById(itemId);
    if (item) {
      // Reset item for retry
      (item as any).errorMessage = undefined;
      item.attempts = 0;
      item.setStatus(ItemStatus.PENDING);
      await this.itemRepository.save(item);
    }
  }
}

// Extend interfaces for missing methods
declare module '@/core/domain/entities/Job' {
  interface Job {
    setStatus(status: JobStatus): void;
  }
}

Job.prototype.setStatus = function(status: JobStatus) {
  if (status === JobStatus.PAUSED) {
    this.pause();
  } else if (status === JobStatus.PROCESSING) {
    this.resume();
  }
};

declare module '@/core/domain/entities/ContentItem' {
  interface ContentItem {
    attempts: number;
    errorMessage: string;
  }
}