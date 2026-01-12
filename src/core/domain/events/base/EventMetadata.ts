// src/core/domain/events/base/EventMetadata.ts
// Metadata for domain events (timestamp, correlationId)
// Used by DomainEvent

export interface EventMetadata {
  timestamp: Date;
  correlationId?: string;
  causationId?: string;
  userId?: string;
  [key: string]: unknown;
}

export class EventMetadataBuilder {
  private metadata: Partial<EventMetadata> = {};

  constructor() {
    this.metadata.timestamp = new Date();
  }

  static create(): EventMetadataBuilder {
    return new EventMetadataBuilder();
  }

  withCorrelationId(correlationId: string): this {
    this.metadata.correlationId = correlationId;
    return this;
  }

  withCausationId(causationId: string): this {
    this.metadata.causationId = causationId;
    return this;
  }

  withUserId(userId: string): this {
    this.metadata.userId = userId;
    return this;
  }

  withCustomData(key: string, value: unknown): this {
    this.metadata[key] = value;
    return this;
  }

  build(): EventMetadata {
    return {
      timestamp: this.metadata.timestamp || new Date(),
      correlationId: this.metadata.correlationId,
      causationId: this.metadata.causationId,
      userId: this.metadata.userId,
      ...this.metadata,
    };
  }
}
