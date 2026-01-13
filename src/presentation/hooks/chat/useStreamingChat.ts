// src/presentation/hooks/chat/useStreamingChat.ts
// Hook for streaming chat responses

import { useCallback } from 'react';
import { StreamChatResponseUseCase } from '@/core/domain/use-cases/chat/StreamChatResponseUseCase';
import { container } from '@/infrastructure/di/Container';

export function useStreamingChat() {
  const streamChatResponseUseCase = container.get<StreamChatResponseUseCase>('StreamChatResponseUseCase');

  const streamChatResponse = useCallback(
    async (
      input: {
        sessionId: string;
        messageId: string;
        systemPrompt?: string;
        maxTokens?: number;
        temperature?: number;
      },
      onChunk: (chunk: string) => void
    ) => {
      try {
        await streamChatResponseUseCase.execute(input, onChunk);
      } catch (error) {
        console.error('Streaming chat response failed:', error);
        throw error;
      }
    },
    [streamChatResponseUseCase]
  );

  return {
    streamChatResponse,
  };
}