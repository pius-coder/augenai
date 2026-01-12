// src/infrastructure/services/ai/mistral/MistralService.ts
// Mistral AI service implementation for text generation

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ITextGenerationService,
  TextGenerationParams,
  AICompletionResult,
  AIStreamChunk,
} from '@/core/ports/services/ai/ITextGenerationService';
import { envConfig } from '@/shared/config/env';
import { APIError, RateLimitError, ValidationError } from '@/shared/utils/errors/AppError';

export class MistralService implements ITextGenerationService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.mistral.ai/v1';
  private readonly defaultModel = 'mistral-large-latest';

  constructor() {
    this.apiKey = envConfig.get('MISTRAL_API_KEY');
    if (!this.apiKey) {
      throw new ValidationError('MISTRAL_API_KEY is not configured');
    }
  }

  async generateText(params: TextGenerationParams): Promise<AICompletionResult> {
    try {
      if (!params.userPrompt || params.userPrompt.trim().length === 0) {
        throw new ValidationError('User prompt is required');
      }

      const messages: any[] = [];

      if (params.systemPrompt) {
        messages.push({
          role: 'system',
          content: params.systemPrompt,
        });
      }

      messages.push({
        role: 'user',
        content: params.userPrompt,
      });

      const requestBody = {
        model: params.options?.model || this.defaultModel,
        messages,
        temperature: params.options?.temperature ?? 0.7,
        max_tokens: params.options?.maxTokens ?? 4000,
        top_p: params.options?.topP ?? 1,
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const data = await response.json();

      const choice = data.choices?.[0];
      if (!choice) {
        throw new APIError('Mistral', 'No completion returned');
      }

      return {
        content: choice.message?.content || '',
        model: data.model,
        usage: {
          inputTokens: data.usage?.prompt_tokens,
          outputTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens,
        },
      };
    } catch (error) {
      if (error instanceof APIError || error instanceof RateLimitError) {
        throw error;
      }
      throw new APIError('Mistral', `Failed to generate text: ${error}`);
    }
  }

  async *streamText(params: TextGenerationParams): AsyncIterable<AIStreamChunk> {
    try {
      if (!params.userPrompt || params.userPrompt.trim().length === 0) {
        throw new ValidationError('User prompt is required');
      }

      const messages: any[] = [];

      if (params.systemPrompt) {
        messages.push({
          role: 'system',
          content: params.systemPrompt,
        });
      }

      messages.push({
        role: 'user',
        content: params.userPrompt,
      });

      const requestBody = {
        model: params.options?.model || this.defaultModel,
        messages,
        temperature: params.options?.temperature ?? 0.7,
        max_tokens: params.options?.maxTokens ?? 4000,
        top_p: params.options?.topP ?? 1,
        stream: true,
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new APIError('Mistral', 'Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            const delta = data.choices?.[0]?.delta;
            const finishReason = data.choices?.[0]?.finish_reason;

            if (delta?.content) {
              yield {
                delta: delta.content,
                done: false,
                model: data.model,
                usage: data.usage,
              };
            }

            if (finishReason) {
              yield {
                delta: '',
                done: true,
                model: data.model,
                usage: data.usage,
              };
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    } catch (error) {
      if (error instanceof APIError || error instanceof RateLimitError) {
        throw error;
      }
      throw new APIError('Mistral', `Failed to stream text: ${error}`);
    }
  }

  private async handleError(response: Response): Promise<never> {
    const status = response.status;

    if (status === 429) {
      const error = await response.json().catch(() => ({}));
      throw new RateLimitError(
        'Mistral',
        error.message?.retry_after ? parseInt(error.message.retry_after, 10) : undefined
      );
    }

    if (status === 401) {
      throw new APIError('Mistral', 'Invalid API key');
    }

    if (status >= 400 && status < 500) {
      const error = await response.json().catch(() => ({}));
      throw new APIError('Mistral', error.message || 'API error');
    }

    throw new APIError('Mistral', `Unexpected error: ${status}`);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
