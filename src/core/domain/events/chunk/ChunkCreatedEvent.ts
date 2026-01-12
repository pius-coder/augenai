// src/core/domain/events/chunk/ChunkCreatedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface ChunkCreatedPayload {
  chunkId: string;
  itemId: string;
  jobId: string;
  chunkIndex: number;
  text: string;
  charCount: number;
  createdAt: Date;
}

export class ChunkCreatedEvent extends BaseDomainEvent<ChunkCreatedPayload> {
  constructor(payload: ChunkCreatedPayload, metadata: EventMetadata) {
    super('chunk.created', payload, metadata);
  }
}
