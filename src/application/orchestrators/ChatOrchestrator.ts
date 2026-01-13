// src/application/orchestrators/ChatOrchestrator.ts
// Orchestrator: Coordinate chat workflows and tool execution

import { IChatSessionRepository } from '@/core/ports/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '@/core/ports/repositories/IChatMessageRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { ChatMessageCreatedEvent } from '@/core/domain/events/chat/ChatMessageCreatedEvent';
import { ChatResponseCompletedEvent } from '@/core/domain/events/chat/ChatResponseCompletedEvent';
import { ToolCallDetectedEvent } from '@/core/domain/events/chat/ToolCallDetectedEvent';
import { ExecuteToolCallUseCase } from '@/core/domain/use-cases/chat/ExecuteToolCallUseCase';
import { ChatSession } from '@/core/domain/entities/ChatSession';
import { ChatMessage } from '@/core/domain/entities/ChatMessage';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export class ChatOrchestrator {
  constructor(
    private readonly chatSessionRepository: IChatSessionRepository,
    private readonly chatMessageRepository: IChatMessageRepository,
    private readonly eventBus: IEventBus,
    private readonly executeToolCallUseCase: ExecuteToolCallUseCase
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for chat response completed events
    this.eventBus.subscribe(ChatResponseCompletedEvent.name, async (event: ChatResponseCompletedEvent) => {
      await this.handleChatResponseCompleted(event);
    });

    // Listen for tool call detected events
    this.eventBus.subscribe(ToolCallDetectedEvent.name, async (event: ToolCallDetectedEvent) => {
      await this.handleToolCallDetected(event);
    });
  }

  private async handleChatResponseCompleted(event: ChatResponseCompletedEvent): Promise<void> {
    const { sessionId, messageId, toolCalls } = event;

    try {
      // If there are tool calls, execute them
      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          await this.eventBus.publish(
            new ToolCallDetectedEvent({
              sessionId,
              messageId,
              toolCall,
              timestamp: new Date(),
            })
          );
        }
      }

    } catch (error) {
      console.error(`Failed to handle chat response completed for session ${sessionId}:`, error);
    }
  }

  private async handleToolCallDetected(event: ToolCallDetectedEvent): Promise<void> {
    const { sessionId, messageId, toolCall } = event;

    try {
      // Execute the tool call
      const result = await this.executeToolCallUseCase.execute({
        sessionId,
        messageId,
        toolCall,
      });

      // Add tool call result as a system message
      const toolCallMessage = ChatMessage.create({
        sessionId,
        content: `Tool call executed: ${toolCall.function.name}\nResult: ${JSON.stringify(result, null, 2)}`,
        role: 'system',
        createdAt: new Date(),
        metadata: {
          toolCallId: toolCall.id,
          toolCallName: toolCall.function.name,
        },
      });

      await this.chatMessageRepository.save(toolCallMessage);

    } catch (error) {
      console.error(`Failed to execute tool call ${toolCall.id}:`, error);

      // Add error message
      const errorMessage = ChatMessage.create({
        sessionId,
        content: `Failed to execute tool call ${toolCall.function.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        role: 'system',
        createdAt: new Date(),
        metadata: {
          toolCallId: toolCall.id,
          toolCallName: toolCall.function.name,
          isError: true,
        },
      });

      await this.chatMessageRepository.save(errorMessage);
    }
  }

  public async createNewSession(userId: string, initialMessage?: string): Promise<ChatSession> {
    try {
      // Create new session
      const session = ChatSession.create({
        id: `session-${Date.now()}`,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.chatSessionRepository.save(session);

      // Add initial message if provided
      if (initialMessage) {
        const message = ChatMessage.create({
          sessionId: session.id,
          content: initialMessage,
          role: 'system',
          createdAt: new Date(),
        });

        await this.chatMessageRepository.save(message);
      }

      return session;

    } catch (error) {
      console.error(`Failed to create new chat session for user ${userId}:`, error);
      throw ErrorFactory.chatError('Failed to create chat session', error);
    }
  }

  public async getSessionHistory(sessionId: string): Promise<{
    session: ChatSession;
    messages: ChatMessage[];
  }> {
    try {
      // Get session
      const session = await this.chatSessionRepository.findById(sessionId);
      if (!session) {
        throw ErrorFactory.notFound(`Chat session with id ${sessionId} not found`);
      }

      // Get messages
      const messages = await this.chatMessageRepository.findBySessionId(sessionId);

      return { session, messages };

    } catch (error) {
      console.error(`Failed to get session history for session ${sessionId}:`, error);
      throw error;
    }
  }

  public async cleanupOldSessions(maxAgeDays: number = 30): Promise<number> {
    try {
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

      // Find old sessions
      const oldSessions = await this.chatSessionRepository.findOldSessions(cutoffDate);

      // Delete old sessions and their messages
      let deletedCount = 0;
      for (const session of oldSessions) {
        await this.chatMessageRepository.deleteBySessionId(session.id);
        await this.chatSessionRepository.delete(session.id);
        deletedCount++;
      }

      return deletedCount;

    } catch (error) {
      console.error('Failed to cleanup old chat sessions:', error);
      throw ErrorFactory.chatError('Failed to cleanup old sessions', error);
    }
  }
}