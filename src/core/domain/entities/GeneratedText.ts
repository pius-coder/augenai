// src/core/domain/entities/GeneratedText.ts
// Generated text entity - holds AI-generated text content
// Used by GenerateTextUseCase

import { ValidationError } from '@/shared/utils/errors/AppError';

export interface GeneratedTextData {
  itemId: string;
  content: string;
  charCount: number;
  estimatedDuration?: number; // Estimated audio duration in seconds
  metadata?: {
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class GeneratedText {
  private constructor(
    public readonly itemId: string,
    private _content: string,
    public readonly charCount: number,
    private _estimatedDuration: number | undefined,
    public readonly metadata: GeneratedTextData['metadata'],
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  static create(itemId: string, content: string, metadata?: GeneratedTextData['metadata']): GeneratedText {
    if (!content || content.trim().length === 0) {
      throw new ValidationError('Generated text cannot be empty');
    }

    if (content.length > 50000) {
      throw new ValidationError('Generated text cannot exceed 50000 characters');
    }

    const trimmed = content.trim();
    const now = new Date();

    return new GeneratedText(
      itemId,
      trimmed,
      trimmed.length,
      undefined,
      metadata,
      now,
      now
    );
  }

  static fromPersistence(data: GeneratedTextData): GeneratedText {
    return new GeneratedText(
      data.itemId,
      data.content,
      data.charCount,
      data.estimatedDuration,
      data.metadata,
      data.createdAt,
      data.updatedAt
    );
  }

  get content(): string {
    return this._content;
  }

  get estimatedDuration(): number | undefined {
    return this._estimatedDuration;
  }

  public append(text: string): void {
    if (!text || text.trim().length === 0) {
      throw new ValidationError('Cannot append empty text');
    }

    if (this._content.length + text.length > 50000) {
      throw new ValidationError('Generated text would exceed maximum size');
    }

    this._content += text;
    this.updatedAt = new Date();
  }

  public prepend(text: string): void {
    if (!text || text.trim().length === 0) {
      throw new ValidationError('Cannot prepend empty text');
    }

    if (this._content.length + text.length > 50000) {
      throw new ValidationError('Generated text would exceed maximum size');
    }

    this._content = text + this._content;
    this.updatedAt = new Date();
  }

  public replace(pattern: string | RegExp, replacement: string): number {
    const before = this._content;
    this._content = this._content.replace(pattern, replacement);
    this.updatedAt = new Date();

    return before.length - this._content.length;
  }

  public getCharCount(): number {
    return this._content.length;
  }

  public getWordCount(): number {
    return this._content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  public getParagraphCount(): number {
    return this._content.split(/\n\n+/).filter(para => para.trim().length > 0).length;
  }

  public estimateAudioDuration(wordsPerMinute: number = 150): number {
    const wordCount = this.getWordCount();
    return Math.round((wordCount / wordsPerMinute) * 60);
  }

  public setEstimatedDuration(duration: number): void {
    if (duration < 0) {
      throw new ValidationError('Duration cannot be negative');
    }
    this._estimatedDuration = duration;
    this.updatedAt = new Date();
  }

  public clear(): void {
    this._content = '';
    this.updatedAt = new Date();
  }

  public isEmpty(): boolean {
    return this._content.trim().length === 0;
  }

  public toPersistence(): GeneratedTextData {
    return {
      itemId: this.itemId,
      content: this._content,
      charCount: this._content.length,
      estimatedDuration: this._estimatedDuration,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public toJSON() {
    return {
      ...this.toPersistence(),
      wordCount: this.getWordCount(),
      paragraphCount: this.getParagraphCount(),
      isEmpty: this.isEmpty(),
    };
  }
}
