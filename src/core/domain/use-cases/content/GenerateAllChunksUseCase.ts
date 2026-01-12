// src/core/domain/use-cases/content/GenerateAllChunksUseCase.ts
// Use case: Generate all chunks for a content item

import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IAudioChunkRepository } from '@/core/ports/repositories/IAudioChunkRepository';
import { ITextChunkerService } from '@/core/ports/Services/parsing/ITextChunkerService';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { TextChunkingCompletedEvent } from '../../events/item/TextChunkingCompletedEvent';
import { ChunkCreatedEvent } from '../../events/chunk/ChunkCreatedEvent';
import { ContentItem } from '../../entities/ContentItem';
import { TextChunk } from '../../value-objects/TextChunk';
import { ItemStatus } from '../../value-objects/ItemStatus';
import { PipelineStep } from '../../entities/ContentItem';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface GenerateAllChunksInput {
  itemId: string;
  forceRegenerate?: boolean;
}

export interface GenerateAllChunksOutput {
  success: boolean;
  itemId: string;
  chunksGenerated: number;
  chunks: Array<{
    chunkId: string;
    text: string;
    sequence: number;
  }>;
}

export class GenerateAllChunksUseCase {
  constructor(
    private readonly itemRepository: IContentItemRepository,
    private readonly chunkRepository: IAudioChunkRepository,
    private readonly textChunkerService: ITextChunkerService,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: GenerateAllChunksInput): Promise<GenerateAllChunksOutput> {
    const { itemId, forceRegenerate = false } = input;

    // Find item
    const item = await this.itemRepository.findById(itemId);
    if (!item) {
      throw ErrorFactory.notFound(`Content item with id ${itemId} not found`);
    }

    // Check if chunks already exist and we're not forcing regeneration
    if (!forceRegenerate) {
      const existingChunks = await this.chunkRepository.findByItemId(itemId);
      if (existingChunks.length > 0) {
        return {
          success: true,
          itemId,
          chunksGenerated: existingChunks.length,
          chunks: existingChunks.map(chunk => ({
            chunkId: chunk.id,
            text: chunk.text,
            sequence: chunk.sequence,
          })),
        };
      }
    }

    // Get the text to chunk
    const textToChunk = item.generatedText || `${item.titre} ${item.details}`;
    if (!textToChunk || textToChunk.trim().length === 0) {
      throw ErrorFactory.validationError('No text available for chunking');
    }

    // Update item status
    item.updateStep(PipelineStep.CHUNKING, ItemStatus.PROCESSING);
    await this.itemRepository.save(item);

    // Use text chunker service to create chunks
    const chunks = await this.textChunkerService.chunkText(textToChunk, {
      maxChunkSize: 2000,
      overlap: 100,
      preserveSentences: true,
    });

    let chunksGenerated = 0;
    const generatedChunks: Array<{chunkId: string; text: string; sequence: number}> = [];

    // Save chunks and emit events
    for (let i = 0; i < chunks.length; i++) {
      const textChunk = chunks[i];
      
      try {
        // Create audio chunk entity
        const chunkId = `chunk_${Date.now()}_${i}`;
        
        // Save chunk metadata
        await this.chunkRepository.saveChunk({
          id: chunkId,
          itemId,
          jobId: item.jobId,
          text: textChunk.text,
          sequence: i,
          status: 'pending',
          createdAt: new Date(),
        });

        // Emit chunk created event
        await this.eventBus.publish(
          new ChunkCreatedEvent({
            chunkId,
            itemId,
            jobId: item.jobId,
            text: textChunk.text,
            sequence: i,
            timestamp: new Date(),
          })
        );

        chunksGenerated++;
        generatedChunks.push({
          chunkId,
          text: textChunk.text,
          sequence: i,
        });
      } catch (error) {
        console.error(`Failed to generate chunk ${i} for item ${itemId}:`, error);
      }
    }
      const textChunk = chunks[i];
      
      try {
        // Create audio chunk entity
        const chunkId = `chunk_${Date.now()}_${i}`;
        
        // Save chunk metadata
        await this.chunkRepository.saveChunk({
          id: chunkId,
          itemId,
          jobId: item.jobId,
          text: textChunk.text,
          sequence: i,
          status: 'pending',
          createdAt: new Date(),
        });

        // Emit chunk created event
        await this.eventBus.publish(
          new ChunkCreatedEvent({
            chunkId,
            itemId,
            jobId: item.jobId,
            text: textChunk.text,
            sequence: i,
            timestamp: new Date(),
          })
        );

        chunksGenerated++;
        generatedChunks.push({
          chunkId,
          text: textChunk.text,
          sequence: i,
        });
      } catch (error) {
        console.error(`Failed to generate chunk ${i} for item ${itemId}:`, error);
      }
    }

    // Update item status
    if (chunksGenerated > 0) {
      item.updateStep(PipelineStep.CHUNKING, ItemStatus.CHUNKED);
    } else {
      item.updateStep(PipelineStep.CHUNKING, ItemStatus.FAILED);
    }
    await this.itemRepository.save(item);

    // Emit text chunking completed event
    await this.eventBus.publish(
      new TextChunkingCompletedEvent({
        itemId,
        jobId: item.jobId,
        chunksCount: chunksGenerated,
        timestamp: new Date(),
      })
    );

    return {
      success: chunksGenerated > 0,
      itemId,
      chunksGenerated,
      chunks: generatedChunks,
    };

    // Emit text chunking completed event
    await this.eventBus.publish(
      new TextChunkingCompletedEvent({
        itemId,
        jobId: item.jobId,
        chunksCount: chunksGenerated,
        timestamp: new Date(),
      })
    );

    return {
      success: chunksGenerated > 0,
      itemId,
      chunksGenerated,
      chunks: generatedChunks,
    };
  }
}

// Extend AudioChunkRepository interface
declare module '@/core/ports/repositories/IAudioChunkRepository' {
  interface IAudioChunkRepository {
    saveChunk(data: any): Promise<void>;
  }
}