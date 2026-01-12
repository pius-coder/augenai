// src/core/domain/events/item/ItemValidationCompletedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface ItemValidationCompletedPayload {
  itemId: string;
  jobId: string;
  completedAt: Date;
  isValid: boolean;
  validationErrors?: string[];
}

export class ItemValidationCompletedEvent extends BaseDomainEvent<ItemValidationCompletedPayload> {
  constructor(payload: ItemValidationCompletedPayload, metadata: EventMetadata) {
    super('item.validation.completed', payload, metadata);
  }
}
