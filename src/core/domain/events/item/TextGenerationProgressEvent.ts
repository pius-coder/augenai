// src/core/domain/events/item/TextGenerationProgressEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface TextGenerationProgressPayload {
  itemId: string;
  jobId: string;
  currentTextChunk: string;
  generatedCharCount: number;
  totalCharCount: number;
  progressPercentage: number;
}

export class TextGenerationProgressEvent extends BaseDomainEvent<TextGenerationProgressPayload> {
  constructor(payload: TextGenerationProgressPayload, metadata: EventMetadata) {
    super('item.text.generation.progress', payload, metadata);
  }
}
