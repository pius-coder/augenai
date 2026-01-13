// src/application/orchestrators/JobOrchestrator.ts
// Orchestrator: Coordinate job processing workflow

import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { IQueueManager } from '@/core/ports/queue/IQueueManager';
import { JobStartedEvent } from '@/core/domain/events/job/JobStartedEvent';
import { JobCompletedEvent } from '@/core/domain/events/job/JobCompletedEvent';
import { JobFailedEvent } from '@/core/domain/events/job/JobFailedEvent';
import { ItemCompletedEvent } from '@/core/domain/events/item/ItemCompletedEvent';
import { ItemFailedEvent } from '@/core/domain/events/item/ItemFailedEvent';
import { Job } from '@/core/domain/entities/Job';
import { JobStatus } from '@/core/domain/value-objects/JobStatus';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export class JobOrchestrator {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly contentItemRepository: IContentItemRepository,
    private readonly eventBus: IEventBus,
    private readonly queueManager: IQueueManager
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for job started events
    this.eventBus.subscribe(JobStartedEvent.name, async (event: JobStartedEvent) => {
      await this.handleJobStarted(event);
    });

    // Listen for item completed events
    this.eventBus.subscribe(ItemCompletedEvent.name, async (event: ItemCompletedEvent) => {
      await this.handleItemCompleted(event);
    });

    // Listen for item failed events
    this.eventBus.subscribe(ItemFailedEvent.name, async (event: ItemFailedEvent) => {
      await this.handleItemFailed(event);
    });
  }

  private async handleJobStarted(event: JobStartedEvent): Promise<void> {
    const { jobId } = event;

    try {
      // Get the job
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        throw ErrorFactory.notFound(`Job with id ${jobId} not found`);
      }

      // Get all items for this job
      const items = await this.contentItemRepository.findByJobId(jobId);

      // Add items to validation queue
      for (const item of items) {
        await this.queueManager.addJob('validation', {
          itemId: item.id,
          jobId: job.id,
        });
      }

    } catch (error) {
      console.error(`Failed to handle job started event for job ${jobId}:`, error);
      
      // Mark job as failed
      const job = await this.jobRepository.findById(jobId);
      if (job) {
        job.setStatus(JobStatus.FAILED);
        await this.jobRepository.save(job);
        
        await this.eventBus.publish(
          new JobFailedEvent({
            jobId: job.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
          })
        );
      }
    }
  }

  private async handleItemCompleted(event: ItemCompletedEvent): Promise<void> {
    const { jobId, itemId } = event;

    try {
      // Get the job
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        throw ErrorFactory.notFound(`Job with id ${jobId} not found`);
      }

      // Update job progress
      job.incrementCompletedItems();
      await this.jobRepository.save(job);

      // Check if all items are completed
      const totalItems = job.totalItems;
      const completedItems = job.completedItems;

      if (completedItems === totalItems) {
        // Mark job as completed
        job.setStatus(JobStatus.COMPLETED);
        job.completedAt = new Date();
        await this.jobRepository.save(job);

        // Emit job completed event
        await this.eventBus.publish(
          new JobCompletedEvent({
            jobId: job.id,
            completedItems,
            totalItems,
            timestamp: new Date(),
          })
        );
      }

    } catch (error) {
      console.error(`Failed to handle item completed event for item ${itemId}:`, error);
    }
  }

  private async handleItemFailed(event: ItemFailedEvent): Promise<void> {
    const { jobId, itemId, error } = event;

    try {
      // Get the job
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        throw ErrorFactory.notFound(`Job with id ${jobId} not found`);
      }

      // Update job progress (failed items still count as processed)
      job.incrementCompletedItems();
      job.incrementFailedItems();
      await this.jobRepository.save(job);

      // Check if too many items have failed
      const failureThreshold = Math.ceil(job.totalItems * 0.3); // 30% failure threshold
      if (job.failedItems >= failureThreshold) {
        // Mark job as failed
        job.setStatus(JobStatus.FAILED);
        job.completedAt = new Date();
        await this.jobRepository.save(job);

        // Emit job failed event
        await this.eventBus.publish(
          new JobFailedEvent({
            jobId: job.id,
            error: `Too many items failed (${job.failedItems}/${job.totalItems})`,
            timestamp: new Date(),
          })
        );
      }

    } catch (error) {
      console.error(`Failed to handle item failed event for item ${itemId}:`, error);
    }
  }

  public async startJobProcessing(jobId: string): Promise<void> {
    try {
      // Get the job
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        throw ErrorFactory.notFound(`Job with id ${jobId} not found`);
      }

      // Validate job status
      if (job.status !== JobStatus.PENDING) {
        throw ErrorFactory.invalidState(
          `Job must be in PENDING state to start, but is ${job.status}`
        );
      }

      // Start the job
      job.start();
      await this.jobRepository.save(job);

      // Emit job started event (will be handled by this orchestrator)
      await this.eventBus.publish(
        new JobStartedEvent({
          jobId: job.id,
          timestamp: new Date(),
        })
      );

    } catch (error) {
      console.error(`Failed to start job processing for job ${jobId}:`, error);
      throw error;
    }
  }

  public async getJobStatus(jobId: string): Promise<{
    status: JobStatus;
    progress: number;
    completedItems: number;
    totalItems: number;
    failedItems: number;
  }> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw ErrorFactory.notFound(`Job with id ${jobId} not found`);
    }

    const progress = job.completedItems / Math.max(job.totalItems, 1);

    return {
      status: job.status,
      progress,
      completedItems: job.completedItems,
      totalItems: job.totalItems,
      failedItems: job.failedItems,
    };
  }
}