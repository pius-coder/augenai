// src/core/domain/use-cases/content/RegenerateItemUseCase.ts
// Use case: Regenerate a failed or completed content item

import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { IProcessItemQueue } from '@/core/ports/queue/IProcessItemQueue';
import { ItemCreatedEvent } from '../../events/item/ItemCreatedEvent';
import { ItemStatus } from '../../value-objects/ItemStatus';
import { PipelineStep } from '../../entities/ContentItem';
import { ContentItem } from '../../entities/ContentItem';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface RegenerateItemInput {
  itemId: string;
  preserveAudio?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

export interface RegenerateItemOutput {
  success: boolean;
  itemId: string;
  newItemId?: string; // Only set if cloning the item
  resetFields: string[];
}

export class RegenerateItemUseCase {
  constructor(
    private readonly itemRepository: IContentItemRepository,
    private readonly eventBus: IEventBus,
    private readonly itemQueue: IProcessItemQueue
  ) {}

  async execute(input: RegenerateItemInput): Promise<RegenerateItemOutput> {
    const { itemId, preserveAudio = false, priority = 'normal' } = input;

    // Find item
    const originalItem = await this.itemRepository.findById(itemId);
    if (!originalItem) {
      throw ErrorFactory.notFound(`Content item with id ${itemId} not found`);
    }

    const resetFields: string[] = [];

    if (preserveAudio && originalItem.status === ItemStatus.COMPLETED) {
      // Clone the item for regeneration while keeping audio
      const newItem = await this.cloneItemWithAudio(originalItem);
      
      // Queue the new item
      await this.itemQueue.enqueue({
        itemId: newItem.id,
        jobId: newItem.jobId,
        priority,
      });

      return {
        success: true,
        itemId,
        newItemId: newItem.id,
        resetFields: ['id', 'createdAt', 'status', 'attempts'],
      };
    } else {
      // Reset existing item
      await this.resetItem(originalItem, resetFields);
      
      // Queue the item for regeneration
      await this.itemQueue.enqueue({
        itemId: originalItem.id,
        jobId: originalItem.jobId,
        priority,
      });

      return {
        success: true,
        itemId,
        resetFields,
      };
    }
  }

  private async cloneItemWithAudio(originalItem: ContentItem): Promise<ContentItem> {
    const newItem = ContentItem.create(
      {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        jobId: originalItem.jobId,
        rowIndex: originalItem.rowIndex,
        titre: originalItem.titre,
        details: originalItem.details,
        category: originalItem.category,
        reference: originalItem.reference,
      } as any,
      originalItem.jobId,
      originalItem.rowIndex
    );

    // Preserve original text and audio if requested
    if (originalItem.finalAudioPath && originalItem.audioDuration) {
      newItem.setAudio(originalItem.finalAudioPath, originalItem.audioDuration);
    }
    if (originalItem.generatedText) {
      newItem.setGeneratedText(originalItem.generatedText);
    }

    await this.itemRepository.save(newItem);

    // Emit item created event
    await this.eventBus.publish(
      new ItemCreatedEvent({
        itemId: newItem.id,
        jobId: newItem.jobId,
        timestamp: new Date(),
        isRegeneration: true,
        originalItemId: originalItem.id,
      })
    );

    return newItem;
  }

  private async resetItem(item: ContentItem, resetFields: string[]): Promise<void> {
    // Reset item fields
    const originalStatus = item.status;
    const originalCompletedAt = item.completedAt;
    const originalError = item.errorMessage;
    const originalAttempts = item.attempts;

    // Reset status and progress
    item.setStatus(ItemStatus.PENDING);
    item.updateStep(PipelineStep.VALIDATION, ItemStatus.PENDING);
    
    // Clear generated content
    item.generatedText = undefined;
    item.finalAudioPath = undefined;
    item.audioDuration = undefined;
    item.errorMessage = undefined;
    item.attempts = 0;
    item.completedAt = undefined;
    item.updatedAt = new Date();

    // Mark fields as reset
    resetFields.push(
      'status',
      'currentStep',
      'generatedText',
      'finalAudioPath',
      'audioDuration',
      'errorMessage',
      'attempts',
      'completedAt',
      'updatedAt'
    );

    await this.itemRepository.save(item);
  }
}

// Extend interfaces to add missing properties
declare module '../../entities/ContentItem' {
  interface ContentItem {
    errorMessage?: string;
    attempts: number;
  }
}

declare module '@/core/ports/repositories/IContentItemRepository' {
  interface IContentItemRepository {
    findByJobIdAndStatus(jobId: string, status: ItemStatus): Promise<ContentItem[]>;
  }
}