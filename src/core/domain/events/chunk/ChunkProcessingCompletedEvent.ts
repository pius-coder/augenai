// src/core/domain/events/chunk/ChunkProcessingCompletedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface ChunkProcessingCompletedPayload {
  chunkId: string;
  itemId: string;
  jobId: string;
  chunkIndex: number;
  completedAt: Date;
  audioPath: string;
  duration: number;
  fileSize: number;
  processingTime: number; // Duration in ms
}

export class ChunkProcessingCompletedEvent extends BaseDomainEvent<ChunkProcessingCompletedPayload> {
  constructor(payload: ChunkProcessingCompletedPayload, metadata: EventMetadata) {
    super('chunk.processing.completed', payload, metadata);
  }
}
