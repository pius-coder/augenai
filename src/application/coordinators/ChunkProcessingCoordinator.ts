// src/application/coordinators/ChunkProcessingCoordinator.ts
// Coordinator: Track audio chunk processing and trigger merge when all done

import { IAudioChunkRepository } from '@/core/ports/repositories/IAudioChunkRepository';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { IQueueManager } from '@/core/ports/queue/IQueueManager';
import { ChunkAudioGeneratedEvent } from '@/core/domain/events/chunk/ChunkAudioGeneratedEvent';
import { ChunkFailedEvent } from '@/core/domain/events/chunk/ChunkFailedEvent';
import { MergeAudioChunksUseCase } from '@/core/domain/use-cases/content/MergeAudioChunksUseCase';
import { ContentItem } from '@/core/domain/entities/ContentItem';
import { AudioChunk } from '@/core/domain/entities/AudioChunk';
import { ChunkStatus } from '@/core/domain/value-objects/ChunkStatus';
import { ItemStatus } from '@/core/domain/value-objects/ItemStatus';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export class ChunkProcessingCoordinator {
  private readonly pendingChunks: Map<string, Set<string>> = new Map(); // itemId -> Set<chunkIds>
  private readonly completedChunks: Map<string, Set<string>> = new Map(); // itemId -> Set<chunkIds>
  private readonly failedChunks: Map<string, Set<string>> = new Map(); // itemId -> Set<chunkIds>

  constructor(
    private readonly audioChunkRepository: IAudioChunkRepository,
    private readonly contentItemRepository: IContentItemRepository,
    private readonly eventBus: IEventBus,
    private readonly queueManager: IQueueManager,
    private readonly mergeAudioChunksUseCase: MergeAudioChunksUseCase
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for chunk audio generated events
    this.eventBus.subscribe(ChunkAudioGeneratedEvent.name, async (event: ChunkAudioGeneratedEvent) => {
      await this.handleChunkAudioGenerated(event);
    });

    // Listen for chunk failed events
    this.eventBus.subscribe(ChunkFailedEvent.name, async (event: ChunkFailedEvent) => {
      await this.handleChunkFailed(event);
    });
  }

  private async handleChunkAudioGenerated(event: ChunkAudioGeneratedEvent): Promise<void> {
    const { itemId, chunkId } = event;

    // Initialize tracking for this item if not exists
    if (!this.pendingChunks.has(itemId)) {
      this.pendingChunks.set(itemId, new Set());
    }
    if (!this.completedChunks.has(itemId)) {
      this.completedChunks.set(itemId, new Set());
    }

    // Remove from pending, add to completed
    this.pendingChunks.get(itemId)?.delete(chunkId);
    this.completedChunks.get(itemId)?.add(chunkId);

    // Check if all chunks for this item are completed
    await this.checkItemCompletion(itemId);
  }

  private async handleChunkFailed(event: ChunkFailedEvent): Promise<void> {
    const { itemId, chunkId, error } = event;

    // Initialize tracking for this item if not exists
    if (!this.pendingChunks.has(itemId)) {
      this.pendingChunks.set(itemId, new Set());
    }
    if (!this.failedChunks.has(itemId)) {
      this.failedChunks.set(itemId, new Set());
    }

    // Remove from pending, add to failed
    this.pendingChunks.get(itemId)?.delete(chunkId);
    this.failedChunks.get(itemId)?.add(chunkId);

    // Check if we should fail the entire item
    const item = await this.contentItemRepository.findById(itemId);
    if (item) {
      const totalChunks = await this.audioChunkRepository.countByItemId(itemId);
      const failedCount = this.failedChunks.get(itemId)?.size || 0;

      // If too many chunks failed, fail the item
      if (failedCount >= Math.ceil(totalChunks * 0.5)) {
        item.setStatus(ItemStatus.FAILED);
        await this.contentItemRepository.save(item);
      }
    }
  }

  public async registerItemChunks(itemId: string, chunkIds: string[]): Promise<void> {
    // Initialize tracking for this item
    this.pendingChunks.set(itemId, new Set(chunkIds));
    this.completedChunks.set(itemId, new Set());
    this.failedChunks.set(itemId, new Set());
  }

  private async checkItemCompletion(itemId: string): Promise<void> {
    const pendingCount = this.pendingChunks.get(itemId)?.size || 0;
    const completedCount = this.completedChunks.get(itemId)?.size || 0;

    // If no pending chunks left, all chunks are processed
    if (pendingCount === 0) {
      // Check if we have any completed chunks to merge
      if (completedCount > 0) {
        await this.triggerMerge(itemId);
      }
    }
  }

  private async triggerMerge(itemId: string): Promise<void> {
    try {
      // Get the item
      const item = await this.contentItemRepository.findById(itemId);
      if (!item) {
        throw ErrorFactory.notFound(`Content item with id ${itemId} not found`);
      }

      // Check if item is still in audio generation status
      if (item.status !== ItemStatus.AUDIO_GENERATION) {
        return; // Item status changed, don't merge
      }

      // Execute merge use case
      await this.mergeAudioChunksUseCase.execute({ itemId });

      // Clean up tracking
      this.pendingChunks.delete(itemId);
      this.completedChunks.delete(itemId);
      this.failedChunks.delete(itemId);
    } catch (error) {
      console.error(`Failed to merge audio chunks for item ${itemId}:`, error);
      
      // Mark item as failed if merge fails
      const item = await this.contentItemRepository.findById(itemId);
      if (item) {
        item.setStatus(ItemStatus.FAILED);
        await this.contentItemRepository.save(item);
      }
    }
  }

  public async getChunkStatus(itemId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    pending: number;
  }> {
    const total = await this.audioChunkRepository.countByItemId(itemId);
    const completed = this.completedChunks.get(itemId)?.size || 0;
    const failed = this.failedChunks.get(itemId)?.size || 0;
    const pending = this.pendingChunks.get(itemId)?.size || 0;

    return { total, completed, failed, pending };
  }

  public async resetItemTracking(itemId: string): Promise<void> {
    this.pendingChunks.delete(itemId);
    this.completedChunks.delete(itemId);
    this.failedChunks.delete(itemId);
  }
}