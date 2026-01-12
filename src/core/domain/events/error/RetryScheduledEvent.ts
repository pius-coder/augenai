// src/core/domain/events/error/RetryScheduledEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface RetryScheduledPayload {
  retryId: string;
  jobId?: string;
  itemId?: string;
  chunkId?: string;
  step: string;
  retryAttempt: number;
  maxRetries: number;
  scheduledAt: Date;
  reason: string;
  delayMs: number;
}

export class RetryScheduledEvent extends BaseDomainEvent<RetryScheduledPayload> {
  constructor(payload: RetryScheduledPayload, metadata: EventMetadata) {
    super('error.retry.scheduled', payload, metadata);
  }
}
