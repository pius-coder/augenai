// src/core/domain/events/item/AudioMergeCompletedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface AudioMergeCompletedPayload {
  itemId: string;
  jobId: string;
  completedAt: Date;
  finalAudioPath: string;
  duration: number;
  fileSize: number;
  chunkCount: number;
}

export class AudioMergeCompletedEvent extends BaseDomainEvent<AudioMergeCompletedPayload> {
  constructor(payload: AudioMergeCompletedPayload, metadata: EventMetadata) {
    super('item.audio.merge.completed', payload, metadata);
  }
}
