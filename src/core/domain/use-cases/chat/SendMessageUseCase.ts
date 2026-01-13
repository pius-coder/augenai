// src/core/domain/use-cases/chat/SendMessageUseCase.ts
// Use case: Send a chat message and trigger response generation

import { z } from 'zod';
import { IChatSessionRepository } from '@/core/ports/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '@/core/ports/repositories/IChatMessageRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { ChatMessageCreatedEvent } from '../../events/chat/ChatMessageCreatedEvent';
import { ChatSession } from '../../entities/ChatSession';
import { ChatMessage } from '../../entities/ChatMessage';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const SendMessageSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  content: z.string().min(1, 'Message content is required'),
  role: z.enum(['user', 'assistant', 'system']).default('user'),
  metadata: z.record(z.any()).optional(),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export interface SendMessageOutput {
  session: ChatSession;
  message: ChatMessage;
  responseTriggered: boolean;
}

export class SendMessageUseCase {
  constructor(
    private readonly chatSessionRepository: IChatSessionRepository,
    private readonly chatMessageRepository: IChatMessageRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: SendMessageInput): Promise<SendMessageOutput> {
    // Validate input
    const validatedInput = SendMessageSchema.parse(input);

    // Find or create chat session
    let session = await this.chatSessionRepository.findById(validatedInput.sessionId);
    if (!session) {
      session = ChatSession.create({
        id: validatedInput.sessionId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await this.chatSessionRepository.save(session);
    }

    // Create message entity
    const message = ChatMessage.create({
      sessionId: session.id,
      content: validatedInput.content,
      role: validatedInput.role,
      metadata: validatedInput.metadata,
      createdAt: new Date(),
    });

    // Save message
    await this.chatMessageRepository.save(message);

    // Update session
    session.updateLastMessageAt(new Date());
    await this.chatSessionRepository.save(session);

    // Emit message created event
    await this.eventBus.publish(
      new ChatMessageCreatedEvent({
        sessionId: session.id,
        messageId: message.id,
        content: message.content,
        role: message.role,
        timestamp: new Date(),
      })
    );

    // Trigger response generation for user messages
    const responseTriggered = validatedInput.role === 'user';

    return {
      session,
      message,
      responseTriggered,
    };
  }
}