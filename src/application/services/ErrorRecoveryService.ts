// src/application/services/ErrorRecoveryService.ts
// Service: Centralized error handling and recovery

import { IErrorLogRepository } from '@/core/ports/repositories/IErrorLogRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { IQueueManager } from '@/core/ports/queue/IQueueManager';
import { ErrorOccurredEvent } from '@/core/domain/events/error/ErrorOccurredEvent';
import { RetryScheduledEvent } from '@/core/domain/events/error/RetryScheduledEvent';
import { ErrorLog } from '@/core/domain/entities/ErrorLog';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export class ErrorRecoveryService {
  constructor(
    private readonly errorLogRepository: IErrorLogRepository,
    private readonly eventBus: IEventBus,
    private readonly queueManager: IQueueManager
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for error events
    this.eventBus.subscribe(ErrorOccurredEvent.name, async (event: ErrorOccurredEvent) => {
      await this.handleErrorOccurred(event);
    });
  }

  private async handleErrorOccurred(event: ErrorOccurredEvent): Promise<void> {
    const { errorId, errorType, errorMessage, context, timestamp } = event;

    try {
      // Log the error
      const errorLog = ErrorLog.create({
        id: errorId,
        type: errorType,
        message: errorMessage,
        context,
        occurredAt: timestamp,
        status: 'logged',
        retryCount: 0,
      });

      await this.errorLogRepository.save(errorLog);

      // Determine if this error is retryable
      const isRetryable = this.isRetryableError(errorType);

      if (isRetryable) {
        // Schedule retry with exponential backoff
        const retryDelay = this.calculateRetryDelay(errorLog.retryCount);

        await this.scheduleRetry(errorId, retryDelay);
      }

    } catch (error) {
      console.error(`Failed to handle error ${errorId}:`, error);
    }
  }

  private isRetryableError(errorType: string): boolean {
    const retryableErrors = [
      'network_error',
      'rate_limit',
      'timeout',
      'service_unavailable',
      'transient_error',
    ];

    return retryableErrors.includes(errorType.toLowerCase());
  }

  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 300000; // 5 minutes
    
    const delay = Math.min(
      baseDelay * Math.pow(2, retryCount),
      maxDelay
    );

    // Add jitter (randomness) to prevent thundering herd
    const jitter = delay * 0.2 * Math.random();

    return delay + jitter;
  }

  private async scheduleRetry(errorId: string, delayMs: number): Promise<void> {
    try {
      // Update error log with retry scheduled status
      const errorLog = await this.errorLogRepository.findById(errorId);
      if (!errorLog) {
        throw ErrorFactory.notFound(`Error log with id ${errorId} not found`);
      }

      errorLog.status = 'retry_scheduled';
      errorLog.retryCount += 1;
      errorLog.nextRetryAt = new Date(Date.now() + delayMs);

      await this.errorLogRepository.save(errorLog);

      // Emit retry scheduled event
      await this.eventBus.publish(
        new RetryScheduledEvent({
          errorId,
          retryCount: errorLog.retryCount,
          nextRetryAt: errorLog.nextRetryAt,
          timestamp: new Date(),
        })
      );

      // Add to retry queue
      await this.queueManager.addJob('retry', {
        errorId,
        retryCount: errorLog.retryCount,
      }, delayMs);

    } catch (error) {
      console.error(`Failed to schedule retry for error ${errorId}:`, error);
      throw ErrorFactory.retryError('Failed to schedule retry', error);
    }
  }

  public async retryError(errorId: string): Promise<void> {
    try {
      // Get the error log
      const errorLog = await this.errorLogRepository.findById(errorId);
      if (!errorLog) {
        throw ErrorFactory.notFound(`Error log with id ${errorId} not found`);
      }

      // Update status
      errorLog.status = 'retrying';
      errorLog.retryCount += 1;
      await this.errorLogRepository.save(errorLog);

      // Execute retry based on error type
      switch (errorLog.type.toLowerCase()) {
        case 'network_error':
        case 'timeout':
        case 'service_unavailable':
          // Retry the original operation
          await this.retryOriginalOperation(errorLog);
          break;

        case 'rate_limit':
          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, 5000));
          await this.retryOriginalOperation(errorLog);
          break;

        default:
          // For other errors, just mark as failed
          errorLog.status = 'failed';
          await this.errorLogRepository.save(errorLog);
      }

    } catch (error) {
      console.error(`Failed to retry error ${errorId}:`, error);
      
      // Mark as failed
      const errorLog = await this.errorLogRepository.findById(errorId);
      if (errorLog) {
        errorLog.status = 'failed';
        errorLog.finalError = error instanceof Error ? error.message : 'Unknown error';
        await this.errorLogRepository.save(errorLog);
      }
      
      throw ErrorFactory.retryError('Failed to retry error', error);
    }
  }

  private async retryOriginalOperation(errorLog: ErrorLog): Promise<void> {
    try {
      // In a real implementation, this would retry the specific operation
      // based on the context stored in the error log
      
      // For now, we'll just mark it as recovered
      errorLog.status = 'recovered';
      errorLog.resolvedAt = new Date();
      await this.errorLogRepository.save(errorLog);

    } catch (error) {
      console.error(`Retry operation failed for error ${errorLog.id}:`, error);
      throw error;
    }
  }

  public async getErrorStats(): Promise<{
    totalErrors: number;
    retryableErrors: number;
    recoveredErrors: number;
    failedErrors: number;
    pendingRetries: number;
  }> {
    try {
      const allErrors = await this.errorLogRepository.findAll();

      const stats = {
        totalErrors: allErrors.length,
        retryableErrors: allErrors.filter(e => this.isRetryableError(e.type)).length,
        recoveredErrors: allErrors.filter(e => e.status === 'recovered').length,
        failedErrors: allErrors.filter(e => e.status === 'failed').length,
        pendingRetries: allErrors.filter(e => e.status === 'retry_scheduled').length,
      };

      return stats;

    } catch (error) {
      console.error('Failed to get error stats:', error);
      throw ErrorFactory.errorStatsError('Failed to get error stats', error);
    }
  }

  public async cleanupResolvedErrors(maxAgeDays: number = 30): Promise<number> {
    try {
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

      // Find resolved errors older than cutoff
      const resolvedErrors = await this.errorLogRepository.findResolvedErrors(cutoffDate);

      // Delete them
      let deletedCount = 0;
      for (const error of resolvedErrors) {
        await this.errorLogRepository.delete(error.id);
        deletedCount++;
      }

      return deletedCount;

    } catch (error) {
      console.error('Failed to cleanup resolved errors:', error);
      throw ErrorFactory.errorCleanupError('Failed to cleanup resolved errors', error);
    }
  }
}