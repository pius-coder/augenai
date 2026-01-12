// src/core/ports/services/ai/IAIService.ts
// Base AI service port

export type AIChatRole = 'system' | 'user' | 'assistant';

export interface AIChatMessage {
  role: AIChatRole;
  content: string;
}

export interface AIRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
}

export interface AIUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface AICompletionResult {
  content: string;
  model?: string;
  usage?: AIUsage;
}

export interface AIStreamChunk {
  delta: string;
  done?: boolean;
  model?: string;
  usage?: AIUsage;
}

export interface IAIService {
  getProviderName(): string;
  isHealthy(): Promise<boolean>;
}
