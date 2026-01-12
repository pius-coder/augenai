// src/core/domain/use-cases/content/RefineTextUseCase.ts
// Use case: Optional refinement step for generated text

import { z } from 'zod';
import { ContentItem } from '../../entities/ContentItem';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { ITextGenerationService } from '@/core/ports/services/ai/ITextGenerationService';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { TextRefinementStartedEvent } from '../../events/item/TextRefinementStartedEvent';
import { TextRefinementCompletedEvent } from '../../events/item/TextRefinementCompletedEvent';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const RefineTextSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  refinementInstructions: z.string().min(1, 'Refinement instructions are required'),
  maxTokens: z.number().int().min(100).max(8000).optional().default(2000),
  temperature: z.number().min(0).max(1).optional().default(0.5),
});

export type RefineTextInput = z.infer<typeof RefineTextSchema>;

export interface RefineTextOutput {
  item: ContentItem;
  refinedText: string;
}

export class RefineTextUseCase {
  constructor(
    private readonly contentItemRepository: IContentItemRepository,
    private readonly textGenerationService: ITextGenerationService,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: RefineTextInput): Promise<RefineTextOutput> {
    // Validate input
    const validatedInput = RefineTextSchema.parse(input);

    // Retrieve item
    const item = await this.contentItemRepository.findById(validatedInput.itemId);
    if (!item) {
      throw ErrorFactory.notFound('ContentItem', validatedInput.itemId);
    }

    if (!item.generatedText) {
      throw ErrorFactory.invalidConfig(
        'item.generatedText',
        'No generated text to refine'
      );
    }

    // Emit started event
    await this.eventBus.publish(
      new TextRefinementStartedEvent({
        itemId: item.id,
        jobId: item.jobId,
        timestamp: new Date(),
      })
    );

    try {
      // Build refinement prompt
      const systemPrompt = 'You are an expert editor. Refine the following text according to the instructions provided.';
      const userPrompt = `Original text:\n${item.generatedText}\n\nInstructions: ${validatedInput.refinementInstructions}\n\nProvide the refined text:`;

      // Call AI service
      const result = await this.textGenerationService.generateText({
        systemPrompt,
        userPrompt,
        options: {
          maxTokens: validatedInput.maxTokens,
          temperature: validatedInput.temperature,
        },
      });

      // Update item with refined text
      item.generatedText = result.text;
      await this.contentItemRepository.save(item);

      // Emit completed event
      await this.eventBus.publish(
        new TextRefinementCompletedEvent({
          itemId: item.id,
          jobId: item.jobId,
          timestamp: new Date(),
        })
      );

      return {
        item,
        refinedText: result.text,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw ErrorFactory.externalService(
        'TextRefinement',
        errorMessage,
        { itemId: item.id }
      );
    }
  }
}
