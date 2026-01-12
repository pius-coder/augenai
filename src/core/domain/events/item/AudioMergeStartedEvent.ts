// src/core/domain/events/item/AudioMergeStartedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface AudioMergeStartedPayload {
  itemId: string;
  jobId: string;
  startedAt: Date;
  chunkCount: number;
}

export class AudioMergeStartedEvent extends BaseDomainEvent<AudioMergeStartedPayload> {
  constructor(payload: AudioMergeStartedPayload, metadata: EventMetadata) {
    super('item.audio.merge.started', payload, metadata);
  }
}
