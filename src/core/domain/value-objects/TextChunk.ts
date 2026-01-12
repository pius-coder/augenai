// src/core/domain/value-objects/TextChunk.ts
// Class for a chunk of text (max 2000 characters for TTS)
// Imported by ChunkTextUseCase

import { ValidationError } from '@/shared/utils/errors/AppError';

export class TextChunk {
  public static readonly MAX_CHUNK_SIZE = 2000;

  private constructor(
    public readonly text: string,
    public readonly index: number,
    public readonly charCount: number
  ) {}

  static create(text: string, index: number): TextChunk {
    const trimmed = text.trim();
    
    if (trimmed.length === 0) {
      throw new ValidationError('Text chunk cannot be empty');
    }

    if (trimmed.length > this.MAX_CHUNK_SIZE) {
      throw new ValidationError(
        `Text chunk exceeds maximum size of ${this.MAX_CHUNK_SIZE} characters (got ${trimmed.length})`
      );
    }

    if (index < 0) {
      throw new ValidationError('Chunk index must be non-negative');
    }

    return new TextChunk(trimmed, index, trimmed.length);
  }

  static fromArray(chunks: string[]): TextChunk[] {
    return chunks.map((text, index) => TextChunk.create(text, index));
  }

  public getPercentageOfMax(): number {
    return Math.round((this.charCount / TextChunk.MAX_CHUNK_SIZE) * 100);
  }

  public hasRoomFor(additionalChars: number): boolean {
    return this.charCount + additionalChars <= TextChunk.MAX_CHUNK_SIZE;
  }

  public toJSON() {
    return {
      text: this.text,
      index: this.index,
      charCount: this.charCount,
      percentageOfMax: this.getPercentageOfMax(),
    };
  }
}
