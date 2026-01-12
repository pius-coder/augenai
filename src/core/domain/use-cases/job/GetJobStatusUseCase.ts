// src/core/domain/use-cases/job/GetJobStatusUseCase.ts
// Use case: Get detailed status of a job with statistics

import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { Job } from '../../entities/Job';
import { ContentItem } from '../../entities/ContentItem';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface GetJobStatusInput {
  jobId: string;
}

export interface GetJobStatusOutput {
  job: Job;
  statistics: {
    totalItems: number;
    completedItems: number;
    failedItems: number;
    inProgressItems: number;
    pendingItems: number;
    progressPercentage: number;
    estimatedCompletionTime?: Date;
  };
  items?: ContentItem[];
}

export class GetJobStatusUseCase {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly itemRepository: IContentItemRepository
  ) {}

  async execute(input: GetJobStatusInput): Promise<GetJobStatusOutput> {
    const { jobId } = input;

    // Find job
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw ErrorFactory.notFound(`Job with id ${jobId} not found`);
    }

    // Get all items for the job
    const items = await this.itemRepository.findByJobId(jobId);
    
    // Calculate statistics
    const inProgressItems = items.filter(item => item.status === 'PROCESSING').length;
    const pendingItems = items.filter(item => item.status === 'PENDING').length;
    
    const progressPercentage = job.getProgressPercentage();
    
    // Calculate estimated completion time (simplified)
    let estimatedCompletionTime: Date | undefined;
    if (job.startedAt && progressPercentage > 0 && progressPercentage < 100) {
      const elapsedTime = Date.now() - job.startedAt.getTime();
      const estimatedTotalTime = (elapsedTime / progressPercentage) * 100;
      const remainingTime = estimatedTotalTime - elapsedTime;
      estimatedCompletionTime = new Date(Date.now() + remainingTime);
    }

    return {
      job,
      statistics: {
        totalItems: job.totalItems,
        completedItems: job.completedItems,
        failedItems: job.failedItems,
        inProgressItems,
        pendingItems,
        progressPercentage,
        estimatedCompletionTime,
      },
      items,
    };
  }
}