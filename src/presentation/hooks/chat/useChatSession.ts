// src/presentation/hooks/chat/useChatSession.ts
// Hook for managing chat sessions

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateChatSessionUseCase } from '@/core/domain/use-cases/chat/CreateChatSessionUseCase';
import { GetChatHistoryUseCase } from '@/core/domain/use-cases/chat/GetChatHistoryUseCase';
import { container } from '@/infrastructure/di/Container';
import { ChatSession } from '@/core/domain/entities/ChatSession';
import { ChatMessage } from '@/core/domain/entities/ChatMessage';

export function useChatSession(sessionId: string) {
  const queryClient = useQueryClient();
  const createChatSessionUseCase = container.get<CreateChatSessionUseCase>('CreateChatSessionUseCase');
  const getChatHistoryUseCase = container.get<GetChatHistoryUseCase>('GetChatHistoryUseCase');

  const { 
    data: sessionData, 
    isLoading, 
    error, 
  } = useQuery<{ session: ChatSession; messages: ChatMessage[] }, Error>({
    queryKey: ['chatSession', sessionId],
    queryFn: async () => {
      // Try to get existing session
      try {
        return await getChatHistoryUseCase.execute({ sessionId });
      } catch (getError) {
        // If session doesn't exist, create a new one
        if (getError instanceof Error && getError.message.includes('not found')) {
          const newSession = await createChatSessionUseCase.execute({ 
            sessionId, 
            initialMessage: 'Hello! How can I help you with your audio generation tasks?'
          });
          return {
            session: newSession.session,
            messages: newSession.messages,
          };
        }
        throw getError;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createSession = useMutation({
    mutationFn: async (initialMessage?: string) => {
      return await createChatSessionUseCase.execute({ 
        sessionId, 
        initialMessage
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['chatSession', sessionId], data);
    },
  });

  return {
    session: sessionData?.session,
    messages: sessionData?.messages || [],
    isLoading,
    error,
    createSession,
  };
}