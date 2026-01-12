// src/core/domain/use-cases/chat/ExecuteToolCallUseCase.ts
// Use case: Execute a tool call requested by the AI

import { IChatService } from '@/core/ports/services/ai/IChatService';
import { IEventBus } from '@/core/ports/events/IEventBus';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ExecuteToolCallInput {
  toolCall: ToolCall;
  sessionId?: string;
  context?: Record<string, any>;
}

export interface ExecuteToolCallOutput {
  success: boolean;
  toolCallId: string;
  toolName: string;
  result: any;
  error?: string;
}

export class ExecuteToolCallUseCase {
  constructor(
    private readonly chatService: IChatService,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: ExecuteToolCallInput): Promise<ExecuteToolCallOutput> {
    const { toolCall, sessionId, context = {} } = input;
    const { id: toolCallId, name: toolName, arguments: args } = toolCall;

    try {
      // Log tool execution
      await this.eventBus.publish({
        type: 'tool.execution.started',
        data: {
          toolCallId,
          toolName,
          arguments: args,
          sessionId,
          timestamp: new Date(),
        },
      });

      // Execute the tool
      const result = await this.chatService.executeTool(toolName, args, context);

      // Log successful completion
      await this.eventBus.publish({
        type: 'tool.execution.completed',
        data: {
          toolCallId,
          toolName,
          success: true,
          result,
          sessionId,
          timestamp: new Date(),
        },
      });

      return {
        success: true,
        toolCallId,
        toolName,
        result,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failure
      await this.eventBus.publish({
        type: 'tool.execution.failed',
        data: {
          toolCallId,
          toolName,
          success: false,
          error: errorMessage,
          sessionId,
          timestamp: new Date(),
        },
      });

      return {
        success: false,
        toolCallId,
        toolName,
        result: null,
        error: errorMessage,
      };
    }
  }
}

// Extend IChatService interface
declare module '@/core/ports/services/ai/IChatService' {
  interface IChatService {
    executeTool(name: string, args: Record<string, any>, context: Record<string, any>): Promise<any>;
  }
}