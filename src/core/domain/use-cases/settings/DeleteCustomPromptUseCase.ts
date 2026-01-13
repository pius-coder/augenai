// src/core/domain/use-cases/settings/DeleteCustomPromptUseCase.ts
// Use case: Delete a custom prompt

import { z } from 'zod';
import { IUserSettingsRepository } from '@/core/ports/repositories/IUserSettingsRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { CustomPromptDeletedEvent } from '../../events/settings/CustomPromptDeletedEvent';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const DeleteCustomPromptSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  promptId: z.string().min(1, 'Prompt ID is required'),
});

export type DeleteCustomPromptInput = z.infer<typeof DeleteCustomPromptSchema>;

export interface DeleteCustomPromptOutput {
  success: boolean;
  deletedPromptId: string;
}

export class DeleteCustomPromptUseCase {
  constructor(
    private readonly userSettingsRepository: IUserSettingsRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: DeleteCustomPromptInput): Promise<DeleteCustomPromptOutput> {
    // Validate input
    const validatedInput = DeleteCustomPromptSchema.parse(input);

    // Find user settings
    const settings = await this.userSettingsRepository.findByUserId(validatedInput.userId);
    if (!settings) {
      throw ErrorFactory.notFound(`User settings for user ${validatedInput.userId} not found`);
    }

    // Check if prompt exists
    const promptIndex = settings.customPrompts.findIndex(
      (prompt) => prompt.id === validatedInput.promptId
    );

    if (promptIndex === -1) {
      throw ErrorFactory.notFound(`Custom prompt with id ${validatedInput.promptId} not found`);
    }

    // Remove the prompt
    const deletedPrompt = settings.customPrompts[promptIndex];
    settings.customPrompts.splice(promptIndex, 1);

    // Save updated settings
    await this.userSettingsRepository.save(settings);

    // Emit event
    await this.eventBus.publish(
      new CustomPromptDeletedEvent({
        userId: validatedInput.userId,
        promptId: validatedInput.promptId,
        promptName: deletedPrompt.name,
        timestamp: new Date(),
      })
    );

    return {
      success: true,
      deletedPromptId: validatedInput.promptId,
    };
  }
}