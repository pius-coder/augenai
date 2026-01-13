// src/application/workflows/TextGenerationWorkflow.ts
// Workflow: Complete text generation workflow from prompt to chunked text

import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { IQueueManager } from '@/core/ports/queue/IQueueManager';
import { GenerateTextUseCase } from '@/core/domain/use-cases/content/GenerateTextUseCase';
import { ChunkTextUseCase } from '@/core/domain/use-cases/content/ChunkTextUseCase';
import { ContentItem } from '@/core/domain/entities/ContentItem';
import { ItemStatus } from '@/core/domain/value-objects/ItemStatus';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export class TextGenerationWorkflow {
  constructor(
    private readonly contentItemRepository: IContentItemRepository,
    private readonly eventBus: IEventBus,
    private readonly queueManager: IQueueManager,
    private readonly generateTextUseCase: GenerateTextUseCase,
    private readonly chunkTextUseCase: ChunkTextUseCase
  ) {}

  public async execute(itemId: string): Promise<void> {
    try {
      // Step 1: Get the content item
      const item = await this.contentItemRepository.findById(itemId);
      if (!item) {
        throw ErrorFactory.notFound(`Content item with id ${itemId} not found`);
      }

      // Validate item status
      if (item.status !== ItemStatus.VALIDATED) {
        throw ErrorFactory.invalidState(
          `Item must be in VALIDATED state, but is ${item.status}`
        );
      }

      // Step 2: Update item status to text generation
      item.setStatus(ItemStatus.TEXT_GENERATION);
      await this.contentItemRepository.save(item);

      // Step 3: Generate text for the item
      const textResult = await this.generateTextUseCase.execute({
        itemId: item.id,
        variables: {
          titre: item.titre,
          details: item.details,
          category: item.category,
          reference: item.reference,
        },
        systemPrompt: item.job?.systemPrompt,
        userPromptTemplate: item.job?.userPromptTemplate,
        maxTokens: item.job?.maxTokens || 2048,
        temperature: item.job?.temperature || 0.7,
      });

      // Step 4: Update item with generated text
      item.generatedText = textResult.generatedText;
      item.setStatus(ItemStatus.TEXT_GENERATION_COMPLETED);
      await this.contentItemRepository.save(item);

      // Step 5: Add to audio generation queue
      await this.queueManager.addJob('audio-generation', {
        itemId: item.id,
      });

    } catch (error) {
      console.error(`Text generation workflow failed for item ${itemId}:`, error);
      
      // Mark item as failed
      const item = await this.contentItemRepository.findById(itemId);
      if (item) {
        item.setStatus(ItemStatus.FAILED);
        await this.contentItemRepository.save(item);
      }
      
      throw error;
    }
  }

  public async generateTextWithStreaming(
    itemId: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      // Get the content item
      const item = await this.contentItemRepository.findById(itemId);
      if (!item) {
        throw ErrorFactory.notFound(`Content item with id ${itemId} not found`);
      }

      // Generate text with streaming
      await this.generateTextUseCase.execute(
        {
          itemId: item.id,
          variables: {
            titre: item.titre,
            details: item.details,
            category: item.category,
            reference: item.reference,
          },
          systemPrompt: item.job?.systemPrompt,
          userPromptTemplate: item.job?.userPromptTemplate,
          maxTokens: item.job?.maxTokens || 2048,
          temperature: item.job?.temperature || 0.7,
        },
        onChunk
      );

    } catch (error) {
      console.error(`Text generation with streaming failed for item ${itemId}:`, error);
      throw error;
    }
  }

  public async chunkGeneratedText(itemId: string): Promise<void> {
    try {
      // Get the content item
      const item = await this.contentItemRepository.findById(itemId);
      if (!item) {
        throw ErrorFactory.notFound(`Content item with id ${itemId} not found`);
      }

      // Chunk the generated text
      const chunkResult = await this.chunkTextUseCase.execute({
        itemId: item.id,
        text: item.generatedText,
        maxChunkSize: item.job?.maxChunkSize || 2000,
      });

      // Update item status
      item.setStatus(ItemStatus.TEXT_GENERATION_COMPLETED);
      await this.contentItemRepository.save(item);

    } catch (error) {
      console.error(`Text chunking failed for item ${itemId}:`, error);
      throw error;
    }
  }
}