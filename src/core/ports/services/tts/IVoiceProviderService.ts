// src/core/ports/services/tts/IVoiceProviderService.ts
// Voice catalog/availability port

export interface VoiceInfo {
  id: string;
  name: string;
  description?: string;
  language?: string;
  gender?: string;
  previewUrl?: string;
  provider?: string;
}

export interface IVoiceProviderService {
  listVoices(): Promise<VoiceInfo[]>;
  getVoice(voiceId: string): Promise<VoiceInfo | null>;
  isVoiceAvailable(voiceId: string): Promise<boolean>;
}
