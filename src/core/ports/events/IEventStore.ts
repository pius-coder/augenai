// src/core/ports/events/IEventStore.ts
// Event store port (optional persistence/replay)

import type { DomainEvent } from '../../domain/events/base/DomainEvent';

export interface EventStoreQuery {
  eventType?: string;
  since?: Date;
  until?: Date;
  limit?: number;
  offset?: number;
}

export interface IEventStore {
  append(event: DomainEvent): Promise<void>;
  appendMany(events: DomainEvent[]): Promise<void>;

  getEvents(query?: EventStoreQuery): Promise<DomainEvent[]>;
}
