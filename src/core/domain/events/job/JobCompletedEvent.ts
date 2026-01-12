// src/core/domain/events/job/JobCompletedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface JobCompletedPayload {
  jobId: string;
  completedAt: Date;
  totalItems: number;
  completedItems: number;
  failedItems: number;
}

export class JobCompletedEvent extends BaseDomainEvent<JobCompletedPayload> {
  constructor(payload: JobCompletedPayload, metadata: EventMetadata) {
    super('job.completed', payload, metadata);
  }
}
