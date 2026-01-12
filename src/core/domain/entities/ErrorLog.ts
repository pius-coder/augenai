// src/core/domain/entities/ErrorLog.ts
// Error log entity - records errors for retry/debug purposes
// Tracks errors at job, item, or chunk level

import { ValidationError } from '@/shared/utils/errors/AppError';
import { PipelineStep } from './ContentItem';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorLogData {
  id: string;
  jobId?: string;
  itemId?: string;
  chunkId?: string;
  step: PipelineStep;
  errorCode?: string;
  message: string;
  details?: string;
  stackTrace?: string;
  isRetryable: boolean;
  wasRetried: boolean;
  retriedAt?: Date;
  createdAt: Date;
}

export class ErrorLog {
  private constructor(
    public readonly id: string,
    public readonly jobId: string | undefined,
    public readonly itemId: string | undefined,
    public readonly chunkId: string | undefined,
    public readonly step: PipelineStep,
    public readonly errorCode: string | undefined,
    private _message: string,
    public readonly details: string | undefined,
    public readonly stackTrace: string | undefined,
    public readonly isRetryable: boolean,
    private _wasRetried: boolean,
    private _retriedAt: Date | undefined,
    public readonly createdAt: Date
  ) {}

  static create(params: {
    jobId?: string;
    itemId?: string;
    chunkId?: string;
    step: PipelineStep;
    errorCode?: string;
    message: string;
    details?: string;
    stackTrace?: string;
    isRetryable: boolean;
  }): ErrorLog {
    if (!params.message || params.message.trim().length === 0) {
      throw new ValidationError('Error message cannot be empty');
    }

    if (params.message.length > 5000) {
      throw new ValidationError('Error message cannot exceed 5000 characters');
    }

    if (params.details && params.details.length > 10000) {
      throw new ValidationError('Error details cannot exceed 10000 characters');
    }

    const now = new Date();
    const id = `error_log_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return new ErrorLog(
      id,
      params.jobId,
      params.itemId,
      params.chunkId,
      params.step,
      params.errorCode,
      params.message.trim(),
      params.details,
      params.stackTrace,
      params.isRetryable,
      false,
      undefined,
      now
    );
  }

  static fromPersistence(data: ErrorLogData): ErrorLog {
    return new ErrorLog(
      data.id,
      data.jobId,
      data.itemId,
      data.chunkId,
      data.step,
      data.errorCode,
      data.message,
      data.details,
      data.stackTrace,
      data.isRetryable,
      data.wasRetried,
      data.retriedAt,
      data.createdAt
    );
  }

  get message(): string {
    return this._message;
  }

  get wasRetried(): boolean {
    return this._wasRetried;
  }

  get retriedAt(): Date | undefined {
    return this._retriedAt;
  }

  public markAsRetried(): void {
    if (this._wasRetried) {
      throw new ValidationError('Error has already been retried');
    }

    if (!this.isRetryable) {
      throw new ValidationError('Cannot retry a non-retryable error');
    }

    this._wasRetried = true;
    this._retriedAt = new Date();
  }

  public getSeverity(): ErrorSeverity {
    if (this.step === PipelineStep.AUDIO_MERGE || this.step === PipelineStep.UPLOAD) {
      return ErrorSeverity.HIGH;
    }

    if (this.errorCode === 'RATE_LIMIT' || this.errorCode === 'AUTH_ERROR') {
      return ErrorSeverity.CRITICAL;
    }

    if (this.errorCode === 'TIMEOUT' || this.errorCode === 'NETWORK_ERROR') {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  public getContext(): string {
    const parts: string[] = [];

    if (this.jobId) parts.push(`Job: ${this.jobId}`);
    if (this.itemId) parts.push(`Item: ${this.itemId}`);
    if (this.chunkId) parts.push(`Chunk: ${this.chunkId}`);
    parts.push(`Step: ${this.step}`);

    return parts.join(' | ');
  }

  public getFullMessage(): string {
    let full = `[${this.step}] ${this._message}`;

    if (this.errorCode) {
      full = `[${this.errorCode}] ${full}`;
    }

    return full;
  }

  public getTimeSinceError(): number {
    return Date.now() - this.createdAt.getTime();
  }

  public isRecent(thresholdMs: number = 60000): boolean {
    return this.getTimeSinceError() < thresholdMs;
  }

  public isStale(thresholdMs: number = 3600000): boolean {
    return this.getTimeSinceError() > thresholdMs;
  }

  public toPersistence(): ErrorLogData {
    return {
      id: this.id,
      jobId: this.jobId,
      itemId: this.itemId,
      chunkId: this.chunkId,
      step: this.step,
      errorCode: this.errorCode,
      message: this._message,
      details: this.details,
      stackTrace: this.stackTrace,
      isRetryable: this.isRetryable,
      wasRetried: this._wasRetried,
      retriedAt: this._retriedAt,
      createdAt: this.createdAt,
    };
  }

  public toJSON() {
    return {
      ...this.toPersistence(),
      severity: this.getSeverity(),
      context: this.getContext(),
      fullMessage: this.getFullMessage(),
      timeSinceErrorMs: this.getTimeSinceError(),
      isRecent: this.isRecent(),
      isStale: this.isStale(),
    };
  }
}
