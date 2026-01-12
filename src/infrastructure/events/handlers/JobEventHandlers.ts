// src/infrastructure/events/handlers/JobEventHandlers.ts
// Event handlers for job-related events

/* eslint-disable @typescript-eslint/no-explicit-any */
import { IEventHandler } from '@/core/ports/events/IEventHandler';
import { JobStartedEvent, JobCompletedEvent, JobFailedEvent } from '@/core/domain/events/job/JobEvents';
import { QueueManager } from '../../queue/QueueManager';

export class JobEventHandlers {
  constructor(private readonly queueManager: QueueManager) {}

  handleJobStarted(): IEventHandler<JobStartedEvent> {
    return {
      handle: async (event: JobStartedEvent) => {
        const { jobId } = event.payload;

        // In a real implementation, we would fetch job's items and add them to the validation queue
        // For now, we'll just log the event
        console.log('Job started:', jobId);

        // Example: Add items to validation queue
        // const validationQueue = this.queueManager.getQueue<{ itemId: string }>('validation');
        // const items = await this.contentItemRepository.findByJobId(jobId);
        // for (const item of items) {
        //   await validationQueue.enqueue('validate_item', { itemId: item.id });
        // }
      },
    };
  }

  handleJobCompleted(): IEventHandler<JobCompletedEvent> {
    return {
      handle: async (event: JobCompletedEvent) => {
        const { jobId } = event.payload;

        console.log('Job completed:', jobId);

        // Cleanup queues for this job if needed
        // await this.queueManager.clearQueue(`job:${jobId}`);
      },
    };
  }

  handleJobFailed(): IEventHandler<JobFailedEvent> {
    return {
      handle: async (event: JobFailedEvent) => {
        const { jobId, error } = event.payload;

        console.error('Job failed:', jobId, error);

        // Log error and potentially send notifications
        // await this.errorLogRepository.save(
        //   ErrorLog.create({
        //     jobId,
        //     step: PipelineStep.VALIDATION, // or appropriate step
        //     message: error,
        //     isRetryable: false,
        //   })
        // );
      },
    };
  }

  // Register all handlers with event bus
  registerHandlers(eventBus: any): void {
    eventBus.subscribe('job.started', this.handleJobStarted());
    eventBus.subscribe('job.completed', this.handleJobCompleted());
    eventBus.subscribe('job.failed', this.handleJobFailed());
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
