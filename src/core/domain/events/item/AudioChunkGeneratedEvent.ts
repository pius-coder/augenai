// src/core/domain/events/item/AudioChunkGeneratedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface AudioChunkGeneratedPayload {
  itemId: string;
  jobId: string;
  chunkId: string;
  chunkIndex: number;
  generatedAt: Date;
  audioPath: string;
  duration: number;
  fileSize: number;
}

export class AudioChunkGeneratedEvent extends BaseDomainEvent<AudioChunkGeneratedPayload> {
  constructor(payload: AudioChunkGeneratedPayload, metadata: EventMetadata) {
    super('item.audio.chunk.generated', payload, metadata);
  }
}
