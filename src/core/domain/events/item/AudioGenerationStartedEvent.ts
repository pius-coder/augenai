// src/core/domain/events/item/AudioGenerationStartedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface AudioGenerationStartedPayload {
  itemId: string;
  jobId: string;
  startedAt: Date;
  totalChunks: number;
  voiceId: string;
}

export class AudioGenerationStartedEvent extends BaseDomainEvent<AudioGenerationStartedPayload> {
  constructor(payload: AudioGenerationStartedPayload, metadata: EventMetadata) {
    super('item.audio.generation.started', payload, metadata);
  }
}
