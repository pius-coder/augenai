// src/application/workflows/CSVImportWorkflow.ts
// Workflow: Complete CSV import workflow from upload to job creation

import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { IQueueManager } from '@/core/ports/queue/IQueueManager';
import { IStorageService } from '@/core/ports/services/storage/IStorageService';
import { ICSVParserService } from '@/core/ports/services/parsing/ICSVParsingService';
import { CreateJobFromCSVUseCase } from '@/core/domain/use-cases/job/CreateJobFromCSVUseCase';
import { ValidateContentItemUseCase } from '@/core/domain/use-cases/content/ValidateContentItemUseCase';
import { Job } from '@/core/domain/entities/Job';
import { ContentItem } from '@/core/domain/entities/ContentItem';
import { JobStatus } from '@/core/domain/value-objects/JobStatus';
import { ItemStatus } from '@/core/domain/value-objects/ItemStatus';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export class CSVImportWorkflow {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly contentItemRepository: IContentItemRepository,
    private readonly eventBus: IEventBus,
    private readonly queueManager: IQueueManager,
    private readonly storageService: IStorageService,
    private readonly csvParserService: ICSVParserService,
    private readonly createJobFromCSVUseCase: CreateJobFromCSVUseCase,
    private readonly validateContentItemUseCase: ValidateContentItemUseCase
  ) {}

  public async execute(
    file: File,
    jobName: string,
    voiceSettings?: {
      voiceId: string;
      stability?: number;
      similarityBoost?: number;
      style?: number;
      useSpeakerBoost?: boolean;
    },
    promptSettings?: {
      systemPrompt?: string;
      userPromptTemplate?: string;
    }
  ): Promise<Job> {
    try {
      // Step 1: Upload file to storage
      const filePath = await this.storageService.uploadFile(
        file,
        `uploads/csv/${Date.now()}_${file.name}`
      );

      // Step 2: Parse CSV file
      const csvData = await this.storageService.readFile(filePath, 'utf-8');
      const parsedData = await this.csvParserService.parseCSV(csvData);

      // Step 3: Create job from CSV
      const createJobResult = await this.createJobFromCSVUseCase.execute({
        name: jobName,
        csvData: parsedData.csvString,
        voiceId: voiceSettings?.voiceId,
        stability: voiceSettings?.stability,
        similarityBoost: voiceSettings?.similarityBoost,
        style: voiceSettings?.style,
        useSpeakerBoost: voiceSettings?.useSpeakerBoost,
        systemPrompt: promptSettings?.systemPrompt,
        userPromptTemplate: promptSettings?.userPromptTemplate,
      });

      const job = createJobResult.job;
      const csvRows = createJobResult.rows;

      // Step 4: Create content items from CSV rows
      const contentItems: ContentItem[] = [];
      for (const row of csvRows) {
        const contentItem = ContentItem.create({
          jobId: job.id,
          titre: row.data.titre || row.data.title || '',
          details: row.data.details || row.data.description || '',
          category: row.data.category || row.data.type || '',
          reference: row.data.reference || row.data.id || '',
          status: ItemStatus.PENDING,
          currentStep: 'validation',
          createdAt: new Date(),
        });

        await this.contentItemRepository.save(contentItem);
        contentItems.push(contentItem);
      }

      // Update job with item count
      job.setTotalItems(contentItems.length);
      await this.jobRepository.save(job);

      // Step 5: Add validation tasks to queue
      for (const item of contentItems) {
        await this.queueManager.addJob('validation', {
          itemId: item.id,
          jobId: job.id,
        });
      }

      return job;

    } catch (error) {
      console.error('CSV import workflow failed:', error);
      throw ErrorFactory.workflowError('CSV import workflow failed', error);
    }
  }

  public async validateAndProcessItem(
    itemId: string,
    validationRules?: {
      minLength?: number;
      maxLength?: number;
      requiredFields?: string[];
      allowedCategories?: string[];
    }
  ): Promise<void> {
    try {
      // Validate the content item
      const validationResult = await this.validateContentItemUseCase.execute({
        itemId,
        validationRules,
      });

      if (!validationResult.valid) {
        console.warn(`Validation failed for item ${itemId}:`, validationResult.validationErrors);
        return;
      }

      // If validation passed, add to text generation queue
      await this.queueManager.addJob('text-generation', {
        itemId,
      });

    } catch (error) {
      console.error(`Failed to validate and process item ${itemId}:`, error);
      throw ErrorFactory.workflowError(
        `Failed to validate and process item ${itemId}`,
        error
      );
    }
  }

  public async processValidationQueue(): Promise<void> {
    // This would be called by a worker to process validation queue
    // In practice, this would be handled by the QueueManager and workers
  }
}