// src/core/domain/events/item/ItemValidationStartedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface ItemValidationStartedPayload {
  itemId: string;
  jobId: string;
  startedAt: Date;
}

export class ItemValidationStartedEvent extends BaseDomainEvent<ItemValidationStartedPayload> {
  constructor(payload: ItemValidationStartedPayload, metadata: EventMetadata) {
    super('item.validation.started', payload, metadata);
  }
}
