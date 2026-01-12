// src/infrastructure/streaming/channels/ItemChannel.ts
// Item-specific SSE channel for item progress and text streaming

import { SSEManager } from '../SSEManager';
import { SSEEvent } from '@/core/ports/streaming/ISSEService';

export interface ItemProgressData {
  itemId: string;
  jobId: string;
  status: string;
  currentStep: string;
  progressPercentage: number;
  generatedText?: string;
  audioPath?: string;
  retryCount: number;
}

export interface TextStreamData {
  itemId: string;
  text: string;
  charCount: number;
  isComplete: boolean;
}

export interface ItemEventData {
  type: 'progress' | 'text_stream' | 'completed' | 'failed';
  timestamp: Date;
  data: ItemProgressData | TextStreamData;
}

export class ItemChannel {
  private static readonly CHANNEL_PREFIX = 'item:';

  constructor(private readonly sseManager: SSEManager) {}

  private getChannelName(itemId: string): string {
    return `${ItemChannel.CHANNEL_PREFIX}${itemId}`;
  }

  async broadcastProgress(itemId: string, data: ItemProgressData): Promise<void> {
    const event: SSEEvent<ItemEventData> = {
      event: 'progress',
      data: {
        type: 'progress',
        timestamp: new Date(),
        data,
      },
    };

    await this.sseManager.broadcast(this.getChannelName(itemId), event);
  }

  async broadcastTextStream(itemId: string, data: TextStreamData): Promise<void> {
    const event: SSEEvent<ItemEventData> = {
      event: 'text_stream',
      data: {
        type: 'text_stream',
        timestamp: new Date(),
        data,
      },
    };

    await this.sseManager.broadcast(this.getChannelName(itemId), event);
  }

  async broadcastItemCompleted(itemId: string, data: ItemProgressData): Promise<void> {
    const event: SSEEvent<ItemEventData> = {
      event: 'completed',
      data: {
        type: 'completed',
        timestamp: new Date(),
        data,
      },
    };

    await this.sseManager.broadcast(this.getChannelName(itemId), event);
  }

  async broadcastItemFailed(itemId: string, data: ItemProgressData, error?: string): Promise<void> {
    const event: SSEEvent<ItemEventData & { error?: string }> = {
      event: 'failed',
      data: {
        type: 'failed',
        timestamp: new Date(),
        data,
        error,
      },
    };

    await this.sseManager.broadcast(this.getChannelName(itemId), event);
  }
}
