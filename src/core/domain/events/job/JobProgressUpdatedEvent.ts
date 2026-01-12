// src/core/domain/events/job/JobProgressUpdatedEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface JobProgressUpdatedPayload {
  jobId: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  progressPercentage: number;
}

export class JobProgressUpdatedEvent extends BaseDomainEvent<JobProgressUpdatedPayload> {
  constructor(payload: JobProgressUpdatedPayload, metadata: EventMetadata) {
    super('job.progress.updated', payload, metadata);
  }
}
