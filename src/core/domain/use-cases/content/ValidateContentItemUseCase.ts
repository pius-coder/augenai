// src/core/domain/use-cases/content/ValidateContentItemUseCase.ts
// Use case: Validate a content item before processing

import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IValidationService } from '@/core/ports/services/validation/IValidationService';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { ItemValidationStartedEvent } from '../../events/item/ItemValidationStartedEvent';
import { ItemValidationCompletedEvent } from '../../events/item/ItemValidationCompletedEvent';
import { ItemStatus } from '../../value-objects/ItemStatus';
import { ContentItem } from '../../entities/ContentItem';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface ValidateContentItemInput {
  itemId: string;
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    requiredFields?: string[];
    allowedCategories?: string[];
  };
}

export interface ValidateContentItemOutput {
  success: boolean;
  valid: boolean;
  item: ContentItem;
  validationErrors?: string[];
  skipped?: boolean;
}

export class ValidateContentItemUseCase {
  constructor(
    private readonly itemRepository: IContentItemRepository,
    private readonly validationService: IValidationService,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: ValidateContentItemInput): Promise<ValidateContentItemOutput> {
    const { itemId, validationRules } = input;

    // Find item
    const item = await this.itemRepository.findById(itemId);
    if (!item) {
      throw ErrorFactory.notFound(`Content item with id ${itemId} not found`);
    }

    // Emit validation started event
    await this.eventBus.publish(
      new ItemValidationStartedEvent({
        itemId: item.id,
        jobId: item.jobId,
        timestamp: new Date(),
      })
    );

    // Prepare validation data
    const validationData = {
      titre: item.titre,
      details: item.details,
      category: item.category,
      reference: item.reference,
      generatedText: item.generatedText,
      metadata: item.metadata,
    };

    // Perform validation
    const validationResult = await this.validationService.validateContentItem(
      validationData,
      validationRules
    );

    // Update item status based on validation
    if (validationResult.isValid) {
      item.setStatus(ItemStatus.VALIDATED);
      item.updateStep(item.currentStep, ItemStatus.VALIDATED);
    } else {
      // Check if we should skip or fail the item
      const hasCriticalErrors = validationResult.errors?.some(error => 
        error.includes('required') || error.includes('invalid')
      );

      if (hasCriticalErrors) {
        item.setStatus(ItemStatus.FAILED);
        item.updateStep(item.currentStep, ItemStatus.FAILED);
      } else {
        // Skip non-critical validation errors and continue processing
        item.setStatus(ItemStatus.VALIDATED);
        item.updateStep(item.currentStep, ItemStatus.VALIDATED);
      }
    }

    await this.itemRepository.save(item);

    // Emit validation completed event
    await this.eventBus.publish(
      new ItemValidationCompletedEvent({
        itemId: item.id,
        jobId: item.jobId,
        valid: validationResult.isValid,
        validationErrors: validationResult.errors,
        timestamp: new Date(),
      })
    );

    return {
      success: true,
      valid: validationResult.isValid,
      item,
      validationErrors: validationResult.errors,
      skipped: !validationResult.isValid && !item.isFailed(),
    };
  }
}

// Extend the validation service interface
import { IValidationService } from '@/core/ports/services/validation/IValidationService';

declare module '@/core/ports/services/validation/IValidationService' {
  interface IValidationService {
    validateContentItem(
      data: any,
      rules?: {
        minLength?: number;
        maxLength?: number;
        requiredFields?: string[];
        allowedCategories?: string[];
      }
    ): Promise<{
      isValid: boolean;
      errors?: string[];
    }>;
  }
}

// Extend ContentItem with helper methods
import { ContentItem } from '../../entities/ContentItem';

declare module '../../entities/ContentItem' {
  interface ContentItem {
    metadata?: Record<string, any>;
    isFailed(): boolean;
  }
}

ContentItem.prototype.isFailed = function() {
  return this.status === ItemStatus.FAILED;
};

ContentItem.prototype.metadata = {};