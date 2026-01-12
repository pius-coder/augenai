// src/core/domain/entities/AudioChunk.ts
// Audio chunk entity - represents a generated audio file for a text chunk
// Imports: ChunkStatus, AudioMetadata

import { ChunkStatus, ChunkStatusHelper } from '../value-objects/ChunkStatus';
import { AudioMetadata, AudioMetadataData } from '../value-objects/AudioMetadata';
import { ValidationError } from '@/shared/utils/errors/AppError';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface AudioChunkData {
  id: string;
  itemId: string;
  textChunkId: string;
  index: number;
  status: ChunkStatus;
  audioPath?: string;
  duration?: number;
  fileSize?: number;
  audioMetadata?: AudioMetadata;
  voiceId?: string;
  retryCount: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export class AudioChunk {
  private constructor(
    public readonly id: string,
    public readonly itemId: string,
    public readonly textChunkId: string,
    public readonly index: number,
    private _status: ChunkStatus,
    public audioPath: string | undefined,
    public duration: number | undefined,
    public fileSize: number | undefined,
    public audioMetadata: AudioMetadata | undefined,
    public voiceId: string | undefined,
    public retryCount: number,
    public lastError: string | undefined,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public completedAt: Date | undefined
  ) {}

  static create(itemId: string, textChunkId: string, index: number, voiceId: string): AudioChunk {
    const now = new Date();
    const id = `audio_chunk_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return new AudioChunk(
      id,
      itemId,
      textChunkId,
      index,
      ChunkStatus.PENDING,
      undefined,
      undefined,
      undefined,
      undefined,
      voiceId,
      0,
      undefined,
      now,
      now,
      undefined
    );
  }

  static fromPersistence(data: AudioChunkData): AudioChunk {
    return new AudioChunk(
      data.id,
      data.itemId,
      data.textChunkId,
      data.index,
      data.status,
      data.audioPath,
      data.duration,
      data.fileSize,
      data.audioMetadata,
      data.voiceId,
      data.retryCount,
      data.lastError,
      data.createdAt,
      data.updatedAt,
      data.completedAt
    );
  }

  get status(): ChunkStatus {
    return this._status;
  }

  public startProcessing(): void {
    if (this._status !== ChunkStatus.PENDING && this._status !== ChunkStatus.FAILED) {
      throw ErrorFactory.invalidConfig(
        'chunk.status',
        `Cannot start processing in ${this._status} status`
      );
    }

    this._status = ChunkStatus.PROCESSING;
    this.lastError = undefined;
    this.updatedAt = new Date();
  }

  public complete(audioPath: string, duration: number, fileSize: number, metadata?: AudioMetadataData): void {
    if (!audioPath || audioPath.trim().length === 0) {
      throw new ValidationError('Audio path cannot be empty');
    }

    if (duration < 0) {
      throw new ValidationError('Duration cannot be negative');
    }

    if (fileSize < 0) {
      throw new ValidationError('File size cannot be negative');
    }

    this._status = ChunkStatus.COMPLETED;
    this.audioPath = audioPath;
    this.duration = duration;
    this.fileSize = fileSize;
    this.audioMetadata = metadata ? AudioMetadata.create(metadata) : undefined;
    this.lastError = undefined;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  public fail(reason: string): void {
    if (!reason || reason.trim().length === 0) {
      throw new ValidationError('Error reason cannot be empty');
    }

    this._status = ChunkStatus.FAILED;
    this.lastError = reason;
    this.updatedAt = new Date();
  }

  public incrementRetry(): void {
    this.retryCount++;
    this.updatedAt = new Date();
  }

  public reset(): void {
    if (!ChunkStatusHelper.canRetry(this._status)) {
      throw ErrorFactory.invalidConfig(
        'chunk.status',
        `Cannot reset chunk in ${this._status} status`
      );
    }

    this._status = ChunkStatus.PENDING;
    this.audioPath = undefined;
    this.duration = undefined;
    this.fileSize = undefined;
    this.audioMetadata = undefined;
    this.lastError = undefined;
    this.completedAt = undefined;
    this.updatedAt = new Date();
  }

  public updateVoice(voiceId: string): void {
    if (this._status === ChunkStatus.PROCESSING) {
      throw ErrorFactory.invalidConfig(
        'chunk.status',
        'Cannot change voice while processing'
      );
    }

    this.voiceId = voiceId;
    this.updatedAt = new Date();
  }

  public isComplete(): boolean {
    return this._status === ChunkStatus.COMPLETED;
  }

  public isFailed(): boolean {
    return this._status === ChunkStatus.FAILED;
  }

  public isProcessing(): boolean {
    return ChunkStatusHelper.isProcessing(this._status);
  }

  public isPending(): boolean {
    return this._status === ChunkStatus.PENDING;
  }

  public canRetry(): boolean {
    return ChunkStatusHelper.canRetry(this._status);
  }

  public getProcessingTime(): number | undefined {
    if (!this.completedAt) return undefined;
    const started = this.updatedAt; // Approximate
    return this.completedAt.getTime() - started.getTime();
  }

  public toPersistence(): AudioChunkData {
    return {
      id: this.id,
      itemId: this.itemId,
      textChunkId: this.textChunkId,
      index: this.index,
      status: this._status,
      audioPath: this.audioPath,
      duration: this.duration,
      fileSize: this.fileSize,
      audioMetadata: this.audioMetadata,
      voiceId: this.voiceId,
      retryCount: this.retryCount,
      lastError: this.lastError,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt,
    };
  }

  public toJSON() {
    return {
      ...this.toPersistence(),
      statusLabel: ChunkStatusHelper.getLabel(this._status),
      isComplete: this.isComplete(),
      isFailed: this.isFailed(),
      isProcessing: this.isProcessing(),
      isPending: this.isPending(),
      canRetry: this.canRetry(),
      processingTime: this.getProcessingTime(),
    };
  }
}
