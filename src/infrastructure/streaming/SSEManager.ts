// src/infrastructure/streaming/SSEManager.ts
// SSE manager for real-time streaming to clients

import {
  IStreamManager,
  StreamSubscriber,
  UnsubscribeStreamFn,
} from '@/core/ports/streaming/IStreamManager';
import { SSEChannel, SSEEvent } from '@/core/ports/streaming/ISSEService';

type ChannelSubscription<T = unknown> = {
  subscriber: StreamSubscriber<T>;
  createdAt: Date;
};

export class SSEManager implements IStreamManager {
  private readonly channels: Map<string, ChannelSubscription[]> = new Map();

  subscribe<T>(
    channel: SSEChannel,
    subscriber: StreamSubscriber<T>
  ): UnsubscribeStreamFn {
    if (!channel || channel.trim().length === 0) {
      throw new Error('Channel name cannot be empty');
    }

    const subscription: ChannelSubscription = {
      subscriber,
      createdAt: new Date(),
    };

    if (!this.channels.has(channel)) {
      this.channels.set(channel, []);
    }

    this.channels.get(channel)!.push(subscription);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(channel, subscriber);
    };
  }

  async broadcast<T>(channel: SSEChannel, event: SSEEvent<T>): Promise<void> {
    const subscribers = this.channels.get(channel);

    if (!subscribers || subscribers.length === 0) {
      // No subscribers, nothing to do
      return;
    }

    // Create a copy to avoid issues if subscribers are removed during iteration
    const subscribersCopy = [...subscribers];

    // Execute subscribers asynchronously (non-blocking)
    const promises = subscribersCopy.map(({ subscriber }) =>
      this.safeNotify(event, subscriber)
    );

    // Wait for all handlers to complete
    await Promise.allSettled(promises);
  }

  getSubscriberCount(channel: SSEChannel): number {
    const subscribers = this.channels.get(channel);
    return subscribers ? subscribers.length : 0;
  }

  getTotalSubscriberCount(): number {
    let count = 0;

    for (const subscribers of this.channels.values()) {
      count += subscribers.length;
    }

    return count;
  }

  getChannels(): SSEChannel[] {
    return Array.from(this.channels.keys());
  }

  unsubscribe<T>(channel: SSEChannel, subscriber: StreamSubscriber<T>): void {
    const subscribers = this.channels.get(channel);

    if (!subscribers) {
      return;
    }

    const index = subscribers.findIndex((s) => s.subscriber === subscriber);

    if (index !== -1) {
      subscribers.splice(index, 1);
    }

    // Clean up empty channels
    if (subscribers.length === 0) {
      this.channels.delete(channel);
    }
  }

  clearChannel(channel: SSEChannel): void {
    this.channels.delete(channel);
  }

  clear(): void {
    this.channels.clear();
  }

  private async safeNotify<T>(
    event: SSEEvent<T>,
    subscriber: StreamSubscriber<T>
  ): Promise<void> {
    try {
      await subscriber(event);
    } catch (error) {
      console.error('Error in SSE subscriber:', error);
      // Optionally unsubscribe failing subscriber
    }
  }
}
