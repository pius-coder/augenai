// src/core/domain/events/item/ItemFailedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface ItemFailedPayload {
  itemId: string;
  jobId: string;
  failedAt: Date;
  reason: string;
  step: string; // The pipeline step where it failed
  errorType?: string;
  isRetryable: boolean;
  retryCount: number;
}

export class ItemFailedEvent extends BaseDomainEvent<ItemFailedPayload> {
  constructor(payload: ItemFailedPayload, metadata: EventMetadata) {
    super('item.failed', payload, metadata);
  }
}
