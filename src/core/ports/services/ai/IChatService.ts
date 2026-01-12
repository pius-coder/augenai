// src/core/ports/services/ai/IChatService.ts
// Chat-focused AI service port

import type { AIChatMessage, AICompletionResult, AIRequestOptions, AIStreamChunk } from './IAIService';
import type { MessageAction } from '../../../domain/entities/ChatMessage';

export interface ChatCompletionOptions extends AIRequestOptions {
  systemPrompt?: string;
}

export interface ChatCompletionResult extends AICompletionResult {
  actions?: MessageAction[];
}

export interface IChatService {
  completeChat(messages: AIChatMessage[], options?: ChatCompletionOptions): Promise<ChatCompletionResult>;
  streamChat(messages: AIChatMessage[], options?: ChatCompletionOptions): AsyncIterable<AIStreamChunk>;
}
