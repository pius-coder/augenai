// src/core/domain/use-cases/content/MergeAudioChunksUseCase.ts
// Use case: Combine audio chunks into final audio file

import { z } from 'zod';
import { ContentItem } from '../../entities/ContentItem';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IAudioChunkRepository } from '@/core/ports/repositories/IAudioChunkRepository';
import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IAudioMergeService } from '@/core/ports/services/audio/IAudioMergeService';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { AudioMergeStartedEvent } from '../../events/item/AudioMergeStartedEvent';
import { AudioMergeCompletedEvent } from '../../events/item/AudioMergeCompletedEvent';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const MergeAudioChunksSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
});

export type MergeAudioChunksInput = z.infer<typeof MergeAudioChunksSchema>;

export interface MergeAudioChunksOutput {
  item: ContentItem;
  finalAudioPath: string;
  totalDuration: number;
}

export class MergeAudioChunksUseCase {
  constructor(
    private readonly contentItemRepository: IContentItemRepository,
    private readonly audioChunkRepository: IAudioChunkRepository,
    private readonly jobRepository: IJobRepository,
    private readonly audioMergeService: IAudioMergeService,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: MergeAudioChunksInput): Promise<MergeAudioChunksOutput> {
    // Validate input
    const { itemId } = MergeAudioChunksSchema.parse(input);

    // Retrieve item
    const item = await this.contentItemRepository.findById(itemId);
    if (!item) {
      throw ErrorFactory.notFound('ContentItem', itemId);
    }

    // Get all chunks for this item
    const chunks = await this.audioChunkRepository.findByItemId(itemId);
    if (chunks.length === 0) {
      throw ErrorFactory.invalidConfig(
        'item.chunks',
        'No audio chunks to merge'
      );
    }

    // Verify all chunks are completed
    const incompleteChunks = chunks.filter(c => !c.isCompleted());
    if (incompleteChunks.length > 0) {
      throw ErrorFactory.invalidConfig(
        'item.chunks',
        `${incompleteChunks.length} chunks are not yet completed`
      );
    }

    // Get job for silence settings
    const job = await this.jobRepository.findById(item.jobId);
    if (!job) {
      throw ErrorFactory.notFound('Job', item.jobId);
    }

    // Emit started event
    await this.eventBus.publish(
      new AudioMergeStartedEvent({
        itemId: item.id,
        jobId: item.jobId,
        chunkCount: chunks.length,
        timestamp: new Date(),
      })
    );

    try {
      // Sort chunks by index
      const sortedChunks = chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
      const audioPaths = sortedChunks.map(c => c.audioPath).filter(p => p) as string[];

      // Merge audio files
      const result = await this.audioMergeService.mergeAudioFiles({
        inputPaths: audioPaths,
        outputPath: `output/item_${item.id}_final.mp3`,
        silenceBetweenMs: job.silenceBetweenChunks,
      });

      // Update item
      item.finalAudioPath = result.outputPath;
      item.audioDuration = result.totalDuration;
      item.complete();
      await this.contentItemRepository.save(item);

      // Emit completed event
      await this.eventBus.publish(
        new AudioMergeCompletedEvent({
          itemId: item.id,
          jobId: item.jobId,
          finalPath: result.outputPath,
          duration: result.totalDuration,
          timestamp: new Date(),
        })
      );

      return {
        item,
        finalAudioPath: result.outputPath,
        totalDuration: result.totalDuration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      item.fail(errorMessage);
      await this.contentItemRepository.save(item);

      throw ErrorFactory.processing(
        'AudioMerge',
        errorMessage,
        { itemId: item.id }
      );
    }
  }
}
