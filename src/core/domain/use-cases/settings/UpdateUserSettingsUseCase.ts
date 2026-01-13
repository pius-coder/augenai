// src/core/domain/use-cases/settings/UpdateUserSettingsUseCase.ts
// Use case: Update user settings

import { z } from 'zod';
import { IUserSettingsRepository } from '@/core/ports/repositories/IUserSettingsRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { UserSettingsUpdatedEvent } from '../../events/settings/UserSettingsUpdatedEvent';
import { UserSettings } from '../../entities/UserSettings';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const UpdateUserSettingsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  voiceSettings: z.object({
    defaultVoiceId: z.string().optional(),
    defaultStability: z.number().min(0).max(1).optional(),
    defaultSimilarityBoost: z.number().min(0).max(1).optional(),
    defaultStyle: z.number().min(0).max(1).optional(),
    defaultUseSpeakerBoost: z.boolean().optional(),
  }).optional(),
  textGenerationSettings: z.object({
    defaultSystemPrompt: z.string().optional(),
    defaultUserPromptTemplate: z.string().optional(),
    defaultMaxTokens: z.number().int().min(10).max(4096).optional(),
    defaultTemperature: z.number().min(0).max(2).optional(),
  }).optional(),
  chunkingSettings: z.object({
    defaultMaxChunkSize: z.number().int().min(100).max(5000).optional(),
    defaultSilenceBetweenChunks: z.number().int().min(0).max(5000).optional(),
  }).optional(),
  uiPreferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().optional(),
    showAdvancedOptions: z.boolean().optional(),
  }).optional(),
});

export type UpdateUserSettingsInput = z.infer<typeof UpdateUserSettingsSchema>;

export interface UpdateUserSettingsOutput {
  settings: UserSettings;
}

export class UpdateUserSettingsUseCase {
  constructor(
    private readonly userSettingsRepository: IUserSettingsRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: UpdateUserSettingsInput): Promise<UpdateUserSettingsOutput> {
    // Validate input
    const validatedInput = UpdateUserSettingsSchema.parse(input);

    // Find or create user settings
    let settings = await this.userSettingsRepository.findByUserId(validatedInput.userId);
    if (!settings) {
      settings = UserSettings.create({
        userId: validatedInput.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Update settings based on input
    if (validatedInput.voiceSettings) {
      if (validatedInput.voiceSettings.defaultVoiceId) {
        settings.defaultVoiceId = validatedInput.voiceSettings.defaultVoiceId;
      }
      if (validatedInput.voiceSettings.defaultStability !== undefined) {
        settings.defaultStability = validatedInput.voiceSettings.defaultStability;
      }
      if (validatedInput.voiceSettings.defaultSimilarityBoost !== undefined) {
        settings.defaultSimilarityBoost = validatedInput.voiceSettings.defaultSimilarityBoost;
      }
      if (validatedInput.voiceSettings.defaultStyle !== undefined) {
        settings.defaultStyle = validatedInput.voiceSettings.defaultStyle;
      }
      if (validatedInput.voiceSettings.defaultUseSpeakerBoost !== undefined) {
        settings.defaultUseSpeakerBoost = validatedInput.voiceSettings.defaultUseSpeakerBoost;
      }
    }

    if (validatedInput.textGenerationSettings) {
      if (validatedInput.textGenerationSettings.defaultSystemPrompt) {
        settings.defaultSystemPrompt = validatedInput.textGenerationSettings.defaultSystemPrompt;
      }
      if (validatedInput.textGenerationSettings.defaultUserPromptTemplate) {
        settings.defaultUserPromptTemplate = validatedInput.textGenerationSettings.defaultUserPromptTemplate;
      }
      if (validatedInput.textGenerationSettings.defaultMaxTokens !== undefined) {
        settings.defaultMaxTokens = validatedInput.textGenerationSettings.defaultMaxTokens;
      }
      if (validatedInput.textGenerationSettings.defaultTemperature !== undefined) {
        settings.defaultTemperature = validatedInput.textGenerationSettings.defaultTemperature;
      }
    }

    if (validatedInput.chunkingSettings) {
      if (validatedInput.chunkingSettings.defaultMaxChunkSize !== undefined) {
        settings.defaultMaxChunkSize = validatedInput.chunkingSettings.defaultMaxChunkSize;
      }
      if (validatedInput.chunkingSettings.defaultSilenceBetweenChunks !== undefined) {
        settings.defaultSilenceBetweenChunks = validatedInput.chunkingSettings.defaultSilenceBetweenChunks;
      }
    }

    if (validatedInput.uiPreferences) {
      if (validatedInput.uiPreferences.theme) {
        settings.theme = validatedInput.uiPreferences.theme;
      }
      if (validatedInput.uiPreferences.language) {
        settings.language = validatedInput.uiPreferences.language;
      }
      if (validatedInput.uiPreferences.showAdvancedOptions !== undefined) {
        settings.showAdvancedOptions = validatedInput.uiPreferences.showAdvancedOptions;
      }
    }

    // Update timestamp
    settings.updatedAt = new Date();

    // Save settings
    await this.userSettingsRepository.save(settings);

    // Emit event
    await this.eventBus.publish(
      new UserSettingsUpdatedEvent({
        userId: validatedInput.userId,
        settings: {
          voiceSettings: settings.getVoiceSettings(),
          textGenerationSettings: settings.getTextGenerationSettings(),
          chunkingSettings: settings.getChunkingSettings(),
          uiPreferences: settings.getUiPreferences(),
        },
        timestamp: new Date(),
      })
    );

    return {
      settings,
    };
  }
}