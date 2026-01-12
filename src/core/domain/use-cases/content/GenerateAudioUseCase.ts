// src/core/domain/use-cases/content/GenerateAudioUseCase.ts
// Use case: Convert text chunks to audio via ElevenLabs

import { z } from 'zod';
import { AudioChunk } from '../../entities/AudioChunk';
import { IAudioChunkRepository } from '@/core/ports/repositories/IAudioChunkRepository';
import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { ITTSService } from '@/core/ports/services/tts/ITTSService';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { AudioChunkGeneratedEvent } from '../../events/item/AudioChunkGeneratedEvent';
import { ChunkStatus } from '../../value-objects/ChunkStatus';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const GenerateAudioSchema = z.object({
  chunkId: z.string().min(1, 'Chunk ID is required'),
});

export type GenerateAudioInput = z.infer<typeof GenerateAudioSchema>;

export interface GenerateAudioOutput {
  chunk: AudioChunk;
  audioPath: string;
  duration: number;
}

export class GenerateAudioUseCase {
  constructor(
    private readonly audioChunkRepository: IAudioChunkRepository,
    private readonly jobRepository: IJobRepository,
    private readonly ttsService: ITTSService,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: GenerateAudioInput): Promise<GenerateAudioOutput> {
    // Validate input
    const { chunkId } = GenerateAudioSchema.parse(input);

    // Retrieve chunk
    const chunk = await this.audioChunkRepository.findById(chunkId);
    if (!chunk) {
      throw ErrorFactory.notFound('AudioChunk', chunkId);
    }

    // Get item to retrieve job
    const item = await this.audioChunkRepository.findById(chunk.itemId);
    if (!item) {
      throw ErrorFactory.notFound('ContentItem', chunk.itemId);
    }

    try {
      // Mark chunk as processing
      chunk.startProcessing();
      await this.audioChunkRepository.save(chunk);

      // Get job for voice settings
      const job = await this.jobRepository.findById(chunk.itemId);
      if (!job) {
        throw ErrorFactory.notFound('Job', 'unknown');
      }

      // Generate audio
      const result = await this.ttsService.textToSpeech({
        text: chunk.text,
        voiceSettings: job.voiceSettings || undefined,
      });

      // Update chunk
      chunk.audioPath = result.audioPath;
      chunk.audioDuration = result.duration;
      chunk.markCompleted();
      await this.audioChunkRepository.save(chunk);

      // Emit event
      await this.eventBus.publish(
        new AudioChunkGeneratedEvent({
          chunkId: chunk.id,
          itemId: chunk.itemId,
          chunkIndex: chunk.chunkIndex,
          duration: result.duration,
          timestamp: new Date(),
        })
      );

      return {
        chunk,
        audioPath: result.audioPath,
        duration: result.duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      chunk.markFailed(errorMessage);
      await this.audioChunkRepository.save(chunk);

      throw ErrorFactory.externalService(
        'TTS',
        errorMessage,
        { chunkId: chunk.id }
      );
    }
  }
}
