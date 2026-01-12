// src/core/ports/repositories/IContentItemRepository.ts
// Repository port for ContentItem persistence

import { ContentItem, PipelineStep } from '../../domain/entities/ContentItem';
import { ItemStatus } from '../../domain/value-objects/ItemStatus';

export interface ContentItemListOptions {
  status?: ItemStatus;
  step?: PipelineStep;
  limit?: number;
  offset?: number;
  orderByRowIndex?: 'asc' | 'desc';
  orderByUpdatedAt?: 'asc' | 'desc';
}

export interface IContentItemRepository {
  findById(id: string): Promise<ContentItem | null>;
  findByJobId(jobId: string, options?: ContentItemListOptions): Promise<ContentItem[]>;

  save(item: ContentItem): Promise<void>;
  saveMany(items: ContentItem[]): Promise<void>;

  delete(id: string): Promise<void>;
  deleteByJobId(jobId: string): Promise<void>;

  exists(id: string): Promise<boolean>;
}
