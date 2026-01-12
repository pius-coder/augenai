// src/application/orchestrators/PipelineOrchestrator.ts
// Main orchestrator for job processing pipeline

import { Job } from '@/core/domain/entities/Job';
import { ContentItem } from '@/core/domain/entities/ContentItem';
import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { IJobQueue } from '@/core/ports/queue/IJobQueue';
import { JobStartedEvent } from '@/core/domain/events/job/JobStartedEvent';
import { JobCompletedEvent } from '@/core/domain/events/job/JobCompletedEvent';
import { JobFailedEvent } from '@/core/domain/events/job/JobFailedEvent';
import { JobProgressUpdatedEvent } from '@/core/domain/events/job/JobProgressUpdatedEvent';
import { ItemStatus } from '@/core/domain/value-objects/ItemStatus';
import { Logger } from '@/shared/lib/logger';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export class PipelineOrchestrator {
  private logger: Logger;

  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly contentItemRepository: IContentItemRepository,
    private readonly eventBus: IEventBus,
    private readonly jobQueue: IJobQueue
  ) {
    this.logger = Logger.getInstance();
  }

  async startJobProcessing(jobId: string): Promise<void> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw ErrorFactory.notFound('Job', jobId);
    }

    try {
      job.start();
      await this.jobRepository.save(job);

      await this.eventBus.publish(
        new JobStartedEvent({
          jobId: job.id,
          totalItems: job.totalItems,
          timestamp: new Date(),
        })
      );

      const items = await this.contentItemRepository.findByJobId(jobId);
      
      for (const item of items) {
        await this.jobQueue.enqueueItem({
          itemId: item.id,
          jobId: job.id,
          priority: 1,
        });
      }

      this.logger.info(`Job ${jobId} started with ${items.length} items`);
    } catch (error) {
      job.fail();
      await this.jobRepository.save(job);

      await this.eventBus.publish(
        new JobFailedEvent({
          jobId: job.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        })
      );

      throw error;
    }
  }

  async processItem(itemId: string): Promise<void> {
    const item = await this.contentItemRepository.findById(itemId);
    if (!item) {
      throw ErrorFactory.notFound('ContentItem', itemId);
    }

    try {
      item.startProcessing();
      await this.contentItemRepository.save(item);

      await this.updateJobProgress(item.jobId);
    } catch (error) {
      item.fail(error instanceof Error ? error.message : 'Unknown error');
      await this.contentItemRepository.save(item);

      const job = await this.jobRepository.findById(item.jobId);
      if (job) {
        job.incrementFailedItems();
        await this.jobRepository.save(job);
      }

      await this.updateJobProgress(item.jobId);
    }
  }

  async completeItem(itemId: string): Promise<void> {
    const item = await this.contentItemRepository.findById(itemId);
    if (!item) {
      throw ErrorFactory.notFound('ContentItem', itemId);
    }

    item.complete();
    await this.contentItemRepository.save(item);

    const job = await this.jobRepository.findById(item.jobId);
    if (job) {
      job.incrementCompletedItems();
      await this.jobRepository.save(job);

      if (job.isComplete()) {
        await this.eventBus.publish(
          new JobCompletedEvent({
            jobId: job.id,
            completedItems: job.completedItems,
            failedItems: job.failedItems,
            timestamp: new Date(),
          })
        );
      }
    }

    await this.updateJobProgress(item.jobId);
  }

  async failItem(itemId: string, error: string): Promise<void> {
    const item = await this.contentItemRepository.findById(itemId);
    if (!item) {
      throw ErrorFactory.notFound('ContentItem', itemId);
    }

    item.fail(error);
    await this.contentItemRepository.save(item);

    const job = await this.jobRepository.findById(item.jobId);
    if (job) {
      job.incrementFailedItems();
      await this.jobRepository.save(job);

      if (job.isFailed()) {
        await this.eventBus.publish(
          new JobFailedEvent({
            jobId: job.id,
            error: `Job failed with ${job.failedItems} failed items`,
            timestamp: new Date(),
          })
        );
      }
    }

    await this.updateJobProgress(item.jobId);
  }

  private async updateJobProgress(jobId: string): Promise<void> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) return;

    const progress = job.getProgressPercentage();

    await this.eventBus.publish(
      new JobProgressUpdatedEvent({
        jobId: job.id,
        progress,
        completedItems: job.completedItems,
        failedItems: job.failedItems,
        totalItems: job.totalItems,
        timestamp: new Date(),
      })
    );
  }

  async cancelJobProcessing(jobId: string): Promise<void> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw ErrorFactory.notFound('Job', jobId);
    }

    job.cancel();
    await this.jobRepository.save(job);

    const items = await this.contentItemRepository.findByJobId(jobId);
    for (const item of items) {
      if (
        item.status === ItemStatus.PENDING ||
        item.status === ItemStatus.PROCESSING
      ) {
        item.cancel();
        await this.contentItemRepository.save(item);
      }
    }

    this.logger.info(`Job ${jobId} cancelled`);
  }
}
