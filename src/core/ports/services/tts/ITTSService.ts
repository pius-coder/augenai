// src/core/ports/services/tts/ITTSService.ts
// Text-to-speech (TTS) port

import type { VoiceSettings } from '../../../domain/value-objects/VoiceSettings';

export interface TTSOptions {
  outputFormat?: string;
}

export interface TTSResult {
  audio: Buffer;
  contentType?: string;
}

export interface ITTSService {
  generateAudio(text: string, voiceSettings: VoiceSettings, options?: TTSOptions): Promise<TTSResult>;
}
