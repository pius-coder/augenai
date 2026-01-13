// src/application/services/ProgressTrackingService.ts
// Service: Track and report progress across the audio generation pipeline

import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IAudioChunkRepository } from '@/core/ports/repositories/IAudioChunkRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { JobProgressUpdatedEvent } from '@/core/domain/events/job/JobProgressUpdatedEvent';
import { ItemProgressUpdatedEvent } from '@/core/domain/events/item/ItemProgressUpdatedEvent';
import { ChunkProgressUpdatedEvent } from '@/core/domain/events/chunk/ChunkProgressUpdatedEvent';
import { Job } from '@/core/domain/entities/Job';
import { ContentItem } from '@/core/domain/entities/ContentItem';
import { AudioChunk } from '@/core/domain/entities/AudioChunk';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export class ProgressTrackingService {
  private readonly jobProgress: Map<string, {
    totalItems: number;
    completedItems: number;
    failedItems: number;
    progress: number;
    lastUpdated: Date;
  }> = new Map();

  private readonly itemProgress: Map<string, {
    currentStep: string;
    stepProgress: number;
    overallProgress: number;
    lastUpdated: Date;
  }> = new Map();

  private readonly chunkProgress: Map<string, {
    status: string;
    progress: number;
    lastUpdated: Date;
  }> = new Map();

  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly contentItemRepository: IContentItemRepository,
    private readonly audioChunkRepository: IAudioChunkRepository,
    private readonly eventBus: IEventBus
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for job progress updates
    this.eventBus.subscribe(JobProgressUpdatedEvent.name, async (event: JobProgressUpdatedEvent) => {
      await this.handleJobProgressUpdated(event);
    });

    // Listen for item progress updates
    this.eventBus.subscribe(ItemProgressUpdatedEvent.name, async (event: ItemProgressUpdatedEvent) => {
      await this.handleItemProgressUpdated(event);
    });

    // Listen for chunk progress updates
    this.eventBus.subscribe(ChunkProgressUpdatedEvent.name, async (event: ChunkProgressUpdatedEvent) => {
      await this.handleChunkProgressUpdated(event);
    });
  }

  private async handleJobProgressUpdated(event: JobProgressUpdatedEvent): Promise<void> {
    const { jobId, completedItems, totalItems, failedItems } = event;

    try {
      // Update job progress tracking
      const progress = completedItems / Math.max(totalItems, 1);

      this.jobProgress.set(jobId, {
        totalItems,
        completedItems,
        failedItems,
        progress,
        lastUpdated: new Date(),
      });

    } catch (error) {
      console.error(`Failed to handle job progress update for job ${jobId}:`, error);
    }
  }

  private async handleItemProgressUpdated(event: ItemProgressUpdatedEvent): Promise<void> {
    const { itemId, currentStep, stepProgress, overallProgress } = event;

    try {
      // Update item progress tracking
      this.itemProgress.set(itemId, {
        currentStep,
        stepProgress,
        overallProgress,
        lastUpdated: new Date(),
      });

    } catch (error) {
      console.error(`Failed to handle item progress update for item ${itemId}:`, error);
    }
  }

  private async handleChunkProgressUpdated(event: ChunkProgressUpdatedEvent): Promise<void> {
    const { chunkId, status, progress } = event;

    try {
      // Update chunk progress tracking
      this.chunkProgress.set(chunkId, {
        status,
        progress,
        lastUpdated: new Date(),
      });

    } catch (error) {
      console.error(`Failed to handle chunk progress update for chunk ${chunkId}:`, error);
    }
  }

  public async getJobProgress(jobId: string): Promise<{
    totalItems: number;
    completedItems: number;
    failedItems: number;
    progress: number;
    estimatedCompletion?: Date;
  }> {
    try {
      // Check in-memory tracking first
      const trackedProgress = this.jobProgress.get(jobId);
      if (trackedProgress) {
        return trackedProgress;
      }

      // If not in memory, fetch from database
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        throw ErrorFactory.notFound(`Job with id ${jobId} not found`);
      }

      const progress = job.completedItems / Math.max(job.totalItems, 1);

      // Calculate estimated completion time
      let estimatedCompletion: Date | undefined;
      if (progress > 0 && progress < 1) {
        const elapsedTime = new Date().getTime() - job.createdAt.getTime();
        const estimatedTotalTime = elapsedTime / progress;
        const remainingTime = estimatedTotalTime - elapsedTime;
        estimatedCompletion = new Date(new Date().getTime() + remainingTime);
      }

      return {
        totalItems: job.totalItems,
        completedItems: job.completedItems,
        failedItems: job.failedItems,
        progress,
        estimatedCompletion,
      };

    } catch (error) {
      console.error(`Failed to get job progress for job ${jobId}:`, error);
      throw ErrorFactory.progressTrackingError('Failed to get job progress', error);
    }
  }

  public async getItemProgress(itemId: string): Promise<{
    currentStep: string;
    stepProgress: number;
    overallProgress: number;
    estimatedCompletion?: Date;
  }> {
    try {
      // Check in-memory tracking first
      const trackedProgress = this.itemProgress.get(itemId);
      if (trackedProgress) {
        return trackedProgress;
      }

      // If not in memory, fetch from database
      const item = await this.contentItemRepository.findById(itemId);
      if (!item) {
        throw ErrorFactory.notFound(`Content item with id ${itemId} not found`);
      }

      // Calculate progress based on current step
      const stepProgress = this.calculateStepProgress(item);
      const overallProgress = this.calculateOverallProgress(item);

      // Calculate estimated completion time
      let estimatedCompletion: Date | undefined;
      if (overallProgress > 0 && overallProgress < 1) {
        const job = await this.jobRepository.findById(item.jobId);
        if (job) {
          const elapsedTime = new Date().getTime() - item.createdAt.getTime();
          const estimatedTotalTime = elapsedTime / overallProgress;
          const remainingTime = estimatedTotalTime - elapsedTime;
          estimatedCompletion = new Date(new Date().getTime() + remainingTime);
        }
      }

      return {
        currentStep: item.currentStep,
        stepProgress,
        overallProgress,
        estimatedCompletion,
      };

    } catch (error) {
      console.error(`Failed to get item progress for item ${itemId}:`, error);
      throw ErrorFactory.progressTrackingError('Failed to get item progress', error);
    }
  }

  private calculateStepProgress(item: ContentItem): number {
    // Progress calculation would depend on the specific step
    // This is a simplified version
    switch (item.currentStep) {
      case 'validation':
        return item.status === 'validated' ? 1 : 0.5;
      case 'text_generation':
        return item.generatedText ? 1 : 0.5;
      case 'audio_generation':
        return item.audioChunks?.length > 0 ? 1 : 0.5;
      case 'merge':
        return item.finalAudioPath ? 1 : 0.5;
      default:
        return 0;
    }
  }

  private calculateOverallProgress(item: ContentItem): number {
    // Overall progress based on pipeline steps
    const steps = ['validation', 'text_generation', 'audio_generation', 'merge'];
    const currentStepIndex = steps.indexOf(item.currentStep);

    if (currentStepIndex === -1) return 0;

    const stepProgress = this.calculateStepProgress(item);
    const completedSteps = currentStepIndex;

    return (completedSteps + stepProgress) / steps.length;
  }

  public async getChunkProgress(chunkId: string): Promise<{
    status: string;
    progress: number;
    estimatedCompletion?: Date;
  }> {
    try {
      // Check in-memory tracking first
      const trackedProgress = this.chunkProgress.get(chunkId);
      if (trackedProgress) {
        return trackedProgress;
      }

      // If not in memory, fetch from database
      const chunk = await this.audioChunkRepository.findById(chunkId);
      if (!chunk) {
        throw ErrorFactory.notFound(`Audio chunk with id ${chunkId} not found`);
      }

      // Calculate progress based on status
      let progress = 0;
      switch (chunk.status) {
        case 'pending':
          progress = 0;
          break;
        case 'processing':
          progress = 0.5;
          break;
        case 'completed':
          progress = 1;
          break;
        case 'failed':
          progress = 0;
          break;
      }

      // Calculate estimated completion time
      let estimatedCompletion: Date | undefined;
      if (progress > 0 && progress < 1) {
        const elapsedTime = new Date().getTime() - chunk.createdAt.getTime();
        const estimatedTotalTime = elapsedTime / progress;
        const remainingTime = estimatedTotalTime - elapsedTime;
        estimatedCompletion = new Date(new Date().getTime() + remainingTime);
      }

      return {
        status: chunk.status,
        progress,
        estimatedCompletion,
      };

    } catch (error) {
      console.error(`Failed to get chunk progress for chunk ${chunkId}:`, error);
      throw ErrorFactory.progressTrackingError('Failed to get chunk progress', error);
    }
  }

  public async getPipelineProgress(jobId: string): Promise<{
    job: {
      id: string;
      name: string;
      status: string;
      progress: number;
    };
    items: Array<{
      id: string;
      title: string;
      status: string;
      progress: number;
      chunks: Array<{
        id: string;
        status: string;
        progress: number;
      }>;
    }>;
    overallProgress: number;
  }> {
    try {
      // Get job
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        throw ErrorFactory.notFound(`Job with id ${jobId} not found`);
      }

      // Get items for this job
      const items = await this.contentItemRepository.findByJobId(jobId);

      // Get chunks for each item
      const itemsWithChunks = await Promise.all(
        items.map(async (item) => {
          const chunks = await this.audioChunkRepository.findByItemId(item.id);
          return {
            ...item,
            chunks,
          };
        })
      );

      // Calculate overall progress
      const totalItems = itemsWithChunks.length;
      const completedItems = itemsWithChunks.filter(item => item.status === 'completed').length;
      const overallProgress = completedItems / Math.max(totalItems, 1);

      return {
        job: {
          id: job.id,
          name: job.name,
          status: job.status,
          progress: overallProgress,
        },
        items: itemsWithChunks.map(item => ({
          id: item.id,
          title: item.titre,
          status: item.status,
          progress: this.calculateOverallProgress(item),
          chunks: item.chunks.map(chunk => ({
            id: chunk.id,
            status: chunk.status,
            progress: chunk.status === 'completed' ? 1 : chunk.status === 'processing' ? 0.5 : 0,
          })),
        })),
        overallProgress,
      };

    } catch (error) {
      console.error(`Failed to get pipeline progress for job ${jobId}:`, error);
      throw ErrorFactory.progressTrackingError('Failed to get pipeline progress', error);
    }
  }

  public async resetTracking(): Promise<void> {
    // Clear all in-memory tracking
    this.jobProgress.clear();
    this.itemProgress.clear();
    this.chunkProgress.clear();
  }

  public async cleanupOldTracking(maxAgeMinutes: number = 60): Promise<void> {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    // Clean up old job progress entries
    for (const [jobId, progress] of this.jobProgress.entries()) {
      if (progress.lastUpdated < cutoff) {
        this.jobProgress.delete(jobId);
      }
    }

    // Clean up old item progress entries
    for (const [itemId, progress] of this.itemProgress.entries()) {
      if (progress.lastUpdated < cutoff) {
        this.itemProgress.delete(itemId);
      }
    }

    // Clean up old chunk progress entries
    for (const [chunkId, progress] of this.chunkProgress.entries()) {
      if (progress.lastUpdated < cutoff) {
        this.chunkProgress.delete(chunkId);
      }
    }
  }
}