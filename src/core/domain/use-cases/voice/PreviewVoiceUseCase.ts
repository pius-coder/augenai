// src/core/domain/use-cases/voice/PreviewVoiceUseCase.ts
// Use case: Generate a voice preview (short audio sample) with specified settings

import { ITTSService } from '@/core/ports/services/tts/ITTSService';
import { IStorageService } from '@/core/ports/services/storage/IStorageService';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { VoiceSettings } from '../../value-objects/VoiceSettings';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface PreviewVoiceInput {
  voiceId: string;
  text: string;
  settings?: Partial<VoiceSettings>;
  previewFormat?: 'mp3' | 'wav' | 'ogg';
}

export interface PreviewVoiceOutput {
  success: boolean;
  voiceId: string;
  previewUrl: string;
  duration: number;
  text: string;
  settings: VoiceSettings;
}

export class PreviewVoiceUseCase {
  constructor(
    private readonly ttsService: ITTSService,
    private readonly storageService: IStorageService,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: PreviewVoiceInput): Promise<PreviewVoiceOutput> {
    const { voiceId, text, settings = {}, previewFormat = 'mp3' } = input;

    // Validate inputs
    if (!voiceId || voiceId.trim().length === 0) {
      throw ErrorFactory.validationError('Voice ID is required');
    }
    
    if (!text || text.trim().length === 0) {
      throw ErrorFactory.validationError('Preview text is required');
    }
    
    // Ensure text is not too long for preview (limit to ~100 characters)
    const previewText = text.length > 100 ? text.substring(0, 97) + '...' : text;

    // Create voice settings with defaults
    const voiceSettings = VoiceSettings.create({
      voiceId,
      stability: settings.stability ?? 0.5,
      similarityBoost: settings.similarityBoost ?? 0.75,
      style: settings.style ?? 0.0,
      useSpeakerBoost: settings.useSpeakerBoost ?? true,
    });

    try {
      // Generate audio preview using TTS service
      const audioBuffer = await this.ttsService.generateSpeech({
        text: previewText,
        voiceId: voiceSettings.voiceId,
        stability: voiceSettings.stability,
        similarityBoost: voiceSettings.similarityBoost,
        style: voiceSettings.style,
        useSpeakerBoost: voiceSettings.useSpeakerBoost,
      });

      // Generate unique filename
      const fileName = `preview_${voiceId}_${Date.now()}.${previewFormat}`;
      
      // Convert buffer if needed (simplified - assumes TTS returns correct format)
      const processedBuffer = await this.processAudioFormat(audioBuffer, previewFormat);

      // Upload preview to storage
      const previewUrl = await this.storageService.uploadFile(
        fileName,
        processedBuffer,
        {
          contentType: `audio/${previewFormat}`,
          metadata: {
            voiceId,
            isPreview: true,
            text: previewText,
            // Store voice settings as metadata
            settings: {
              stability: voiceSettings.stability,
              similarityBoost: voiceSettings.similarityBoost,
              style: voiceSettings.style,
              useSpeakerBoost: voiceSettings.useSpeakerBoost,
            },
          },
        }
      );

      // Estimate duration based on text length
      const duration = this.estimateDuration(previewText);

      // Emit voice preview generated event
      await this.eventBus.publish({
        type: 'voice.preview.generated',
        data: {
          voiceId,
          previewUrl,
          duration,
          text: previewText,
          settings: voiceSettings,
          timestamp: new Date(),
        },
      });

      return {
        success: true,
        voiceId,
        previewUrl,
        duration,
        text: previewText,
        settings: voiceSettings,
      };
    } catch (error) {
      throw ErrorFactory.audioProcessingError(
        'voice.preview.generation',
        `Failed to generate voice preview: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private estimateDuration(text: string): number {
    // Estimate: ~150 words per minute, average 5 characters per word
    const wordCount = text.length / 5;
    return Math.ceil((wordCount / 150) * 60);
  }

  private async processAudioFormat(buffer: Buffer, format: string): Promise<Buffer> {
    // In a real implementation, this would use FFmpeg or similar to convert formats
    // For this implementation, we assume the TTS service returns the correct format
    return buffer;
  }
}