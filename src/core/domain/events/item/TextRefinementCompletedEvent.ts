// src/core/domain/events/item/TextRefinementCompletedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface TextRefinementCompletedPayload {
  itemId: string;
  jobId: string;
  completedAt: Date;
  refinedText: string;
  originalLength: number;
  refinedLength: number;
  changes: string[];
}

export class TextRefinementCompletedEvent extends BaseDomainEvent<TextRefinementCompletedPayload> {
  constructor(payload: TextRefinementCompletedPayload, metadata: EventMetadata) {
    super('item.text.refinement.completed', payload, metadata);
  }
}
