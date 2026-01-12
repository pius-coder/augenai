// src/core/ports/services/ai/ITextRefinementService.ts
// AI text refinement port (rewrite, shorten, expand, style changes)

import type { AICompletionResult, AIRequestOptions, AIStreamChunk } from './IAIService';

export interface TextRefinementParams {
  systemPrompt?: string;
  originalText: string;
  instructions: string;
  options?: AIRequestOptions;
}

export interface ITextRefinementService {
  refineText(params: TextRefinementParams): Promise<AICompletionResult>;
  streamRefinement(params: TextRefinementParams): AsyncIterable<AIStreamChunk>;
}
