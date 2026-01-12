// src/core/ports/repositories/IJobRepository.ts
// Repository port for Job aggregate persistence

import { Job } from '../../domain/entities/Job';
import { JobStatus } from '../../domain/value-objects/JobStatus';

export interface JobListOptions {
  status?: JobStatus;
  limit?: number;
  offset?: number;
  orderByCreatedAt?: 'asc' | 'desc';
}

export interface IJobRepository {
  findById(id: string): Promise<Job | null>;
  findAll(options?: JobListOptions): Promise<Job[]>;

  save(job: Job): Promise<void>;
  delete(id: string): Promise<void>;

  exists(id: string): Promise<boolean>;
}
