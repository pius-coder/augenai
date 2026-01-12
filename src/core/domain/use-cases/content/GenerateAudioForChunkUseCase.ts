// src/core/domain/use-cases/content/GenerateAudioForChunkUseCase.ts
// Use case: Generate audio for a specific text chunk

import { IAudioChunkRepository } from '@/core/ports/repositories/IAudioChunkRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { IStorageService } from '@/core/ports/services/storage/IStorageService';
import { ITTSService } from '@/core/ports/Services/tts/ITTSService';
import { AudioChunkGeneratedEvent } from '../../events/item/AudioChunkGeneratedEvent';
import { ChunkProcessingStartedEvent } from '../../events/chunk/ChunkProcessingStartedEvent';
import { ChunkProcessingCompletedEvent } from '../../events/chunk/ChunkProcessingCompletedEvent';
import { AudioChunk } from '../../entities/AudioChunk';
import { TextChunk } from '../../value-objects/TextChunk';
import { VoiceSettings } from '../../value-objects/VoiceSettings';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface GenerateAudioForChunkInput {
  chunkId: string;
  itemId: string;
  jobId: string;
  text: string;
  voiceSettings?: VoiceSettings;
  sequence?: number;
}

export interface GenerateAudioForChunkOutput {
  success: boolean;
  chunkId: string;
  audioUrl: string;
  duration: number;
  fileSize: number;
}

export class GenerateAudioForChunkUseCase {
  constructor(
    private readonly chunkRepository: IAudioChunkRepository,
    private readonly ttsService: ITTSService,
    private readonly storageService: IStorageService,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: GenerateAudioForChunkInput): Promise<GenerateAudioForChunkOutput> {
    const { chunkId, itemId, jobId, text, voiceSettings, sequence = 0 } = input;

    // Validate input
    if (!text || text.trim().length === 0) {
      throw ErrorFactory.validationError('Text for audio generation cannot be empty');
    }

    // Emit chunk processing started event
    await this.eventBus.publish(
      new ChunkProcessingStartedEvent({
        chunkId,
        itemId,
        jobId,
        timestamp: new Date(),
      })
    );

    try {
      // Convert text to speech using TTS service
      const audioBuffer = await this.ttsService.generateSpeech({
        text,
        voiceId: voiceSettings?.voiceId,
        stability: voiceSettings?.stability,
        similarityBoost: voiceSettings?.similarityBoost,
        style: voiceSettings?.style,
        useSpeakerBoost: voiceSettings?.useSpeakerBoost,
      });

      // Generate unique filename
      const fileName = `audio_${jobId}_${itemId}_${chunkId}_${Date.now()}.mp3`;
      
      // Upload audio to storage
      const audioUrl = await this.storageService.uploadAudio(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        metadata: {
          itemId,
          jobId,
          chunkId,
          sequence,
        },
      });

      // Create audio duration based on text length (simplified estimation)
      // Average speaking rate: 150 words per minute
      const wordCount = text.split(/\s+/).length;
      const duration = Math.ceil((wordCount / 150) * 60); // Duration in seconds

      // Save chunk metadata
      const chunkData: any = {
        id: chunkId,
        itemId,
        jobId,
        text,
        sequence,
        audioUrl,
        duration,
        status: 'completed',
        createdAt: new Date(),
      };

      await this.chunkRepository.saveChunk(chunkData);

      // Emit audio chunk generated event
      await this.eventBus.publish(
        new AudioChunkGeneratedEvent({
          itemId,
          chunkId,
          audioUrl,
          duration,
          timestamp: new Date(),
        })
      );

      // Emit chunk processing completed event
      await this.eventBus.publish(
        new ChunkProcessingCompletedEvent({
          chunkId,
          itemId,
          jobId,
          success: true,
          timestamp: new Date(),
        })
      );

      return {
        success: true,
        chunkId,
        audioUrl,
        duration,
        fileSize: audioBuffer.length,
      };
    } catch (error) {
      // Emit chunk processing completed event with failure
      await this.eventBus.publish(
        new ChunkProcessingCompletedEvent({
          chunkId,
          itemId,
          jobId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        })
      );

      throw ErrorFactory.audioProcessingError(
        'chunk.audio.generation',
        `Failed to generate audio for chunk ${chunkId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// Extend storage service interface
declare module '@/core/ports/services/storage/IStorageService' {
  interface IStorageService {
    uploadAudio(
      fileName: string, 
      data: Buffer, 
      options?: {
        contentType?: string;
        metadata?: Record<string, any>;
      }
    ): Promise<string>;
  }
}