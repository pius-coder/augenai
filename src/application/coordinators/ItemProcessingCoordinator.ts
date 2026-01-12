// src/application/coordinators/ItemProcessingCoordinator.ts
// Coordinate the complete item processing pipeline

import { IProcessItemQueue } from '@/core/ports/queue/IProcessItemQueue';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { ProcessItemUseCase } from '@/core/domain/use-cases/content/ProcessItemUseCase';
import { ValidateContentItemUseCase } from '@/core/domain/use-cases/content/ValidateContentItemUseCase';
import { GenerateTextUseCase } from '@/core/domain/use-cases/content/GenerateTextUseCase';
import { ChunkTextUseCase } from '@/core/domain/use-cases/content/ChunkTextUseCase';
import { GenerateAudioUseCase } from '@/core/domain/use-cases/content/GenerateAudioUseCase';
import { MergeAudioChunksUseCase } from '@/core/domain/use-cases/content/MergeAudioChunksUseCase';
import { ItemStatus } from '@/core/domain/value-objects/ItemStatus';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';
import { logger } from '@/shared/lib/logger';

export interface ItemProcessingContext {
  itemId: string;
  jobId: string;
  step: 'validation' | 'text-generation' | 'chunking' | 'audio-generation' | 'merging' | 'upload';
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
}

export class ItemProcessingCoordinator {
  constructor(
    private readonly processItemQueue: IProcessItemQueue,
    private readonly eventBus: IEventBus,
    private readonly validateContentItem: ValidateContentItemUseCase,
    private readonly generateText: GenerateTextUseCase,
    private readonly chunkText: ChunkTextUseCase,
    private readonly generateAudio: GenerateAudioUseCase,
    private readonly mergeAudio: MergeAudioChunksUseCase
  ) {}

  async coordinateItemProcessing(context: ItemProcessingContext): Promise<void> {
    const { itemId, jobId, step, retryCount, maxRetries } = context;

    logger.info(`Starting item processing coordination`, {
      itemId,
      jobId,
      step,
      retryCount,
    });

    try {
      switch (step) {
        case 'validation':
          await this.handleValidation(itemId, jobId);
          break;
        case 'text-generation':
          await this.handleTextGeneration(itemId, jobId);
          break;
        case 'chunking':
          await this.handleChunking(itemId, jobId);
          break;
        case 'audio-generation':
          await this.handleAudioGeneration(itemId, jobId);
          break;
        case 'merging':
          await this.handleMerging(itemId, jobId);
          break;
        default:
          throw ErrorFactory.validationError(`Unknown processing step: ${step}`);
      }
    } catch (error) {
      logger.error(`Item processing failed at step ${step}`, {
        itemId,
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount,
      });

      if (retryCount < maxRetries) {
        await this.retryStep({
          ...context,
          retryCount: retryCount + 1,
        });
      } else {
        await this.handlePermanentFailure(itemId, jobId, error, step);
      }
    }
  }

  private async handleValidation(itemId: string, jobId: string): Promise<void> {
    logger.debug('Starting validation', { itemId, jobId });

    const result = await this.validateContentItem.execute({
      itemId,
      validationRules: {
        minLength: 10,
        requiredFields: ['titre', 'details'],
      },
    });

    if (result.valid) {
      logger.info('Validation completed successfully', { itemId, jobId });
      this.emitStepCompleted(itemId, jobId, 'validation');
    } else {
      logger.warn('Validation failed', { itemId, jobId, errors: result.validationErrors });
      throw ErrorFactory.validationError('Content validation failed');
    }
  }

  private async handleTextGeneration(itemId: string, jobId: string): Promise<void> {
    logger.debug('Starting text generation', { itemId, jobId });

    const result = await this.generateText.execute({
      itemId,
      prompt: {
        system: 'Generate detailed content',
        user: 'Create comprehensive text for this item',
      },
    });

    logger.info('Text generation completed', { itemId, jobId, hasGeneratedText: !!result.generatedText });
    this.emitStepCompleted(itemId, jobId, 'text-generation');
  }

  private async handleChunking(itemId: string, jobId: string): Promise<void> {
    logger.debug('Starting chunking', { itemId, jobId });

    const result = await this.chunkText.execute({
      itemId,
      chunkingOptions: {
        method: 'smart',
        maxChars: 2000,
        overlap: 100,
      },
    });

    logger.info('Chunking completed', { itemId, jobId, chunkCount: result.chunks.length });
    this.emitStepCompleted(itemId, jobId, 'chunking');
  }

  private async handleAudioGeneration(itemId: string, jobId: string): Promise<void> {
    logger.debug('Starting audio generation', { itemId, jobId });

    const result = await this.generateAudio.execute({
      itemId,
      voiceSettings: {
        voiceId: 'default',
        stability: 0.5,
        similarityBoost: 0.75,
      },
      ttsOptions: {
        model: 'eleven_multilingual_v2',
        format: 'mp3',
      },
    });

    logger.info('Audio generation completed', { itemId, jobId, success: result.success });
    this.emitStepCompleted(itemId, jobId, 'audio-generation');
  }

  private async handleMerging(itemId: string, jobId: string): Promise<void> {
    logger.debug('Starting audio merging', { itemId, jobId });

    const result = await this.mergeAudio.execute({
      itemId,
      silenceDuration: 500, // 500ms silence between chunks
    });

    logger.info('Audio merging completed', { itemId, jobId, success: result.success });
    this.emitStepCompleted(itemId, jobId, 'merging');
  }

  private emitStepCompleted(itemId: string, jobId: string, step: string): void {
    this.eventBus.publish({
      type: 'item.processing.step.completed',
      data: {
        itemId,
        jobId,
        step,
        timestamp: new Date(),
      },
    });
  }

  private async retryStep(context: ItemProcessingContext): Promise<void> {
    logger.warn('Retrying item processing step', {
      itemId: context.itemId,
      jobId: context.jobId,
      step: context.step,
      retryCount: context.retryCount,
    });

    // Add delay before retry (exponential backoff)
    const delay = Math.min(1000 * Math.pow(2, context.retryCount), 30000); // Max 30 seconds
    await new Promise(resolve => setTimeout(resolve, delay));

    // Re-queue the item
    await this.processItemQueue.enqueue({
      itemId: context.itemId,
      jobId: context.jobId,
      priority: 'normal',
      context: {
        ...context,
        isRetry: true,
      },
    });
  }

  private async handlePermanentFailure(
    itemId: string,
    jobId: string,
    error: any,
    step: string,
  ): Promise<void> {
    logger.error('Permanent item processing failure', {
      itemId,
      jobId,
      step,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // This would mark the item as failed in the database
    await this.eventBus.publish({
      type: 'item.processing.permanent.failure',
      data: {
        itemId,
        jobId,
        step,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      },
    });
  }
}
