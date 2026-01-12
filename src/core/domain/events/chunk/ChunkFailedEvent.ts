// src/core/domain/events/chunk/ChunkFailedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface ChunkFailedPayload {
  chunkId: string;
  itemId: string;
  jobId: string;
  chunkIndex: number;
  failedAt: Date;
  reason: string;
  errorType?: string;
  isRetryable: boolean;
  retryCount: number;
}

export class ChunkFailedEvent extends BaseDomainEvent<ChunkFailedPayload> {
  constructor(payload: ChunkFailedPayload, metadata: EventMetadata) {
    super('chunk.failed', payload, metadata);
  }
}
