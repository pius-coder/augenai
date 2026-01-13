// src/presentation/hooks/settings/useUserSettings.ts
// Hook for fetching user settings

import { useQuery } from '@tanstack/react-query';
import { GetUserSettingsUseCase } from '@/core/domain/use-cases/settings/GetUserSettingsUseCase';
import { container } from '@/infrastructure/di/Container';
import { UserSettings } from '@/core/domain/entities/UserSettings';

export function useUserSettings() {
  const getUserSettingsUseCase = container.get<GetUserSettingsUseCase>('GetUserSettingsUseCase');

  const { 
    data: settings, 
    isLoading, 
    error, 
    refetch, 
  } = useQuery<UserSettings, Error>({
    queryKey: ['userSettings'],
    queryFn: async () => {
      // In a real app, you would get the user ID from auth context
      const userId = 'current-user'; // Placeholder
      const result = await getUserSettingsUseCase.execute({ userId });
      return result.settings;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    settings,
    isLoading,
    error,
    refetch,
  };
}