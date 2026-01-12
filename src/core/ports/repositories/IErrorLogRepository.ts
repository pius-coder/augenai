// src/core/ports/repositories/IErrorLogRepository.ts
// Repository port for ErrorLog persistence

import { ErrorLog } from '../../domain/entities/ErrorLog';
import { PipelineStep } from '../../domain/entities/ContentItem';

export interface ErrorLogListOptions {
  step?: PipelineStep;
  limit?: number;
  offset?: number;
  orderByCreatedAt?: 'asc' | 'desc';
}

export interface IErrorLogRepository {
  findById(id: string): Promise<ErrorLog | null>;
  findByJobId(jobId: string, options?: ErrorLogListOptions): Promise<ErrorLog[]>;
  findByItemId(itemId: string, options?: ErrorLogListOptions): Promise<ErrorLog[]>;
  findByChunkId(chunkId: string, options?: ErrorLogListOptions): Promise<ErrorLog[]>;

  save(errorLog: ErrorLog): Promise<void>;
  delete(id: string): Promise<void>;

  exists(id: string): Promise<boolean>;
}
