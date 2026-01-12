// src/core/domain/use-cases/job/RetryFailedJobItemsUseCase.ts
// Use case: Retry all failed items for a job

import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { IItemQueue } from '@/core/ports/queue/IItemQueue';
import { ItemCreatedEvent } from '../../events/item/ItemCreatedEvent';
import { ItemStatus } from '../../value-objects/ItemStatus';
import { JobStatus } from '../../value-objects/JobStatus';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface RetryFailedJobItemsInput {
  jobId: string;
  itemIds?: string[]; // Optional: specific items to retry, if not provided, retry all failed
}

export interface RetryFailedJobItemsOutput {
  success: boolean;
  retriedItems: number;
  failedItems: number;
}

export class RetryFailedJobItemsUseCase {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly itemRepository: IContentItemRepository,
    private readonly eventBus: IEventBus,
    private readonly itemQueue: IItemQueue
  ) {}

  async execute(input: RetryFailedJobItemsInput): Promise<RetryFailedJobItemsOutput> {
    const { jobId, itemIds } = input;

    // Find job
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw ErrorFactory.notFound(`Job with id ${jobId} not found`);
    }

    // Get items to retry
    let itemsToRetry;
    if (itemIds && itemIds.length > 0) {
      // Get specific items
      itemsToRetry = [];
      for (const itemId of itemIds) {
        const item = await this.itemRepository.findById(itemId);
        if (item && item.jobId === jobId && item.status === ItemStatus.FAILED) {
          itemsToRetry.push(item);
        }
      }
    } else {
      // Get all failed items for the job
      itemsToRetry = await this.itemRepository.findByJobIdAndStatus(jobId, ItemStatus.FAILED);
    }

    if (itemsToRetry.length === 0) {
      return {
        success: true,
        retriedItems: 0,
        failedItems: 0,
      };
    }

    // Reset failed items and retry them
    let retriedItems = 0;
    let failedItems = 0;

    for (const item of itemsToRetry) {
      try {
        // Reset item status
        item.resetForRetry();
        await this.itemRepository.save(item);

        // Emit item created event for retry
        await this.eventBus.publish(
          new ItemCreatedEvent({
            itemId: item.id,
            jobId: jobId,
            timestamp: new Date(),
            isRetry: true,
          })
        );

        // Queue item for processing
        await this.itemQueue.enqueue({
          itemId: item.id,
          jobId: jobId,
          priority: 'normal',
        });

        retriedItems++;
      } catch (error) {
        failedItems++;
        console.error(`Failed to retry item ${item.id}:`, error);
      }
    }

    // Update job counters
    job.failedItems -= retriedItems;
    await this.jobRepository.save(job);

    return {
      success: true,
      retriedItems,
      failedItems,
    };
  }
}

// Helper method for ContentItem to reset for retry
import { ContentItem } from '../../entities/ContentItem';

declare module '../../entities/ContentItem' {
  interface ContentItem {
    resetForRetry(): void;
  }
}

ContentItem.prototype.resetForRetry = function() {
  this.status = ItemStatus.PENDING;
  this.errorMessage = undefined;
  this.attempts = 0;
  this.updatedAt = new Date();
};