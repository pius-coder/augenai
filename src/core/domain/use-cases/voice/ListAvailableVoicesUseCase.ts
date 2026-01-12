// src/core/domain/use-cases/voice/ListAvailableVoicesUseCase.ts
// Use case: List available voices from TTS provider

import { IVoiceProviderService } from '@/core/ports/services/tts/IVoiceProviderService';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { VoiceSettings } from '../../value-objects/VoiceSettings';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface VoiceInfo {
  id: string;
  name: string;
  language: string;
  gender: string;
  previewUrl?: string;
  supportedStyles?: string[];
  defaultSettings?: VoiceSettings;
}

export interface ListAvailableVoicesInput {
  provider?: string;
  language?: string;
  gender?: string;
  includePreview?: boolean;
}

export interface ListAvailableVoicesOutput {
  success: boolean;
  voices: VoiceInfo[];
  totalCount: number;
  filteredCount: number;
}

export class ListAvailableVoicesUseCase {
  constructor(
    private readonly voiceProviderService: IVoiceProviderService,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: ListAvailableVoicesInput): Promise<ListAvailableVoicesOutput> {
    const { language, gender, includePreview = false } = input;

    try {
      // Get voices from voice provider service
      const voices = await this.voiceProviderService.listVoices({
        language,
        gender,
        includePreview,
      });

      // Emit voices listed event
      await this.eventBus.publish({
        type: 'voices.listed',
        data: {
          totalCount: voices.length,
          filteredCount: voices.length,
          language,
          gender,
          timestamp: new Date(),
        },
      });

      return {
        success: true,
        voices: voices.map(voice => ({
          id: voice.id,
          name: voice.name,
          language: voice.language || 'en-US',
          gender: voice.gender || 'neutral',
          previewUrl: voice.previewUrl,
          supportedStyles: voice.supportedStyles || ['neutral', 'cheerful', 'sad'],
          defaultSettings: VoiceSettings.create({
            voiceId: voice.id,
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
          }),
        })),
        totalCount: voices.length,
        filteredCount: voices.length,
      };
    } catch (error) {
      throw ErrorFactory.apiError(
        'voice.list',
        `Failed to list available voices: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}