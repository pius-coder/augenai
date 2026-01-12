// src/core/domain/use-cases/chat/GetChatHistoryUseCase.ts
// Use case: Retrieve conversation history for a chat session

import { z } from 'zod';
import { ChatMessage } from '../../entities/ChatMessage';
import { IChatMessageRepository } from '@/core/ports/repositories/IChatMessageRepository';
import { IChatSessionRepository } from '@/core/ports/repositories/IChatSessionRepository';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const GetChatHistorySchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export type GetChatHistoryInput = z.infer<typeof GetChatHistorySchema>;

export interface GetChatHistoryOutput {
  messages: ChatMessage[];
  total: number;
}

export class GetChatHistoryUseCase {
  constructor(
    private readonly chatSessionRepository: IChatSessionRepository,
    private readonly chatMessageRepository: IChatMessageRepository
  ) {}

  async execute(input: GetChatHistoryInput): Promise<GetChatHistoryOutput> {
    const validatedInput = GetChatHistorySchema.parse(input);

    const session = await this.chatSessionRepository.findById(validatedInput.sessionId);
    if (!session) {
      throw ErrorFactory.notFound('ChatSession', validatedInput.sessionId);
    }

    const messages = await this.chatMessageRepository.findBySessionId(
      validatedInput.sessionId,
      validatedInput.limit,
      validatedInput.offset
    );

    return {
      messages,
      total: messages.length,
    };
  }
}
