// src/core/domain/use-cases/job/RetryJobUseCase.ts
// Use case: Retry a failed job or failed items in a job

import { z } from 'zod';
import { Job } from '../../entities/Job';
import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { JobResumedEvent } from '../../events/job/JobResumedEvent';
import { ItemStatus } from '../../value-objects/ItemStatus';
import { JobStatus } from '../../value-objects/JobStatus';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const RetryJobSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  retryFailedOnly: z.boolean().optional().default(true),
});

export type RetryJobInput = z.infer<typeof RetryJobSchema>;

export interface RetryJobOutput {
  job: Job;
  retriedItemsCount: number;
}

export class RetryJobUseCase {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly contentItemRepository: IContentItemRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: RetryJobInput): Promise<RetryJobOutput> {
    // Validate input
    const { jobId, retryFailedOnly } = RetryJobSchema.parse(input);

    // Retrieve job
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw ErrorFactory.notFound('Job', jobId);
    }

    // Check if job can be retried
    if (job.status !== JobStatus.FAILED && job.status !== JobStatus.COMPLETED) {
      throw ErrorFactory.invalidConfig(
        'job.status',
        `Cannot retry job in ${job.status} status. Only FAILED or COMPLETED jobs can be retried.`
      );
    }

    // Get items to retry
    const items = await this.contentItemRepository.findByJobId(jobId);
    let retriedItemsCount = 0;

    // Reset failed items (and optionally cancelled items)
    for (const item of items) {
      const shouldRetry = retryFailedOnly
        ? item.status === ItemStatus.FAILED
        : item.status === ItemStatus.FAILED || item.status === ItemStatus.CANCELLED;

      if (shouldRetry) {
        item.retry();
        await this.contentItemRepository.save(item);
        retriedItemsCount++;
      }
    }

    if (retriedItemsCount === 0) {
      throw ErrorFactory.invalidConfig(
        'job.retry',
        'No failed items to retry'
      );
    }

    // Reset job counters
    job.failedItems = 0;
    job.completedItems = job.totalItems - retriedItemsCount;

    // Resume job processing
    if (job.status === JobStatus.FAILED) {
      job.resume();
    } else {
      // If completed, restart
      job.start();
    }

    // Persist changes
    await this.jobRepository.save(job);

    // Emit domain event
    await this.eventBus.publish(
      new JobResumedEvent({
        jobId: job.id,
        timestamp: new Date(),
      })
    );

    return {
      job,
      retriedItemsCount,
    };
  }
}
