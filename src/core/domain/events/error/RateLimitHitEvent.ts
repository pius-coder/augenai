// src/core/domain/events/error/RateLimitHitEvent.ts

import { BaseDomainEvent } from '../base/DomainEvent';
import { EventMetadata } from '../base/EventMetadata';

export interface RateLimitHitPayload {
  jobId?: string;
  itemId?: string;
  service: string; // e.g., 'anthropic', 'elevenlabs'
  endpoint?: string;
  limit: number;
  remaining: number;
  resetAt: Date;
  occurredAt: Date;
}

export class RateLimitHitEvent extends BaseDomainEvent<RateLimitHitPayload> {
  constructor(payload: RateLimitHitPayload, metadata: EventMetadata) {
    super('error.ratelimit.hit', payload, metadata);
  }
}
