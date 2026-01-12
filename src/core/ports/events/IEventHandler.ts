// src/core/ports/events/IEventHandler.ts
// Event handler port

import type { DomainEvent } from '../../domain/events/base/DomainEvent';

export interface IEventHandler<TEvent extends DomainEvent = DomainEvent> {
  handle(event: TEvent): Promise<void>;
}
