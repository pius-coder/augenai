// src/core/domain/value-objects/VoiceSettings.ts
// Voice configuration (voiceId, stability, etc.)
// Imported by Job entity

import { ValidationError } from '@/shared/utils/errors/AppError';

export interface VoiceSettingsData {
  voiceId: string;
  voiceName?: string;
  stability?: number;
  similarityBoost?: number;
  speed?: number;
}

export class VoiceSettings {
  private constructor(
    public readonly voiceId: string,
    public readonly voiceName: string,
    public readonly stability: number,
    public readonly similarityBoost: number,
    public readonly speed: number
  ) {}

  static create(data: VoiceSettingsData): VoiceSettings {
    this.validate(data);

    return new VoiceSettings(
      data.voiceId,
      data.voiceName || 'Unknown Voice',
      data.stability ?? 0.5,
      data.similarityBoost ?? 0.75,
      data.speed ?? 1.0
    );
  }

  static default(): VoiceSettings {
    return new VoiceSettings(
      'default',
      'Default Voice',
      0.5,
      0.75,
      1.0
    );
  }

  private static validate(data: VoiceSettingsData): void {
    if (!data.voiceId || data.voiceId.trim().length === 0) {
      throw new ValidationError('Voice ID is required');
    }

    if (data.stability !== undefined && (data.stability < 0 || data.stability > 1)) {
      throw new ValidationError('Stability must be between 0 and 1');
    }

    if (data.similarityBoost !== undefined && (data.similarityBoost < 0 || data.similarityBoost > 1)) {
      throw new ValidationError('Similarity boost must be between 0 and 1');
    }

    if (data.speed !== undefined && (data.speed < 0.25 || data.speed > 4.0)) {
      throw new ValidationError('Speed must be between 0.25 and 4.0');
    }
  }

  public withVoiceId(voiceId: string): VoiceSettings {
    return new VoiceSettings(
      voiceId,
      this.voiceName,
      this.stability,
      this.similarityBoost,
      this.speed
    );
  }

  public withStability(stability: number): VoiceSettings {
    if (stability < 0 || stability > 1) {
      throw new ValidationError('Stability must be between 0 and 1');
    }
    return new VoiceSettings(
      this.voiceId,
      this.voiceName,
      stability,
      this.similarityBoost,
      this.speed
    );
  }

  public withSpeed(speed: number): VoiceSettings {
    if (speed < 0.25 || speed > 4.0) {
      throw new ValidationError('Speed must be between 0.25 and 4.0');
    }
    return new VoiceSettings(
      this.voiceId,
      this.voiceName,
      this.stability,
      this.similarityBoost,
      speed
    );
  }

  public toJSON() {
    return {
      voiceId: this.voiceId,
      voiceName: this.voiceName,
      stability: this.stability,
      similarityBoost: this.similarityBoost,
      speed: this.speed,
    };
  }
}
