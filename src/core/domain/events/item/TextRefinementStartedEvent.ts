// src/core/domain/events/item/TextRefinementStartedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface TextRefinementStartedPayload {
  itemId: string;
  jobId: string;
  startedAt: Date;
  originalTextLength: number;
}

export class TextRefinementStartedEvent extends BaseDomainEvent<TextRefinementStartedPayload> {
  constructor(payload: TextRefinementStartedPayload, metadata: EventMetadata) {
    super('item.text.refinement.started', payload, metadata);
  }
}
