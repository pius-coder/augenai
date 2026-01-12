// src/core/domain/events/base/DomainEvent.ts
// Base interface for all domain events
// Extended by all specific events

import { EventMetadata } from './EventMetadata';

export interface DomainEvent<T = unknown> {
  readonly eventType: string;
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly metadata: EventMetadata;
  readonly payload: T;
}

export abstract class BaseDomainEvent<T = unknown> implements DomainEvent<T> {
  public readonly eventId: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly eventType: string,
    public readonly payload: T,
    public readonly metadata: EventMetadata
  ) {
    this.eventId = this.generateEventId();
    this.occurredAt = metadata.timestamp || new Date();
  }

  private generateEventId(): string {
    return `${this.eventType}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  public toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredAt: this.occurredAt.toISOString(),
      metadata: this.metadata,
      payload: this.payload,
    };
  }
}
