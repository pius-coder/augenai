// src/core/domain/use-cases/job/GetJobUseCase.ts
// Use case: Retrieve a job by ID

import { z } from 'zod';
import { Job } from '../../entities/Job';
import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const GetJobSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
});

export type GetJobInput = z.infer<typeof GetJobSchema>;

export interface GetJobOutput {
  job: Job;
}

export class GetJobUseCase {
  constructor(private readonly jobRepository: IJobRepository) {}

  async execute(input: GetJobInput): Promise<GetJobOutput> {
    // Validate input
    const { jobId } = GetJobSchema.parse(input);

    // Retrieve job
    const job = await this.jobRepository.findById(jobId);

    if (!job) {
      throw ErrorFactory.notFound('Job', jobId);
    }

    return { job };
  }
}
