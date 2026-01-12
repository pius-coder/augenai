// src/core/domain/events/item/ItemCompletedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface ItemCompletedPayload {
  itemId: string;
  jobId: string;
  completedAt: Date;
  finalAudioPath: string;
  audioDuration: number;
  textLength: number;
  chunkCount: number;
  totalDuration: number; // Total processing time in ms
}

export class ItemCompletedEvent extends BaseDomainEvent<ItemCompletedPayload> {
  constructor(payload: ItemCompletedPayload, metadata: EventMetadata) {
    super('item.completed', payload, metadata);
  }
}
