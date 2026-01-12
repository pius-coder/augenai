// src/core/domain/use-cases/job/ResumeJobUseCase.ts
// Use case: Resume a paused job

import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { JobResumedEvent } from '../../events/job/JobResumedEvent';
import { JobStatus } from '../../value-objects/JobStatus';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface ResumeJobInput {
  jobId: string;
}

export interface ResumeJobOutput {
  success: boolean;
  jobId: string;
  status: JobStatus;
}

export class ResumeJobUseCase {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: ResumeJobInput): Promise<ResumeJobOutput> {
    const { jobId } = input;

    // Find job
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw ErrorFactory.notFound(`Job with id ${jobId} not found`);
    }

    // Check if job can be resumed
    if (job.status !== JobStatus.PAUSED) {
      throw ErrorFactory.invalidTransition(
        'job.status',
        `Cannot resume job in ${job.status} status. Only paused jobs can be resumed.`
      );
    }

    // Resume job
    job.resume();
    await this.jobRepository.save(job);

    // Emit job resumed event
    await this.eventBus.publish(
      new JobResumedEvent({
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