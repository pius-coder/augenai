// src/core/domain/entities/Job.ts
// Job aggregate root - represents a batch generation job
// Imports: JobStatus, VoiceSettings, PromptTemplate

import { JobStatus, JobStatusHelper } from '../value-objects/JobStatus';
import { VoiceSettings } from '../value-objects/VoiceSettings';
import { PromptTemplate } from '../value-objects/PromptTemplate';
import { ValidationError } from '@/shared/utils/errors/AppError';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface JobData {
  id: string;
  name: string;
  status: JobStatus;
  voiceSettings?: VoiceSettings;
  systemPrompt?: string;
  userPromptTemplate?: PromptTemplate;
  maxChunkSize: number;
  silenceBetweenChunks: number;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export class Job {
  private constructor(
    public readonly id: string,
    public name: string,
    private _status: JobStatus,
    public voiceSettings: VoiceSettings | null,
    public systemPrompt: string,
    public userPromptTemplate: PromptTemplate | null,
    public maxChunkSize: number,
    public silenceBetweenChunks: number,
    public totalItems: number,
    public completedItems: number,
    public failedItems: number,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public startedAt?: Date,
    public completedAt?: Date
  ) {}

  static create(data: {
    name: string;
    voiceSettings?: VoiceSettings;
    systemPrompt?: string;
    userPromptTemplate?: PromptTemplate;
    maxChunkSize?: number;
    silenceBetweenChunks?: number;
  }): Job {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Job name is required');
    }

    const now = new Date();
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return new Job(
      id,
      data.name.trim(),
      JobStatus.DRAFT,
      data.voiceSettings || null,
      data.systemPrompt || '',
      data.userPromptTemplate || null,
      data.maxChunkSize || 2000,
      data.silenceBetweenChunks || 500,
      0,
      0,
      0,
      now,
      now
    );
  }

  static fromPersistence(data: JobData): Job {
    return new Job(
      data.id,
      data.name,
      data.status,
      data.voiceSettings || null,
      data.systemPrompt || '',
      data.userPromptTemplate || null,
      data.maxChunkSize,
      data.silenceBetweenChunks,
      data.totalItems,
      data.completedItems,
      data.failedItems,
      data.createdAt,
      data.updatedAt,
      data.startedAt,
      data.completedAt
    );
  }

  get status(): JobStatus {
    return this._status;
  }

  public start(): void {
    if (!JobStatusHelper.canStart(this._status)) {
      throw ErrorFactory.invalidConfig(
        'job.status',
        `Cannot start job in ${this._status} status`
      );
    }

    if (this.totalItems === 0) {
      throw new ValidationError('Cannot start job with no items');
    }

    this._status = JobStatus.PROCESSING;
    this.startedAt = new Date();
    this.updatedAt = new Date();
  }

  public pause(): void {
    if (!JobStatusHelper.canPause(this._status)) {
      throw ErrorFactory.invalidConfig(
        'job.status',
        `Cannot pause job in ${this._status} status`
      );
    }

    this._status = JobStatus.PAUSED;
    this.updatedAt = new Date();
  }

  public resume(): void {
    if (!JobStatusHelper.canResume(this._status)) {
      throw ErrorFactory.invalidConfig(
        'job.status',
        `Cannot resume job in ${this._status} status`
      );
    }

    this._status = JobStatus.PROCESSING;
    this.updatedAt = new Date();
  }

  public cancel(): void {
    if (!JobStatusHelper.canCancel(this._status)) {
      throw ErrorFactory.invalidConfig(
        'job.status',
        `Cannot cancel job in ${this._status} status`
      );
    }

    this._status = JobStatus.CANCELLED;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  public complete(): void {
    this._status = JobStatus.COMPLETED;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  public fail(): void {
    this._status = JobStatus.FAILED;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  public setTotalItems(count: number): void {
    if (count < 0) {
      throw new ValidationError('Total items cannot be negative');
    }
    this.totalItems = count;
    this.updatedAt = new Date();
  }

  public incrementCompletedItems(): void {
    this.completedItems++;
    this.updatedAt = new Date();

    if (this.completedItems + this.failedItems >= this.totalItems) {
      this.complete();
    }
  }

  public incrementFailedItems(): void {
    this.failedItems++;
    this.updatedAt = new Date();

    if (this.completedItems + this.failedItems >= this.totalItems) {
      this.fail();
    }
  }

  public getProgressPercentage(): number {
    if (this.totalItems === 0) return 0;
    return Math.round(((this.completedItems + this.failedItems) / this.totalItems) * 100);
  }

  public isComplete(): boolean {
    return this._status === JobStatus.COMPLETED;
  }

  public isFailed(): boolean {
    return this._status === JobStatus.FAILED;
  }

  public isProcessing(): boolean {
    return JobStatusHelper.isActive(this._status);
  }

  public canModify(): boolean {
    return !JobStatusHelper.isTerminal(this._status);
  }

  public updateVoiceSettings(voiceSettings: VoiceSettings): void {
    if (!this.canModify()) {
      throw ErrorFactory.invalidConfig(
        'job.status',
        'Cannot modify completed or cancelled job'
      );
    }
    this.voiceSettings = voiceSettings;
    this.updatedAt = new Date();
  }

  public updatePrompts(systemPrompt: string, userPromptTemplate: PromptTemplate): void {
    if (!this.canModify()) {
      throw ErrorFactory.invalidConfig(
        'job.status',
        'Cannot modify completed or cancelled job'
      );
    }
    this.systemPrompt = systemPrompt;
    this.userPromptTemplate = userPromptTemplate;
    this.updatedAt = new Date();
  }

  public toPersistence(): JobData {
    return {
      id: this.id,
      name: this.name,
      status: this._status,
      voiceSettings: this.voiceSettings || undefined,
      systemPrompt: this.systemPrompt,
      userPromptTemplate: this.userPromptTemplate || undefined,
      maxChunkSize: this.maxChunkSize,
      silenceBetweenChunks: this.silenceBetweenChunks,
      totalItems: this.totalItems,
      completedItems: this.completedItems,
      failedItems: this.failedItems,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
    };
  }

  public toJSON() {
    return {
      ...this.toPersistence(),
      status: this._status,
      progressPercentage: this.getProgressPercentage(),
      isComplete: this.isComplete(),
      isFailed: this.isFailed(),
      isProcessing: this.isProcessing(),
      canModify: this.canModify(),
    };
  }
}
