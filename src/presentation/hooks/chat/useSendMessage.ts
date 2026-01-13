// src/presentation/hooks/chat/useSendMessage.ts
// Hook for sending chat messages

import { useMutation } from '@tanstack/react-query';
import { SendMessageUseCase } from '@/core/domain/use-cases/chat/SendMessageUseCase';
import { container } from '@/infrastructure/di/Container';

export function useSendMessage() {
  const sendMessageUseCase = container.get<SendMessageUseCase>('SendMessageUseCase');

  const { 
    mutateAsync: sendMessage, 
    isPending: isSending, 
    error, 
  } = useMutation({
    mutationFn: async (input: {
      sessionId: string;
      content: string;
      role?: 'user' | 'assistant' | 'system';
      metadata?: Record<string, any>;
    }) => {
      return await sendMessageUseCase.execute(input);
    },
  });

  return {
    sendMessage,
    isSending,
    error,
  };
}