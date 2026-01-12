// src/core/domain/entities/ContentItem.ts
// Content item entity - represents one row/line from CSV
// Imports: ItemStatus, CSVRow

import { ItemStatus, ItemStatusHelper } from '../value-objects/ItemStatus';
import { CSVRow, ContentCategory } from '../value-objects/CSVRow';
import { ValidationError } from '@/shared/utils/errors/AppError';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export enum PipelineStep {
  VALIDATION = 'VALIDATION',
  TEXT_GENERATION = 'TEXT_GENERATION',
  CHUNKING = 'CHUNKING',
  AUDIO_GENERATION = 'AUDIO_GENERATION',
  AUDIO_MERGE = 'AUDIO_MERGE',
  UPLOAD = 'UPLOAD',
}

export interface ContentItemData {
  id: string;
  jobId: string;
  rowIndex: number;
  status: ItemStatus;
  currentStep: PipelineStep;
  titre: string;
  details: string;
  category: ContentCategory;
  reference?: string;
  generatedText?: string;
  finalAudioPath?: string;
  audioDuration?: number;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export class ContentItem {
  private constructor(
    public readonly id: string,
    public readonly jobId: string,
    public readonly rowIndex: number,
    private _status: ItemStatus,
    private _currentStep: PipelineStep,
    public titre: string,
    public details: string,
    public category: ContentCategory,
    public readonly reference: string | undefined,
    public generatedText: string | undefined,
    public finalAudioPath: string | undefined,
    public audioDuration: number | undefined,
    public retryCount: number,
    public readonly maxRetries: number,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public startedAt: Date | undefined,
    public completedAt: Date | undefined
  ) {}

  static create(csvRow: CSVRow, jobId: string, rowIndex: number): ContentItem {
    const now = new Date();
    const id = `item_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return new ContentItem(
      id,
      jobId,
      rowIndex,
      ItemStatus.PENDING,
      PipelineStep.VALIDATION,
      csvRow.titre,
      csvRow.details,
      csvRow.category,
      csvRow.reference,
      undefined,
      undefined,
      undefined,
      0,
      3,
      now,
      now,
      undefined,
      undefined
    );
  }

  static fromPersistence(data: ContentItemData): ContentItem {
    return new ContentItem(
      data.id,
      data.jobId,
      data.rowIndex,
      data.status,
      data.currentStep,
      data.titre,
      data.details,
      data.category,
      data.reference,
      data.generatedText,
      data.finalAudioPath,
      data.audioDuration,
      data.retryCount,
      data.maxRetries,
      data.createdAt,
      data.updatedAt,
      data.startedAt,
      data.completedAt
    );
  }

  get status(): ItemStatus {
    return this._status;
  }

  get currentStep(): PipelineStep {
    return this._currentStep;
  }

  public startProcessing(): void {
    if (this._status !== ItemStatus.PENDING && this._status !== ItemStatus.FAILED) {
      throw ErrorFactory.invalidConfig(
        'item.status',
        `Cannot start processing in ${this._status} status`
      );
    }

    this._status = ItemStatus.VALIDATING;
    this.startedAt = new Date();
    this.updatedAt = new Date();
  }

  public setStatus(status: ItemStatus): void {
    if (!ItemStatusHelper.isValidTransition(this._status, status)) {
      throw ErrorFactory.invalidConfig(
        'item.status',
        `Invalid status transition from ${this._status} to ${status}`
      );
    }

    this._status = status;
    this.updatedAt = new Date();

    if (status === ItemStatus.COMPLETED) {
      this.completedAt = new Date();
    }
  }

  public updateStep(step: PipelineStep, status?: ItemStatus): void {
    this._currentStep = step;

    if (status) {
      this.setStatus(status);
    } else {
      this.updatedAt = new Date();
    }
  }

  public setGeneratedText(text: string): void {
    if (!text || text.trim().length === 0) {
      throw new ValidationError('Generated text cannot be empty');
    }

    this.generatedText = text;
    this.updatedAt = new Date();
  }

  public setAudio(audioPath: string, duration: number): void {
    if (!audioPath || audioPath.trim().length === 0) {
      throw new ValidationError('Audio path cannot be empty');
    }

    if (duration < 0) {
      throw new ValidationError('Audio duration cannot be negative');
    }

    this.finalAudioPath = audioPath;
    this.audioDuration = duration;
    this.updatedAt = new Date();
  }

  public incrementRetry(): void {
    if (this.retryCount >= this.maxRetries) {
      throw ErrorFactory.invalidConfig(
        'item.retry',
        `Max retries (${this.maxRetries}) exceeded`
      );
    }

    this.retryCount++;
    this.updatedAt = new Date();
  }

  public canRetry(): boolean {
    return this.retryCount < this.maxRetries;
  }

  public getProgressPercentage(): number {
    return ItemStatusHelper.getProgressPercentage(this._status);
  }

  public isComplete(): boolean {
    return this._status === ItemStatus.COMPLETED;
  }

  public isFailed(): boolean {
    return this._status === ItemStatus.FAILED;
  }

  public isSkipped(): boolean {
    return this._status === ItemStatus.SKIPPED;
  }

  public isProcessing(): boolean {
    return ItemStatusHelper.isProcessing(this._status);
  }

  public isTerminal(): boolean {
    return ItemStatusHelper.isTerminal(this._status);
  }

  public toPersistence(): ContentItemData {
    return {
      id: this.id,
      jobId: this.jobId,
      rowIndex: this.rowIndex,
      status: this._status,
      currentStep: this._currentStep,
      titre: this.titre,
      details: this.details,
      category: this.category,
      reference: this.reference,
      generatedText: this.generatedText,
      finalAudioPath: this.finalAudioPath,
      audioDuration: this.audioDuration,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
    };
  }

  public toJSON() {
    return {
      ...this.toPersistence(),
      statusLabel: ItemStatusHelper.getLabel(this._status),
      progressPercentage: this.getProgressPercentage(),
      isComplete: this.isComplete(),
      isFailed: this.isFailed(),
      isSkipped: this.isSkipped(),
      isProcessing: this.isProcessing(),
      isTerminal: this.isTerminal(),
      canRetry: this.canRetry(),
    };
  }
}
