// src/core/domain/use-cases/content/ProcessItemUseCase.ts
// Use case: Main orchestration for single item processing

import { z } from 'zod';
import { ContentItem, PipelineStep } from '../../entities/ContentItem';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { ItemProcessingStartedEvent } from '../../events/item/ItemProcessingStartedEvent';
import { ItemCompletedEvent } from '../../events/item/ItemCompletedEvent';
import { ItemFailedEvent } from '../../events/item/ItemFailedEvent';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';
import { ItemStatus } from '../../value-objects/ItemStatus';

const ProcessItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
});

export type ProcessItemInput = z.infer<typeof ProcessItemSchema>;

export interface ProcessItemOutput {
  item: ContentItem;
  success: boolean;
}

export class ProcessItemUseCase {
  constructor(
    private readonly contentItemRepository: IContentItemRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: ProcessItemInput): Promise<ProcessItemOutput> {
    // Validate input
    const { itemId } = ProcessItemSchema.parse(input);

    // Retrieve item
    const item = await this.contentItemRepository.findById(itemId);
    if (!item) {
      throw ErrorFactory.notFound('ContentItem', itemId);
    }

    // Check if item can be processed
    if (item.status !== ItemStatus.PENDING && item.status !== ItemStatus.RETRYING) {
      throw ErrorFactory.invalidConfig(
        'item.status',
        `Cannot process item in ${item.status} status`
      );
    }

    try {
      // Start processing
      item.startProcessing();
      await this.contentItemRepository.save(item);

      // Emit started event
      await this.eventBus.publish(
        new ItemProcessingStartedEvent({
          itemId: item.id,
          jobId: item.jobId,
          step: item.currentStep,
          timestamp: new Date(),
        })
      );

      return {
        item,
        success: true,
      };
    } catch (error) {
      // Mark as failed
      item.fail(error instanceof Error ? error.message : 'Unknown error');
      await this.contentItemRepository.save(item);

      // Emit failed event
      await this.eventBus.publish(
        new ItemFailedEvent({
          itemId: item.id,
          jobId: item.jobId,
          error: error instanceof Error ? error.message : 'Unknown error',
          step: item.currentStep,
          timestamp: new Date(),
        })
      );

      return {
        item,
        success: false,
      };
    }
  }
}
