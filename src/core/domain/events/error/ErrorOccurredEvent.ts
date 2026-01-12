// src/core/domain/events/error/ErrorOccurredEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface ErrorOccurredPayload {
  errorId: string;
  jobId?: string;
  itemId?: string;
  chunkId?: string;
  step: string; // Pipeline step where error occurred
  errorCode?: string;
  message: string;
  details?: string;
  stackTrace?: string;
  isRetryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  occurredAt: Date;
}

export class ErrorOccurredEvent extends BaseDomainEvent<ErrorOccurredPayload> {
  constructor(payload: ErrorOccurredPayload, metadata: EventMetadata) {
    super('error.occurred', payload, metadata);
  }
}
