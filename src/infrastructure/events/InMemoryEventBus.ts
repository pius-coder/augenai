// src/infrastructure/events/InMemoryEventBus.ts
// In-memory event bus implementation for pub/sub

import {
  IEventBus,
  EventType,
  UnsubscribeFn,
} from '@/core/ports/events/IEventBus';
import { DomainEvent } from '@/core/domain/events/base/DomainEvent';
import { IEventHandler } from '@/core/ports/events/IEventHandler';

type EventSubscription = {
  eventType: EventType;
  handler: IEventHandler;
  createdAt: Date;
};

export class InMemoryEventBus implements IEventBus {
  private readonly subscriptions: Map<string, EventSubscription[]> = new Map();
  private readonly allHandlers: EventSubscription[] = [];

  async publish(event: DomainEvent): Promise<void> {
    const eventType = event.eventType;

    // Get all subscribers for this event type
    const specificSubscribers = this.subscriptions.get(eventType) || [];
    const allSubscribers = this.allHandlers;

    // Combine and deduplicate handlers
    const allHandlersToCall = [
      ...specificSubscribers,
      ...allSubscribers,
    ];

    // Execute handlers asynchronously (non-blocking)
    const promises = allHandlersToCall.map(({ handler }) =>
      this.safeHandle(event, handler)
    );

    // Wait for all handlers to complete
    await Promise.allSettled(promises);
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    const promises = events.map((event) => this.publish(event));
    await Promise.all(promises);
  }

  subscribe(eventType: EventType, handler: IEventHandler): UnsubscribeFn {
    const subscription: EventSubscription = {
      eventType,
      handler,
      createdAt: new Date(),
    };

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    this.subscriptions.get(eventType)!.push(subscription);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(eventType, handler);
    };
  }

  subscribeAll(handler: IEventHandler): UnsubscribeFn {
    const subscription: EventSubscription = {
      eventType: '*',
      handler,
      createdAt: new Date(),
    };

    this.allHandlers.push(subscription);

    // Return unsubscribe function
    return () => {
      this.unsubscribeAll(handler);
    };
  }

  private unsubscribe(eventType: EventType, handler: IEventHandler): void {
    const subscriptions = this.subscriptions.get(eventType);

    if (!subscriptions) {
      return;
    }

    const index = subscriptions.findIndex((s) => s.handler === handler);

    if (index !== -1) {
      subscriptions.splice(index, 1);
    }

    // Clean up empty arrays
    if (subscriptions.length === 0) {
      this.subscriptions.delete(eventType);
    }
  }

  private unsubscribeAll(handler: IEventHandler): void {
    const index = this.allHandlers.findIndex((s) => s.handler === handler);

    if (index !== -1) {
      this.allHandlers.splice(index, 1);
    }
  }

  private async safeHandle(event: DomainEvent, handler: IEventHandler): Promise<void> {
    try {
      await handler.handle(event);
    } catch (error) {
      console.error(
        `Error in event handler ${handler.constructor.name} for event ${event.eventType}:`,
        error
      );

      // Optionally publish an error event
      // await this.publishErrorEvent(event, error);
    }
  }

  getSubscriptionCount(eventType?: EventType): number {
    if (eventType) {
      return (this.subscriptions.get(eventType) || []).length + this.allHandlers.length;
    }

    // Count all subscriptions
    let count = this.allHandlers.length;

    for (const subscriptions of this.subscriptions.values()) {
      count += subscriptions.length;
    }

    return count;
  }

  clear(): void {
    this.subscriptions.clear();
    this.allHandlers.length = 0;
  }
}
