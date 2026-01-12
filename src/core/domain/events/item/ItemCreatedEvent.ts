// src/core/domain/events/item/ItemCreatedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface ItemCreatedPayload {
  itemId: string;
  jobId: string;
  rowIndex: number;
  titre: string;
  category: string;
}

export class ItemCreatedEvent extends BaseDomainEvent<ItemCreatedPayload> {
  constructor(payload: ItemCreatedPayload, metadata: EventMetadata) {
    super('item.created', payload, metadata);
  }
}
