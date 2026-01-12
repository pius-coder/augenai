// src/core/domain/use-cases/content/ChunkTextUseCase.ts
// Use case: Split generated text into chunks (max 2000 chars)

import { z } from 'zod';
import { ContentItem } from '../../entities/ContentItem';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IAudioChunkRepository } from '@/core/ports/repositories/IAudioChunkRepository';
import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { ITextChunkingService } from '@/core/ports/services/audio/ITextChunkingService';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { TextChunkingCompletedEvent } from '../../events/item/TextChunkingCompletedEvent';
import { AudioChunk } from '../../entities/AudioChunk';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const ChunkTextSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
});

export type ChunkTextInput = z.infer<typeof ChunkTextSchema>;

export interface ChunkTextOutput {
  item: ContentItem;
  chunks: AudioChunk[];
}

export class ChunkTextUseCase {
  constructor(
    private readonly contentItemRepository: IContentItemRepository,
    private readonly audioChunkRepository: IAudioChunkRepository,
    private readonly jobRepository: IJobRepository,
    private readonly textChunkingService: ITextChunkingService,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: ChunkTextInput): Promise<ChunkTextOutput> {
    // Validate input
    const { itemId } = ChunkTextSchema.parse(input);

    // Retrieve item
    const item = await this.contentItemRepository.findById(itemId);
    if (!item) {
      throw ErrorFactory.notFound('ContentItem', itemId);
    }

    if (!item.generatedText) {
      throw ErrorFactory.invalidConfig(
        'item.generatedText',
        'No generated text to chunk'
      );
    }

    // Retrieve job for chunk size
    const job = await this.jobRepository.findById(item.jobId);
    if (!job) {
      throw ErrorFactory.notFound('Job', item.jobId);
    }

    try {
      // Split text into chunks
      const textChunks = await this.textChunkingService.chunkText(
        item.generatedText,
        job.maxChunkSize
      );

      // Create AudioChunk entities
      const audioChunks: AudioChunk[] = [];
      for (let i = 0; i < textChunks.length; i++) {
        const chunk = AudioChunk.create({
          itemId: item.id,
          chunkIndex: i,
          text: textChunks[i].text,
          charCount: textChunks[i].charCount,
        });
        audioChunks.push(chunk);
        await this.audioChunkRepository.save(chunk);
      }

      // Update item
      item.moveToNextStep();
      await this.contentItemRepository.save(item);

      // Emit completed event
      await this.eventBus.publish(
        new TextChunkingCompletedEvent({
          itemId: item.id,
          jobId: item.jobId,
          chunkCount: audioChunks.length,
          timestamp: new Date(),
        })
      );

      return {
        item,
        chunks: audioChunks,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      item.fail(errorMessage);
      await this.contentItemRepository.save(item);

      throw ErrorFactory.processing(
        'ChunkText',
        errorMessage,
        { itemId: item.id }
      );
    }
  }
}
