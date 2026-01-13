// src/presentation/hooks/settings/useUpdateUserSettings.ts
// Hook for updating user settings

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UpdateUserSettingsUseCase } from '@/core/domain/use-cases/settings/UpdateUserSettingsUseCase';
import { container } from '@/infrastructure/di/Container';

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  const updateUserSettingsUseCase = container.get<UpdateUserSettingsUseCase>('UpdateUserSettingsUseCase');

  const { 
    mutateAsync: updateSettings, 
    isPending: isUpdating, 
    error, 
  } = useMutation({
    mutationFn: async (input: {
      voiceSettings?: {
        defaultVoiceId?: string;
        defaultStability?: number;
        defaultSimilarityBoost?: number;
        defaultStyle?: number;
        defaultUseSpeakerBoost?: boolean;
      };
      textGenerationSettings?: {
        defaultSystemPrompt?: string;
        defaultUserPromptTemplate?: string;
        defaultMaxTokens?: number;
        defaultTemperature?: number;
      };
      chunkingSettings?: {
        defaultMaxChunkSize?: number;
        defaultSilenceBetweenChunks?: number;
      };
      uiPreferences?: {
        theme?: 'light' | 'dark' | 'system';
        language?: string;
        showAdvancedOptions?: boolean;
      };
    }) => {
      // In a real app, you would get the user ID from auth context
      const userId = 'current-user'; // Placeholder
      return await updateUserSettingsUseCase.execute({ 
        userId, 
        ...input 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });

  return {
    updateSettings,
    isUpdating,
    error,
  };
}