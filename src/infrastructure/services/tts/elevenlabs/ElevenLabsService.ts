// src/infrastructure/services/tts/elevenlabs/ElevenLabsService.ts
// ElevenLabs TTS service implementation

import { ITTSService, TTSOptions, TTSResult } from '@/core/ports/services/tts/ITTSService';
import { VoiceSettings } from '@/core/domain/value-objects/VoiceSettings';
import { APIError, RateLimitError, ValidationError } from '@/shared/utils/errors/AppError';

export class ElevenLabsService implements ITTSService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      throw new ValidationError('ELEVENLABS_API_KEY is not configured');
    }
  }

  async generateAudio(
    text: string,
    voiceSettings: VoiceSettings,
    options?: TTSOptions
  ): Promise<TTSResult> {
    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        throw new ValidationError('Text cannot be empty');
      }

      if (!voiceSettings || !voiceSettings.voiceId) {
        throw new ValidationError('Voice settings and voice ID are required');
      }

      const modelId = 'eleven_multilingual_v2';
      const outputFormat = options?.outputFormat || 'mp3_44100_128';

      const requestBody = {
        text: text.trim(),
        model_id: modelId,
        voice_settings: {
          stability: voiceSettings.stability,
          similarity_boost: voiceSettings.similarityBoost,
          style: 0,
          use_speaker_boost: true,
        },
      };

      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceSettings.voiceId}?output_format=${outputFormat}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        await this.handleError(response);
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      return {
        audio: buffer,
        contentType: 'audio/mpeg',
      };
    } catch (error) {
      if (error instanceof APIError || error instanceof RateLimitError) {
        throw error;
      }
      throw new APIError('ElevenLabs', `Failed to generate audio: ${error}`);
    }
  }

  private async handleError(response: Response): Promise<never> {
    const status = response.status;

    if (status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError(
        'ElevenLabs',
        retryAfter ? parseInt(retryAfter, 10) : undefined
      );
    }

    if (status === 401) {
      throw new APIError('ElevenLabs', 'Invalid API key');
    }

    if (status === 404) {
      throw new APIError('ElevenLabs', 'Voice not found');
    }

    if (status >= 400 && status < 500) {
      const error = await response.json().catch(() => ({}));
      throw new APIError('ElevenLabs', error.detail?.message || error.message || 'API error');
    }

    throw new APIError('ElevenLabs', `Unexpected error: ${status}`);
  }
}
