// src/core/domain/use-cases/chat/CreateChatSessionUseCase.ts
// Use case: Create new chat session

import { z } from 'zod';
import { ChatSession } from '../../entities/ChatSession';
import { IChatSessionRepository } from '@/core/ports/repositories/IChatSessionRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';

const CreateChatSessionSchema = z.object({
  userId: z.string().optional(),
  title: z.string().min(1).max(255).optional(),
  context: z.record(z.any()).optional(),
});

export type CreateChatSessionInput = z.infer<typeof CreateChatSessionSchema>;

export interface CreateChatSessionOutput {
  session: ChatSession;
}

export class CreateChatSessionUseCase {
  constructor(
    private readonly chatSessionRepository: IChatSessionRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: CreateChatSessionInput = {}): Promise<CreateChatSessionOutput> {
    // Validate input
    const validatedInput = CreateChatSessionSchema.parse(input);

    // Create session
    const session = ChatSession.create({
      userId: validatedInput.userId,
      title: validatedInput.title || 'New Chat',
      context: validatedInput.context,
    });

    // Persist session
    await this.chatSessionRepository.save(session);

    return { session };
  }
}
