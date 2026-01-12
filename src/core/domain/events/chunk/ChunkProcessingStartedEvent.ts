// src/core/domain/events/chunk/ChunkProcessingStartedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface ChunkProcessingStartedPayload {
  chunkId: string;
  itemId: string;
  jobId: string;
  chunkIndex: number;
  startedAt: Date;
  voiceId: string;
}

export class ChunkProcessingStartedEvent extends BaseDomainEvent<ChunkProcessingStartedPayload> {
  constructor(payload: ChunkProcessingStartedPayload, metadata: EventMetadata) {
    super('chunk.processing.started', payload, metadata);
  }
}
