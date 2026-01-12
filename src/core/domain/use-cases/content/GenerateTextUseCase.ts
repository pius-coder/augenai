// src/core/domain/use-cases/content/GenerateTextUseCase.ts
// Use case: Call AI API to generate text with prompt templates and rate limiting

import { z } from 'zod';
import { ContentItem } from '../../entities/ContentItem';
import { GeneratedText } from '../../entities/GeneratedText';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IGeneratedTextRepository } from '@/core/ports/repositories/IGeneratedTextRepository';
import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { ITextGenerationService } from '@/core/ports/services/ai/ITextGenerationService';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { TextGenerationStartedEvent } from '../../events/item/TextGenerationStartedEvent';
import { TextGenerationCompletedEvent } from '../../events/item/TextGenerationCompletedEvent';
import { ItemStatus } from '../../value-objects/ItemStatus';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const GenerateTextSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  maxTokens: z.number().int().min(100).max(8000).optional().default(2000),
  temperature: z.number().min(0).max(1).optional().default(0.7),
});

export type GenerateTextInput = z.infer<typeof GenerateTextSchema>;

export interface GenerateTextOutput {
  item: ContentItem;
  generatedText: GeneratedText;
}

export class GenerateTextUseCase {
  constructor(
    private readonly contentItemRepository: IContentItemRepository,
    private readonly generatedTextRepository: IGeneratedTextRepository,
    private readonly jobRepository: IJobRepository,
    private readonly textGenerationService: ITextGenerationService,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: GenerateTextInput): Promise<GenerateTextOutput> {
    // Validate input
    const validatedInput = GenerateTextSchema.parse(input);

    // Retrieve item
    const item = await this.contentItemRepository.findById(validatedInput.itemId);
    if (!item) {
      throw ErrorFactory.notFound('ContentItem', validatedInput.itemId);
    }

    // Retrieve job for prompts
    const job = await this.jobRepository.findById(item.jobId);
    if (!job) {
      throw ErrorFactory.notFound('Job', item.jobId);
    }

    // Emit started event
    await this.eventBus.publish(
      new TextGenerationStartedEvent({
        itemId: item.id,
        jobId: item.jobId,
        timestamp: new Date(),
      })
    );

    try {
      // Build user prompt from template
      let userPrompt = job.userPromptTemplate?.template || 'Generate content based on: {{details}}';
      
      // Replace template variables
      userPrompt = userPrompt
        .replace(/\{\{titre\}\}/g, item.titre)
        .replace(/\{\{details\}\}/g, item.details)
        .replace(/\{\{category\}\}/g, item.category)
        .replace(/\{\{reference\}\}/g, item.reference || '');

      // Call AI service
      const result = await this.textGenerationService.generateText({
        systemPrompt: job.systemPrompt,
        userPrompt,
        options: {
          maxTokens: validatedInput.maxTokens,
          temperature: validatedInput.temperature,
        },
      });

      // Create GeneratedText entity
      const generatedText = GeneratedText.create({
        itemId: item.id,
        content: result.text,
        model: result.model,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      });

      // Update item
      item.generatedText = result.text;
      item.moveToNextStep();

      // Persist
      await this.generatedTextRepository.save(generatedText);
      await this.contentItemRepository.save(item);

      // Emit completed event
      await this.eventBus.publish(
        new TextGenerationCompletedEvent({
          itemId: item.id,
          jobId: item.jobId,
          textLength: result.text.length,
          tokensUsed: result.usage.totalTokens,
          timestamp: new Date(),
        })
      );

      return {
        item,
        generatedText,
      };
    } catch (error) {
      // Handle rate limiting or other errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      item.fail(errorMessage);
      await this.contentItemRepository.save(item);

      throw ErrorFactory.externalService(
        'TextGeneration',
        errorMessage,
        { itemId: item.id }
      );
    }
  }
}
