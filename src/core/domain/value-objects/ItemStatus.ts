// src/core/domain/value-objects/ItemStatus.ts
// Enum + helpers for ContentItem statuses
// Imported by ContentItem entity

export enum ItemStatus {
  PENDING = 'PENDING',                     // Waiting for processing
  VALIDATING = 'VALIDATING',               // Validating data
  GENERATING_TEXT = 'GENERATING_TEXT',     // Generating text via AI
  CHUNKING = 'CHUNKING',                   // Splitting text into chunks
  GENERATING_AUDIO = 'GENERATING_AUDIO',   // Generating audio for chunks
  MERGING = 'MERGING',                     // Merging audio chunks
  UPLOADING = 'UPLOADING',                 // Final upload/save
  COMPLETED = 'COMPLETED',                 // Successfully completed
  FAILED = 'FAILED',                       // Failed
  SKIPPED = 'SKIPPED',                     // Skipped (validation failed)
}

export class ItemStatusHelper {
  // Get the pipeline step order
  static getPipelineOrder(): ItemStatus[] {
    return [
      ItemStatus.PENDING,
      ItemStatus.VALIDATING,
      ItemStatus.GENERATING_TEXT,
      ItemStatus.CHUNKING,
      ItemStatus.GENERATING_AUDIO,
      ItemStatus.MERGING,
      ItemStatus.UPLOADING,
      ItemStatus.COMPLETED,
    ];
  }

  // Check if status is terminal (can't be changed)
  static isTerminal(status: ItemStatus): boolean {
    return [
      ItemStatus.COMPLETED,
      ItemStatus.FAILED,
      ItemStatus.SKIPPED,
    ].includes(status);
  }

  // Check if status is processing (active work)
  static isProcessing(status: ItemStatus): boolean {
    return [
      ItemStatus.VALIDATING,
      ItemStatus.GENERATING_TEXT,
      ItemStatus.CHUNKING,
      ItemStatus.GENERATING_AUDIO,
      ItemStatus.MERGING,
      ItemStatus.UPLOADING,
    ].includes(status);
  }

  // Get next status in pipeline
  static getNextStatus(current: ItemStatus): ItemStatus | null {
    const order = this.getPipelineOrder();
    const currentIndex = order.indexOf(current);
    
    if (currentIndex === -1 || currentIndex === order.length - 1) {
      return null;
    }
    
    return order[currentIndex + 1];
  }

  // Get previous status in pipeline
  static getPreviousStatus(current: ItemStatus): ItemStatus | null {
    const order = this.getPipelineOrder();
    const currentIndex = order.indexOf(current);
    
    if (currentIndex <= 0) {
      return null;
    }
    
    return order[currentIndex - 1];
  }

  // Get progress percentage (0-100)
  static getProgressPercentage(status: ItemStatus): number {
    const order = this.getPipelineOrder();
    const index = order.indexOf(status);
    
    if (index === -1) {
      return 0;
    }
    
    return Math.round((index / (order.length - 1)) * 100);
  }

  // Get display label
  static getLabel(status: ItemStatus): string {
    const labels: Record<ItemStatus, string> = {
      [ItemStatus.PENDING]: 'Pending',
      [ItemStatus.VALIDATING]: 'Validating',
      [ItemStatus.GENERATING_TEXT]: 'Generating Text',
      [ItemStatus.CHUNKING]: 'Chunking',
      [ItemStatus.GENERATING_AUDIO]: 'Generating Audio',
      [ItemStatus.MERGING]: 'Merging Audio',
      [ItemStatus.UPLOADING]: 'Uploading',
      [ItemStatus.COMPLETED]: 'Completed',
      [ItemStatus.FAILED]: 'Failed',
      [ItemStatus.SKIPPED]: 'Skipped',
    };
    return labels[status];
  }

  // Get display variant for UI
  static getVariant(status: ItemStatus): 'default' | 'success' | 'warning' | 'error' | 'info' {
    const variants: Record<ItemStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      [ItemStatus.PENDING]: 'default',
      [ItemStatus.VALIDATING]: 'info',
      [ItemStatus.GENERATING_TEXT]: 'info',
      [ItemStatus.CHUNKING]: 'info',
      [ItemStatus.GENERATING_AUDIO]: 'info',
      [ItemStatus.MERGING]: 'info',
      [ItemStatus.UPLOADING]: 'info',
      [ItemStatus.COMPLETED]: 'success',
      [ItemStatus.FAILED]: 'error',
      [ItemStatus.SKIPPED]: 'warning',
    };
    return variants[status];
  }

  // Validate status transition
  static isValidTransition(from: ItemStatus, to: ItemStatus): boolean {
    if (this.isTerminal(from)) {
      return false;
    }

    const validTransitions: Record<ItemStatus, ItemStatus[]> = {
      [ItemStatus.PENDING]: [ItemStatus.VALIDATING, ItemStatus.SKIPPED, ItemStatus.FAILED],
      [ItemStatus.VALIDATING]: [ItemStatus.GENERATING_TEXT, ItemStatus.SKIPPED, ItemStatus.FAILED],
      [ItemStatus.GENERATING_TEXT]: [ItemStatus.CHUNKING, ItemStatus.FAILED],
      [ItemStatus.CHUNKING]: [ItemStatus.GENERATING_AUDIO, ItemStatus.FAILED],
      [ItemStatus.GENERATING_AUDIO]: [ItemStatus.MERGING, ItemStatus.FAILED],
      [ItemStatus.MERGING]: [ItemStatus.UPLOADING, ItemStatus.FAILED],
      [ItemStatus.UPLOADING]: [ItemStatus.COMPLETED, ItemStatus.FAILED],
      [ItemStatus.COMPLETED]: [],
      [ItemStatus.FAILED]: [ItemStatus.VALIDATING], // Allow retry
      [ItemStatus.SKIPPED]: [],
    };

    return validTransitions[from]?.includes(to) || false;
  }
}
