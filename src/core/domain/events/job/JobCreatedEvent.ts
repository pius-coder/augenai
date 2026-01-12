// src/core/domain/events/job/JobCreatedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface JobCreatedPayload {
  jobId: string;
  name: string;
  totalItems: number;
  voiceId?: string;
}

export class JobCreatedEvent extends BaseDomainEvent<JobCreatedPayload> {
  constructor(payload: JobCreatedPayload, metadata: EventMetadata) {
    super('job.created', payload, metadata);
  }
}
