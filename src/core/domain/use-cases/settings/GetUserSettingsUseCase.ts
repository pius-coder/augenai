// src/core/domain/use-cases/settings/GetUserSettingsUseCase.ts
// Use case: Get user settings with defaults

import { IUserSettingsRepository } from '@/core/ports/repositories/IUserSettingsRepository';
import { UserSettings } from '../../entities/UserSettings';
import { VoiceSettings } from '../../value-objects/VoiceSettings';
import { PromptTemplate } from '../../value-objects/PromptTemplate';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface GetUserSettingsInput {
  userId: string;
  includeDefaults?: boolean;
}

export interface GetUserSettingsOutput {
  settings: UserSettings;
  isDefault?: boolean;
}

export class GetUserSettingsUseCase {
  constructor(
    private readonly userSettingsRepository: IUserSettingsRepository
  ) {}

  async execute(input: GetUserSettingsInput): Promise<GetUserSettingsOutput> {
    const { userId, includeDefaults = true } = input;

    // Try to find existing settings
    let settings = await this.userSettingsRepository.findByUserId(userId);
    
    if (!settings && includeDefaults) {
      // Create default settings with system voices
      settings = UserSettings.create({
        userId,
        voiceSettings: VoiceSettings.create({
          voiceId: 'default_voice',
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
        }),
        systemPrompt: 'You are a helpful assistant for audio content generation.',
        userPromptTemplate: PromptTemplate.create('Generate audio for: {{content}}'),
        preferredLanguage: 'en',
        maxChunkSize: 2000,
        silenceBetweenChunks: 500,
      });

      // Save default settings
      await this.userSettingsRepository.save(settings);
    } else if (!settings) {
      throw ErrorFactory.notFound(`User settings for user ${userId} not found`);
    }

    return {
      settings,
      isDefault: !input.includeDefaults && !settings,
    };
  }
}

// Extend UserSettings entity interface
declare module '../../entities/UserSettings' {
  interface UserSettings {
    preferredLanguage?: string;
    maxChunkSize?: number;
    silenceBetweenChunks?: number;
  }
}