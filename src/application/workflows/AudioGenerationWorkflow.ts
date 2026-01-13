// src/application/workflows/AudioGenerationWorkflow.ts
// Workflow: Complete audio generation workflow from chunks to merged audio

import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IAudioChunkRepository } from '@/core/ports/repositories/IAudioChunkRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { IQueueManager } from '@/core/ports/queue/IQueueManager';
import { ChunkTextUseCase } from '@/core/domain/use-cases/content/ChunkTextUseCase';
import { GenerateAudioForChunkUseCase } from '@/core/domain/use-cases/content/GenerateAudioForChunkUseCase';
import { MergeAudioChunksUseCase } from '@/core/domain/use-cases/content/MergeAudioChunksUseCase';
import { ContentItem } from '@/core/domain/entities/ContentItem';
import { AudioChunk } from '@/core/domain/entities/AudioChunk';
import { ItemStatus } from '@/core/domain/value-objects/ItemStatus';
import { ChunkStatus } from '@/core/domain/value-objects/ChunkStatus';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export class AudioGenerationWorkflow {
  constructor(
    private readonly contentItemRepository: IContentItemRepository,
    private readonly audioChunkRepository: IAudioChunkRepository,
    private readonly eventBus: IEventBus,
    private readonly queueManager: IQueueManager,
    private readonly chunkTextUseCase: ChunkTextUseCase,
    private readonly generateAudioForChunkUseCase: GenerateAudioForChunkUseCase,
    private readonly mergeAudioChunksUseCase: MergeAudioChunksUseCase
  ) {}

  public async execute(itemId: string): Promise<void> {
    try {
      // Step 1: Get the content item
      const item = await this.contentItemRepository.findById(itemId);
      if (!item) {
        throw ErrorFactory.notFound(`Content item with id ${itemId} not found`);
      }

      // Validate item status
      if (item.status !== ItemStatus.TEXT_GENERATION_COMPLETED) {
        throw ErrorFactory.invalidState(
          `Item must be in TEXT_GENERATION_COMPLETED state, but is ${item.status}`
        );
      }

      // Step 2: Update item status to audio generation
      item.setStatus(ItemStatus.AUDIO_GENERATION);
      await this.contentItemRepository.save(item);

      // Step 3: Chunk the generated text
      const chunkResult = await this.chunkTextUseCase.execute({
        itemId: item.id,
        text: item.generatedText,
        maxChunkSize: item.job?.maxChunkSize || 2000,
      });

      // Step 4: Create audio chunks for each text chunk
      const audioChunks: AudioChunk[] = [];
      for (const textChunk of chunkResult.chunks) {
        const audioChunk = AudioChunk.create({
          itemId: item.id,
          text: textChunk.text,
          chunkIndex: textChunk.index,
          status: ChunkStatus.PENDING,
          createdAt: new Date(),
        });
        
        await this.audioChunkRepository.save(audioChunk);
        audioChunks.push(audioChunk);
      }

      // Step 5: Add audio generation tasks to queue
      for (const audioChunk of audioChunks) {
        await this.queueManager.addJob('audio-generation', {
          chunkId: audioChunk.id,
          itemId: item.id,
          text: audioChunk.text,
          voiceSettings: item.job?.voiceSettings,
        });
      }

      // Step 6: Monitor chunk processing and trigger merge when complete
      // This is handled by ChunkProcessingCoordinator listening to events

    } catch (error) {
      console.error(`Audio generation workflow failed for item ${itemId}:`, error);
      
      // Mark item as failed
      const item = await this.contentItemRepository.findById(itemId);
      if (item) {
        item.setStatus(ItemStatus.FAILED);
        await this.contentItemRepository.save(item);
      }
      
      throw error;
    }
  }

  public async generateAudioForChunk(chunkId: string): Promise<void> {
    try {
      // Get the audio chunk
      const audioChunk = await this.audioChunkRepository.findById(chunkId);
      if (!audioChunk) {
        throw ErrorFactory.notFound(`Audio chunk with id ${chunkId} not found`);
      }

      // Validate chunk status
      if (audioChunk.status !== ChunkStatus.PENDING) {
        throw ErrorFactory.invalidState(
          `Audio chunk must be in PENDING state, but is ${audioChunk.status}`
        );
      }

      // Update chunk status
      audioChunk.status = ChunkStatus.PROCESSING;
      await this.audioChunkRepository.save(audioChunk);

      // Generate audio for the chunk
      await this.generateAudioForChunkUseCase.execute({
        chunkId: audioChunk.id,
        text: audioChunk.text,
        voiceId: audioChunk.voiceId,
        stability: audioChunk.stability,
        similarityBoost: audioChunk.similarityBoost,
        style: audioChunk.style,
        useSpeakerBoost: audioChunk.useSpeakerBoost,
      });

    } catch (error) {
      console.error(`Failed to generate audio for chunk ${chunkId}:`, error);
      
      // Mark chunk as failed
      const audioChunk = await this.audioChunkRepository.findById(chunkId);
      if (audioChunk) {
        audioChunk.status = ChunkStatus.FAILED;
        audioChunk.error = error instanceof Error ? error.message : 'Unknown error';
        await this.audioChunkRepository.save(audioChunk);
      }
      
      throw error;
    }
  }

  public async mergeAudioChunks(itemId: string): Promise<void> {
    try {
      // Execute merge use case
      await this.mergeAudioChunksUseCase.execute({ itemId });

    } catch (error) {
      console.error(`Failed to merge audio chunks for item ${itemId}:`, error);
      throw error;
    }
  }
}