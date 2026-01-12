// src/core/domain/use-cases/job/DeleteJobUseCase.ts
// Use case: Delete a job and all associated data

import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IAudioChunkRepository } from '@/core/ports/repositories/IAudioChunkRepository';
import { JobStatus } from '../../value-objects/JobStatus';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface DeleteJobInput {
  jobId: string;
  force?: boolean;
}

export interface DeleteJobOutput {
  success: boolean;
  deletedItems: number;
  deletedChunks: number;
}

export class DeleteJobUseCase {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly itemRepository: IContentItemRepository,
    private readonly chunkRepository: IAudioChunkRepository
  ) {}

  async execute(input: DeleteJobInput): Promise<DeleteJobOutput> {
    const { jobId, force = false } = input;

    // Find job
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw ErrorFactory.notFound(`Job with id ${jobId} not found`);
    }

    // Check if job can be deleted
    const activeStatuses = [JobStatus.PROCESSING, JobStatus.PAUSED, JobStatus.QUEUED];
    if (activeStatuses.includes(job.status) && !force) {
      throw ErrorFactory.invalidTransition(
        'job.status',
        `Cannot delete active job. Current status: ${job.status}. Use 'force: true' to force delete.`
      );
    }

    // Get all items for this job
    const items = await this.itemRepository.findByJobId(jobId);
    const itemIds = items.map(item => item.id);

    let deletedChunks = 0;
    let deletedItems = 0;

    // Delete all chunks for each item
    for (const itemId of itemIds) {
      const chunks = await this.chunkRepository.findByItemId(itemId);
      for (const chunk of chunks) {
        await this.chunkRepository.delete(chunk.id);
        deletedChunks++;
      }
      
      // Delete the item
      await this.itemRepository.delete(itemId);
      deletedItems++;
    }

    // Delete the job itself
    await this.jobRepository.delete(jobId);

    return {
      success: true,
      deletedItems,
      deletedChunks,
    };
  }
}