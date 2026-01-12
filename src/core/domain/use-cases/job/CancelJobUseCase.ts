// src/core/domain/use-cases/job/CancelJobUseCase.ts
// Use case: Cancel a running job and cleanup resources

import { z } from 'zod';
import { Job } from '../../entities/Job';
import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { JobCancelledEvent } from '../../events/job/JobCancelledEvent';
import { ItemStatus } from '../../value-objects/ItemStatus';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const CancelJobSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  reason: z.string().optional(),
});

export type CancelJobInput = z.infer<typeof CancelJobSchema>;

export interface CancelJobOutput {
  job: Job;
  cancelledItemsCount: number;
}

export class CancelJobUseCase {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly contentItemRepository: IContentItemRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: CancelJobInput): Promise<CancelJobOutput> {
    // Validate input
    const { jobId, reason } = CancelJobSchema.parse(input);

    // Retrieve job
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw ErrorFactory.notFound('Job', jobId);
    }

    // Cancel job (will validate if cancellation is allowed)
    job.cancel();

    // Get all pending/processing items for this job
    const items = await this.contentItemRepository.findByJobId(jobId);
    let cancelledItemsCount = 0;

    // Cancel all non-terminal items
    for (const item of items) {
      if (
        item.status === ItemStatus.PENDING ||
        item.status === ItemStatus.PROCESSING ||
        item.status === ItemStatus.GENERATING_TEXT ||
        item.status === ItemStatus.CHUNKING_TEXT ||
        item.status === ItemStatus.GENERATING_AUDIO ||
        item.status === ItemStatus.MERGING_AUDIO
      ) {
        item.cancel();
        await this.contentItemRepository.save(item);
        cancelledItemsCount++;
      }
    }

    // Persist job changes
    await this.jobRepository.save(job);

    // Emit domain event
    await this.eventBus.publish(
      new JobCancelledEvent({
        jobId: job.id,
        reason: reason || 'User cancelled',
        timestamp: new Date(),
      })
    );

    return {
      job,
      cancelledItemsCount,
    };
  }
}
