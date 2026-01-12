// src/infrastructure/streaming/channels/JobChannel.ts
// Job-specific SSE channel for job progress updates

import { SSEManager } from '../SSEManager';
import { SSEEvent } from '@/core/ports/streaming/ISSEService';

export interface JobProgressData {
  jobId: string;
  status: string;
  progressPercentage: number;
  completedItems: number;
  totalItems: number;
  failedItems: number;
  currentStep?: string;
}

export interface JobEventData {
  type: 'progress' | 'completed' | 'failed' | 'paused' | 'cancelled' | 'started';
  timestamp: Date;
  data: JobProgressData;
}

export class JobChannel {
  private static readonly CHANNEL_PREFIX = 'job:';

  constructor(private readonly sseManager: SSEManager) {}

  private getChannelName(jobId: string): string {
    return `${JobChannel.CHANNEL_PREFIX}${jobId}`;
  }

  async broadcastProgress(jobId: string, data: JobProgressData): Promise<void> {
    const event: SSEEvent<JobEventData> = {
      event: 'progress',
      data: {
        type: 'progress',
        timestamp: new Date(),
        data,
      },
    };

    await this.sseManager.broadcast(this.getChannelName(jobId), event);
  }

  async broadcastJobStarted(jobId: string, data: JobProgressData): Promise<void> {
    const event: SSEEvent<JobEventData> = {
      event: 'started',
      data: {
        type: 'started',
        timestamp: new Date(),
        data,
      },
    };

    await this.sseManager.broadcast(this.getChannelName(jobId), event);
  }

  async broadcastJobCompleted(jobId: string, data: JobProgressData): Promise<void> {
    const event: SSEEvent<JobEventData> = {
      event: 'completed',
      data: {
        type: 'completed',
        timestamp: new Date(),
        data,
      },
    };

    await this.sseManager.broadcast(this.getChannelName(jobId), event);
  }

  async broadcastJobFailed(jobId: string, data: JobProgressData, error?: string): Promise<void> {
    const event: SSEEvent<JobEventData & { error?: string }> = {
      event: 'failed',
      data: {
        type: 'failed',
        timestamp: new Date(),
        data,
        error,
      },
    };

    await this.sseManager.broadcast(this.getChannelName(jobId), event);
  }

  async broadcastJobPaused(jobId: string, data: JobProgressData): Promise<void> {
    const event: SSEEvent<JobEventData> = {
      event: 'paused',
      data: {
        type: 'paused',
        timestamp: new Date(),
        data,
      },
    };

    await this.sseManager.broadcast(this.getChannelName(jobId), event);
  }

  async broadcastJobCancelled(jobId: string, data: JobProgressData): Promise<void> {
    const event: SSEEvent<JobEventData> = {
      event: 'cancelled',
      data: {
        type: 'cancelled',
        timestamp: new Date(),
        data,
      },
    };

    await this.sseManager.broadcast(this.getChannelName(jobId), event);
  }
}
