// src/core/domain/events/item/TextGenerationStartedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface TextGenerationStartedPayload {
  itemId: string;
  jobId: string;
  startedAt: Date;
  estimatedDuration?: number;
}

export class TextGenerationStartedEvent extends BaseDomainEvent<TextGenerationStartedPayload> {
  constructor(payload: TextGenerationStartedPayload, metadata: EventMetadata) {
    super('item.text.generation.started', payload, metadata);
  }
}
