// src/core/domain/value-objects/ChunkStatus.ts
// Enum for AudioChunk statuses
// Imported by AudioChunk entity

export enum ChunkStatus {
  PENDING = 'PENDING',         // Waiting for processing
  PROCESSING = 'PROCESSING',   // Generating audio
  COMPLETED = 'COMPLETED',     // Audio generated successfully
  FAILED = 'FAILED',          // Generation failed
}

export class ChunkStatusHelper {
  // Check if status is terminal
  static isTerminal(status: ChunkStatus): boolean {
    return [ChunkStatus.COMPLETED, ChunkStatus.FAILED].includes(status);
  }

  // Check if status is processing
  static isProcessing(status: ChunkStatus): boolean {
    return status === ChunkStatus.PROCESSING;
  }

  // Check if chunk can be retried
  static canRetry(status: ChunkStatus): boolean {
    return status === ChunkStatus.FAILED;
  }

  // Get display label
  static getLabel(status: ChunkStatus): string {
    const labels: Record<ChunkStatus, string> = {
      [ChunkStatus.PENDING]: 'Pending',
      [ChunkStatus.PROCESSING]: 'Processing',
      [ChunkStatus.COMPLETED]: 'Completed',
      [ChunkStatus.FAILED]: 'Failed',
    };
    return labels[status];
  }

  // Get display variant
  static getVariant(status: ChunkStatus): 'default' | 'success' | 'error' | 'info' {
    const variants: Record<ChunkStatus, 'default' | 'success' | 'error' | 'info'> = {
      [ChunkStatus.PENDING]: 'default',
      [ChunkStatus.PROCESSING]: 'info',
      [ChunkStatus.COMPLETED]: 'success',
      [ChunkStatus.FAILED]: 'error',
    };
    return variants[status];
  }
}
