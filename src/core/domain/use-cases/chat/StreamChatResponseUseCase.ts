// src/core/domain/use-cases/chat/StreamChatResponseUseCase.ts
// Use case: Generate streaming chat response via AI service

import { z } from 'zod';
import { IChatSessionRepository } from '@/core/ports/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '@/core/ports/repositories/IChatMessageRepository';
import { IAIService } from '@/core/ports/services/ai/IAIService';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { ISSEManager } from '@/core/ports/streaming/ISSEManager';
import { ChatResponseStartedEvent } from '../../events/chat/ChatResponseStartedEvent';
import { ChatResponseCompletedEvent } from '../../events/chat/ChatResponseCompletedEvent';
import { ChatSession } from '../../entities/ChatSession';
import { ChatMessage } from '../../entities/ChatMessage';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const StreamChatResponseSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  messageId: z.string().min(1, 'Message ID is required'),
  systemPrompt: z.string().optional(),
  maxTokens: z.number().int().min(10).max(4096).default(2048),
  temperature: z.number().min(0).max(2).default(0.7),
});

export type StreamChatResponseInput = z.infer<typeof StreamChatResponseSchema>;

export interface StreamChatResponseOutput {
  session: ChatSession;
  message: ChatMessage;
  toolCalls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export class StreamChatResponseUseCase {
  constructor(
    private readonly chatSessionRepository: IChatSessionRepository,
    private readonly chatMessageRepository: IChatMessageRepository,
    private readonly aiService: IAIService,
    private readonly eventBus: IEventBus,
    private readonly sseManager: ISSEManager
  ) {}

  async execute(
    input: StreamChatResponseInput,
    onChunk: (chunk: string) => void
  ): Promise<StreamChatResponseOutput> {
    // Validate input
    const validatedInput = StreamChatResponseSchema.parse(input);

    // Find session and message
    const session = await this.chatSessionRepository.findById(validatedInput.sessionId);
    if (!session) {
      throw ErrorFactory.notFound(`Chat session with id ${validatedInput.sessionId} not found`);
    }

    const message = await this.chatMessageRepository.findById(validatedInput.messageId);
    if (!message) {
      throw ErrorFactory.notFound(`Message with id ${validatedInput.messageId} not found`);
    }

    // Emit response started event
    await this.eventBus.publish(
      new ChatResponseStartedEvent({
        sessionId: session.id,
        messageId: message.id,
        timestamp: new Date(),
      })
    );

    // Create assistant message for response
    const assistantMessage = ChatMessage.create({
      sessionId: session.id,
      content: '',
      role: 'assistant',
      createdAt: new Date(),
      isStreaming: true,
    });

    // Save assistant message
    await this.chatMessageRepository.save(assistantMessage);

    // Stream response from AI service
    let fullResponse = '';
    let toolCalls: Array<{
      id: string;
      type: string;
      function: {
        name: string;
        arguments: string;
      };
    }> = [];

    try {
      await this.aiService.streamChatResponse(
        {
          sessionId: session.id,
          messages: [
            {
              role: message.role,
              content: message.content,
            },
          ],
          systemPrompt: validatedInput.systemPrompt,
          maxTokens: validatedInput.maxTokens,
          temperature: validatedInput.temperature,
        },
        async (chunk) => {
          // Accumulate full response
          fullResponse += chunk.content;
          
          // Stream to client via SSE
          onChunk(chunk.content);
          
          // Update assistant message content
          assistantMessage.content = fullResponse;
          await this.chatMessageRepository.save(assistantMessage);
          
          // Handle tool calls
          if (chunk.toolCalls) {
            toolCalls = chunk.toolCalls;
          }
        }
      );

      // Mark message as complete
      assistantMessage.isStreaming = false;
      await this.chatMessageRepository.save(assistantMessage);

      // Update session
      session.updateLastMessageAt(new Date());
      await this.chatSessionRepository.save(session);

      // Emit response completed event
      await this.eventBus.publish(
        new ChatResponseCompletedEvent({
          sessionId: session.id,
          messageId: assistantMessage.id,
          content: fullResponse,
          toolCalls,
          timestamp: new Date(),
        })
      );

      return {
        session,
        message: assistantMessage,
        toolCalls,
      };
    } catch (error) {
      // Clean up on error
      assistantMessage.isStreaming = false;
      assistantMessage.content = fullResponse || 'Error generating response';
      await this.chatMessageRepository.save(assistantMessage);
      
      throw ErrorFactory.aiServiceError('Failed to generate chat response', error);
    }
  }
}