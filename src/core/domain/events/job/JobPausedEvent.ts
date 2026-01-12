// src/core/domain/events/job/JobPausedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface JobPausedPayload {
  jobId: string;
  pausedAt: Date;
  reason?: string;
}

export class JobPausedEvent extends BaseDomainEvent<JobPausedPayload> {
  constructor(payload: JobPausedPayload, metadata: EventMetadata) {
    super('job.paused', payload, metadata);
  }
}
