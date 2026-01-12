// src/core/domain/events/item/TextChunkingCompletedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface TextChunkingCompletedPayload {
  itemId: string;
  jobId: string;
  completedAt: Date;
  totalChunks: number;
  chunkSizes: number[];
}

export class TextChunkingCompletedEvent extends BaseDomainEvent<TextChunkingCompletedPayload> {
  constructor(payload: TextChunkingCompletedPayload, metadata: EventMetadata) {
    super('item.text.chunking.completed', payload, metadata);
  }
}
