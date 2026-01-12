// src/core/domain/events/item/TextGenerationCompletedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface TextGenerationCompletedPayload {
  itemId: string;
  jobId: string;
  completedAt: Date;
  generatedText: string;
  charCount: number;
  duration: number;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export class TextGenerationCompletedEvent extends BaseDomainEvent<TextGenerationCompletedPayload> {
  constructor(payload: TextGenerationCompletedPayload, metadata: EventMetadata) {
    super('item.text.generation.completed', payload, metadata);
  }
}
