// src/application/workflows/JobProcessingWorkflow.ts
// High-level workflow for processing a complete job from start to finish

import { PipelineOrchestrator } from '../orchestrators/PipelineOrchestrator';
import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { StartJobProcessingUseCase } from '@/core/domain/use-cases/job/StartJobProcessingUseCase';
import { ProcessItemUseCase } from '@/core/domain/use-cases/content/ProcessItemUseCase';
import { logger } from '@/shared/lib/logger';
import { JobStatus } from '@/core/domain/value-objects/JobStatus';
import { Job } from '@/core/domain/entities/Job';
import { CSVRow } from '@/core/domain/value-objects/CSVRow';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface JobProcessingContext {
  jobId: string;
  csvRows?: CSVRow[];
  items?: Array<{
    text?: string;
    originalText?: string;
    metadata?: Record<string, any>;
  }>;
  voiceSettings?: any;
  batchProcessing?: boolean;
}

export interface JobProcessingResult {
  success: boolean;
  jobId: string;
  job?: Job;
  processedItems: number;
  failedItems: number;
  errors: Array<{
    itemId?: string;
    error: string;
    step: string;
  }>;
}

export class JobProcessingWorkflow {
  constructor(
    private readonly pipelineOrchestrator: PipelineOrchestrator,
    private readonly jobRepository: IJobRepository,
    private readonly itemRepository: IContentItemRepository,
    private readonly eventBus: IEventBus,
    private readonly startJobProcessing: StartJobProcessingUseCase,
    private readonly processItem: ProcessItemUseCase
  ) {}

  async executeWorkflow(context: JobProcessingContext): Promise<JobProcessingResult> {
    const { jobId } = context;
    
    logger.info('Starting job processing workflow', { jobId });
    
    const result: JobProcessingResult = {
      success: true,
      jobId,
      processedItems: 0,
      failedItems: 0,
      errors: [],
    };

    try {
      // Step 1: Validate job exists and is in correct state
      const job = await this.validateJob(jobId);
      result.job = job;

      // Step 2: Start job processing (creates items from CSV or direct input)
      await this.startJob(jobId, context.csvRows || [], context.items || []);

      // Step 3: Process items through pipeline
      await this.processItems(jobId, result);

      // Step 4: Wait for completion
      await this.waitForJobCompletion(jobId);

      // Step 5: Generate final report
      await this.generateCompletionReport(jobId, result);

      logger.info('Job processing workflow completed', { 
        jobId, 
        success: result.success,
        processedItems: result.processedItems,
        failedItems: result.failedItems 
      });

    } catch (error) {
      logger.error('Job processing workflow failed', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      result.success = false;
      result.errors.push({
        error: error instanceof Error ? error.message : 'Unknown error',
        step: 'workflow',
      });
    }

    return result;
  }

  private async validateJob(jobId: string): Promise<Job> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw ErrorFactory.notFound(`Job ${jobId} not found`);
    }

    // Check if job can be processed
    if (!job.canModify()) {
      throw ErrorFactory.invalidTransition(
        'job.status',
        `Cannot process job in ${job.status} state`
      );
    }

    return job;
  }

  private async startJob(
    jobId: string,
    csvRows: CSVRow[],
    items: Array<{text?: string; originalText?: string; metadata?: Record<string, any>}>
  ): Promise<void> {
    logger.debug('Starting job', { jobId, csvRows: csvRows.length, items: items.length });
    
    const result = await this.startJobProcessing.execute({
      jobId,
      items,
      csvRows,
    });

    if (!result.success) {
      throw ErrorFactory.invalidTransition(
        'job.start',
        `Failed to start job ${jobId} - no items to process`
      );
    }

    logger.info('Job started successfully', { jobId, queuedItems: result.queuedItems });
  }

  private async processItems(jobId: string, result: JobProcessingResult): Promise<void> {
    logger.debug('Processing items for job', { jobId });
    
    const items = await this.itemRepository.findByJobId(jobId);
    logger.info(`Found ${items.length} items to process`, { jobId });

    for (const item of items) {
      try {
        // Process each item through the pipeline
        await this.processItem.execute({
          itemId: item.id,
          jobId: jobId,
          forceRegenerate: false,
        });

        result.processedItems++;
        logger.debug(`Item processed successfully`, { 
          itemId: item.id,
          jobId, 
          processedSoFar: result.processedItems 
        });

      } catch (error) {
        result.failedItems++;
        result.errors.push({
          itemId: item.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          step: 'item-processing',
        });

        logger.error(`Item processing failed`, {
          itemId: item.id,
          jobId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  private async waitForJobCompletion(jobId: string, timeoutMs: number = 1800000): Promise<void> {
    logger.debug('Waiting for job completion', { jobId, timeoutMs });
    
    const startTime = Date.now();
    const checkInterval = 5000; // Check every 5 seconds

    return new Promise((resolve, reject) => {
      const checkJobStatus = async () => {
        try {
          const job = await this.jobRepository.findById(jobId);
          if (!job) {
            reject(ErrorFactory.notFound(`Job ${jobId} disappeared during processing`));
            return;
          }

          if (job.isComplete() || job.isFailed()) {
            logger.info('Job completed processing', { 
              jobId, 
              status: job.status,
              processed: job.completedItems,
              failed: job.failedItems 
            });
            resolve();
            return;
          }

          if (Date.now() - startTime > timeoutMs) {
            reject(ErrorFactory.timeoutError('job.completion', `Job ${jobId} timed out after ${timeoutMs}ms`));
            return;
          }

          // Continue checking
          setTimeout(checkJobStatus, checkInterval);
        } catch (error) {
          reject(error);
        }
      };

      setTimeout(checkJobStatus, 100); // Start checking after brief delay
    });
  }

  private async generateCompletionReport(jobId: string, result: JobProcessingResult): Promise<void> {
    logger.debug('Generating completion report', { jobId });
    
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      logger.warn('Could not generate report - job not found', { jobId });
      return;
    }

    // Update final job status
    result.processedItems = job.completedItems;
    result.failedItems = job.failedItems;

    // Emit completion event
    await this.eventBus.publish({
      type: 'job.workflow.completed',
      data: {
        jobId,
        success: result.success && result.failedItems === 0,
        processedItems: result.processedItems,
        failedItems: result.failedItems,
        errors: result.errors,
        timestamp: new Date(),
      },
    });

    logger.info('Job workflow completion report generated', {
      jobId,
      success: result.success,
      processed: result.processedItems,
      failed: result.failedItems,
    });
  }

  async pauseWorkflow(jobId: string): Promise<void> {
    logger.info('Pausing job workflow', { jobId });
    
    await this.eventBus.publish({
      type: 'job.workflow.paused',
      data: {
        jobId,
        timestamp: new Date(),
      },
    });
  }

  async resumeWorkflow(jobId: string): Promise<void> {
    logger.info('Resuming job workflow', { jobId });
    
    await this.eventBus.publish({
      type: 'job.workflow.resumed',
      data: {
        jobId,
        timestamp: new Date(),
      },
    });
  }

  async cancelWorkflow(jobId: string): Promise<void> {
    logger.info('Cancelling job workflow', { jobId });
    
    await this.eventBus.publish({
      type: 'job.workflow.cancelled',
      data: {
        jobId,
        timestamp: new Date(),
      },
    });
  }
}
