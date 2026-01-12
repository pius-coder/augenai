// src/core/domain/use-cases/job/ListJobsUseCase.ts
// Use case: List all jobs with pagination and filtering

import { z } from 'zod';
import { Job } from '../../entities/Job';
import { JobStatus } from '../../value-objects/JobStatus';
import { IJobRepository, JobListOptions } from '@/core/ports/repositories/IJobRepository';

const ListJobsSchema = z.object({
  status: z.nativeEnum(JobStatus).optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  orderByCreatedAt: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ListJobsInput = z.infer<typeof ListJobsSchema>;

export interface ListJobsOutput {
  jobs: Job[];
  total: number;
  limit: number;
  offset: number;
}

export class ListJobsUseCase {
  constructor(private readonly jobRepository: IJobRepository) {}

  async execute(input: ListJobsInput = {}): Promise<ListJobsOutput> {
    // Validate input
    const validatedInput = ListJobsSchema.parse(input);

    // Build options
    const options: JobListOptions = {
      status: validatedInput.status,
      limit: validatedInput.limit,
      offset: validatedInput.offset,
      orderByCreatedAt: validatedInput.orderByCreatedAt,
    };

    // Retrieve jobs
    const jobs = await this.jobRepository.findAll(options);

    return {
      jobs,
      total: jobs.length,
      limit: validatedInput.limit,
      offset: validatedInput.offset,
    };
  }
}
