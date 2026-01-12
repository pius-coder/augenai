// src/core/domain/use-cases/job/PauseJobUseCase.ts
// Use case: Pause a job's processing

import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { JobPausedEvent } from '../../events/job/JobPausedEvent';
import { JobStatus } from '../../value-objects/JobStatus';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface PauseJobInput {
  jobId: string;
}

export interface PauseJobOutput {
  success: boolean;
  jobId: string;
  status: JobStatus;
}

export class PauseJobUseCase {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: PauseJobInput): Promise<PauseJobOutput> {
    const { jobId } = input;

    // Find job
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw ErrorFactory.notFound(`Job with id ${jobId} not found`);
    }

    // Check if job can be paused
    if (!job.canModify() || job.status === JobStatus.PAUSED) {
      throw ErrorFactory.invalidTransition(
        'job.status',
        `Cannot pause job in ${job.status} status`
      );
    }

    // Pause job
    job.pause();
    await this.jobRepository.save(job);

    // Emit job paused event
    await this.eventBus.publish(
      new JobPausedEvent({
        jobId: job.id,
        jobName: job.name,
        timestamp: new Date(),
      })
    );

    return {
      success: true,
      jobId: job.id,
      status: job.status,
    };
  }
}