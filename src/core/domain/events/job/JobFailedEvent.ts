// src/core/domain/events/job/JobFailedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface JobFailedPayload {
  jobId: string;
  failedAt: Date;
  reason: string;
  errorType?: string;
  failedItems: number;
}

export class JobFailedEvent extends BaseDomainEvent<JobFailedPayload> {
  constructor(payload: JobFailedPayload, metadata: EventMetadata) {
    super('job.failed', payload, metadata);
  }
}
