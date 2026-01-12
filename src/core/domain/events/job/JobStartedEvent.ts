// src/core/domain/events/job/JobStartedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface JobStartedPayload {
  jobId: string;
  startedAt: Date;
}

export class JobStartedEvent extends BaseDomainEvent<JobStartedPayload> {
  constructor(payload: JobStartedPayload, metadata: EventMetadata) {
    super('job.started', payload, metadata);
  }
}
