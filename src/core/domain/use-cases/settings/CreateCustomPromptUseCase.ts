// src/core/domain/use-cases/settings/CreateCustomPromptUseCase.ts
// Use case: Create a user-defined custom prompt template

import { z } from 'zod';
import { IUserSettingsRepository } from '@/core/ports/repositories/IUserSettingsRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { PromptTemplate } from '../../value-objects/PromptTemplate';
import { UserSettings } from '../../entities/UserSettings';
import ErrorFactory from '@/shared/utils/errors/AppError';

const CreateCustomPromptSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  promptName: z.string().min(1, 'Prompt name is required').max(100, 'Prompt name too long'),
  promptTemplate: z.string().min(1, 'Prompt template is required'),
  description: z.string().optional(),
  category: z.enum(['system', 'user', 'assistant']).default('user'),
  isActive: z.boolean().default(true),
});

export type CreateCustomPromptInput = z.infer<typeof CreateCustomPromptSchema>;

export interface CreateCustomPromptOutput {
  success: boolean;
  promptId: string;
  promptName: string;
  userId: string;
  settings: UserSettings;
}

export class CreateCustomPromptUseCase {
  constructor(
    private readonly userSettingsRepository: IUserSettingsRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: CreateCustomPromptInput): Promise<CreateCustomPromptOutput> {
    // Validate input using Zod
    const validatedInput = CreateCustomPromptSchema.parse(input);
    const {
      userId,
      promptName,
      promptTemplate,
      description,
      category,
      isActive,
    } = validatedInput;

    // Get or create user settings
    let settings = await this.userSettingsRepository.findByUserId(userId);
    if (!settings) {
      settings = await this.createDefaultSettings(userId);
    }

    // Validate and create prompt template
    const template = PromptTemplate.create(promptTemplate);
    if (!template.validate()) {
      throw ErrorFactory.validationError('Invalid prompt template format - must use {{variable}} syntax');
    }

    // Check for duplicate prompt names
    const existingPrompts = settings.customPrompts || [];
    const duplicatePrompt = existingPrompts.find(p => p.name === promptName);
    if (duplicatePrompt) {
      throw ErrorFactory.duplicateResource('prompt.name', `Prompt with name "${promptName}" already exists`);
    }

    // Create new custom prompt
    const promptId = `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPrompt = {
      id: promptId,
      name: promptName,
      template: promptTemplate,
      description: description || '',
      category,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
    };

    // Add prompt to settings
    if (!settings.customPrompts) {
      settings.customPrompts = [];
    }
    settings.customPrompts.push(newPrompt);

    // Save updated settings
    await this.userSettingsRepository.save(settings);

    // Emit event
    await this.eventBus.publish({
      type: 'custom.prompt.created',
      data: {
        userId,
        promptId,
        promptName,
        category,
        timestamp: new Date(),
      },
    });

    return {
      success: true,
      promptId,
      promptName,
      userId,
      settings,
    };
  }

  private async createDefaultSettings(userId: string): Promise<UserSettings> {
    const settings = UserSettings.create({
      userId,
      voiceSettings: {
        voiceId: 'default',
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0.0,
        useSpeakerBoost: true,
      },
      systemPrompt: 'You are a helpful AI assistant.',
      userPromptTemplate: 'Generate content for: {{input}}',
    });

    // Note: createDefaultSettings implementation would need access to UserSettings entity
    // For now, we'll return a placeholder - in real implementation, this would be:
    // return UserSettings.create({ ... });
    return settings;
  }
}

// Extend interfaces
declare module '@/core/ports/repositories/IUserSettingsRepository' {
  interface IUserSettingsRepository {
    findByUserId(userId: string): Promise<any>;
    save(settings: any): Promise<void>;
  }
}

declare module '../../entities/UserSettings' {
  interface UserSettings {
    customPrompts?: Array<{
      id: string;
      name: string;
      template: string;
      description: string;
      category: 'system' | 'user' | 'assistant';
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      usageCount: number;
    }>;
  }
}