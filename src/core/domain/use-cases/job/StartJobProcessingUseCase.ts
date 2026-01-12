// src/core/domain/use-cases/job/StartJobProcessingUseCase.ts
// Use case: Start processing a job (transition to PROCESSING and queue items)

import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { IItemQueue } from '@/core/ports/queue/IItemQueue';
import { JobStartedEvent } from '../../events/job/JobStartedEvent';
import { ItemCreatedEvent } from '../../events/item/ItemCreatedEvent';
import { JobStatus } from '../../value-objects/JobStatus';
import { ItemStatus } from '../../value-objects/ItemStatus';
import { ContentItem } from '../../entities/ContentItem';
import { CSVRow } from '../../value-objects/CSVRow';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface StartJobProcessingInput {
  jobId: string;
  items?: Array<{
    text?: string;
    originalText?: string;
    metadata?: Record<string, unknown>;
  }>;
  csvRows?: CSVRow[];
}

export interface StartJobProcessingOutput {
  success: boolean;
  queuedItems: number;
}

export class StartJobProcessingUseCase {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly itemRepository: IContentItemRepository,
    private readonly eventBus: IEventBus,
    private readonly itemQueue: IItemQueue
  ) {}

  async execute(input: StartJobProcessingInput): Promise<StartJobProcessingOutput> {
    const { jobId, items = [], csvRows = [] } = input;

    // Find job
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw ErrorFactory.notFound(`Job with id ${jobId} not found`);
    }

    // Check if job can be started
    if (!job.canModify()) {
      throw ErrorFactory.invalidTransition(
        'job.status',
        `Cannot start job in ${job.status} status`
      );
    }

    // Convert CSV rows to items if provided
    const allItems = [...items];
    
    if (csvRows.length > 0) {
      // Convert CSV rows to items
      for (const row of csvRows) {
        const text = row.data.text || Object.values(row.data).join(' ');
        allItems.push({
          text,
          originalText: text,
          metadata: row.data,
        });
      }
    }

    if (allItems.length === 0) {
      throw ErrorFactory.validationError('No items to process');
    }

    // Update job total items
    job.setTotalItems(allItems.length);

    // Create and save content items
    for (const itemData of allItems) {
      const item = ContentItem.create({
        jobId: jobId,
        originalText: itemData.originalText || itemData.text || '',
        metadata: itemData.metadata,
      });

      await this.itemRepository.save(item);

      // Emit item created event
      await this.eventBus.publish(
        new ItemCreatedEvent({
          itemId: item.id,
          jobId: jobId,
          timestamp: new Date(),
        })
      );

      // Queue item for processing
      await this.itemQueue.enqueue({
        itemId: item.id,
        jobId: jobId,
        priority: itemData.metadata?.priority || 'normal',
      });
    }

    // Start job processing
    job.start();
    await this.jobRepository.save(job);

    // Emit job started event
    await this.eventBus.publish(
      new JobStartedEvent({
        jobId: job.id,
        jobName: job.name,
        totalItems: allItems.length,
        timestamp: new Date(),
      })
    );

    return {
      success: true,
      queuedItems: allItems.length,
    };
  }
}