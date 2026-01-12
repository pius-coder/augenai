// src/core/ports/services/ai/ITextGenerationService.ts
// AI text generation port (for generating long-form text for content items)

import type { AICompletionResult, AIRequestOptions, AIStreamChunk } from './IAIService';

export interface TextGenerationParams {
  systemPrompt?: string;
  userPrompt: string;
  options?: AIRequestOptions;
}

export interface ITextGenerationService {
  generateText(params: TextGenerationParams): Promise<AICompletionResult>;
  streamText(params: TextGenerationParams): AsyncIterable<AIStreamChunk>;
}
