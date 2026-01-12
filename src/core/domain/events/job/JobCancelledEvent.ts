// src/core/domain/events/job/JobCancelledEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface JobCancelledPayload {
  jobId: string;
  cancelledAt: Date;
  reason?: string;
}

export class JobCancelledEvent extends BaseDomainEvent<JobCancelledPayload> {
  constructor(payload: JobCancelledPayload, metadata: EventMetadata) {
    super('job.cancelled', payload, metadata);
  }
}
