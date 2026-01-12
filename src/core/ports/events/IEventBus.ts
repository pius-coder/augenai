// src/core/ports/events/IEventBus.ts
// Event bus port (pub/sub)

import type { DomainEvent } from '../../domain/events/base/DomainEvent';
import type { IEventHandler } from './IEventHandler';

export type EventType = string;

export interface UnsubscribeFn {
  (): void;
}

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  publishMany(events: DomainEvent[]): Promise<void>;

  subscribe(eventType: EventType, handler: IEventHandler): UnsubscribeFn;
  subscribeAll(handler: IEventHandler): UnsubscribeFn;
}
