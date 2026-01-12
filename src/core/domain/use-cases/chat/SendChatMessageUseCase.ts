// src/core/domain/use-cases/chat/SendChatMessageUseCase.ts
// Use case: Process chat message and get AI response

import { z } from 'zod';
import { ChatMessage } from '../../entities/ChatMessage';
import { IChatSessionRepository } from '@/core/ports/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '@/core/ports/repositories/IChatMessageRepository';
import { IChatService } from '@/core/ports/services/ai/IChatService';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const SendChatMessageSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  content: z.string().min(1, 'Message content is required'),
  role: z.enum(['user', 'assistant', 'system']).optional().default('user'),
});

export type SendChatMessageInput = z.infer<typeof SendChatMessageSchema>;

export interface SendChatMessageOutput {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

export class SendChatMessageUseCase {
  constructor(
    private readonly chatSessionRepository: IChatSessionRepository,
    private readonly chatMessageRepository: IChatMessageRepository,
    private readonly chatService: IChatService
  ) {}

  async execute(input: SendChatMessageInput): Promise<SendChatMessageOutput> {
    const { sessionId, content, role } = SendChatMessageSchema.parse(input);

    const session = await this.chatSessionRepository.findById(sessionId);
    if (!session) {
      throw ErrorFactory.notFound('ChatSession', sessionId);
    }

    const userMessage = ChatMessage.create({
      sessionId,
      role,
      content,
    });

    await this.chatMessageRepository.save(userMessage);

    const history = await this.chatMessageRepository.findBySessionId(sessionId);

    const response = await this.chatService.chat({
      messages: history.map(m => ({ role: m.role, content: m.content })),
      options: { maxTokens: 2000, temperature: 0.7 },
    });

    const assistantMessage = ChatMessage.create({
      sessionId,
      role: 'assistant',
      content: response.message,
    });

    await this.chatMessageRepository.save(assistantMessage);
    session.incrementMessageCount();
    await this.chatSessionRepository.save(session);

    return { userMessage, assistantMessage };
  }
}
