// src/core/domain/events/job/JobResumedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface JobResumedPayload {
  jobId: string;
  resumedAt: Date;
}

export class JobResumedEvent extends BaseDomainEvent<JobResumedPayload> {
  constructor(payload: JobResumedPayload, metadata: EventMetadata) {
    super('job.resumed', payload, metadata);
  }
}
