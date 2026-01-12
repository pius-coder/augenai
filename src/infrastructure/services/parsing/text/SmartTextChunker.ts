// src/infrastructure/services/parsing/text/SmartTextChunker.ts
// Smart text chunking service implementation

import { ITextChunkerService, TextChunkerOptions } from '@/core/ports/services/parsing/ITextChunkerService';
import { TextChunk } from '@/core/domain/value-objects/TextChunk';
import { ValidationError } from '@/shared/utils/errors/AppError';

export class SmartTextChunker implements ITextChunkerService {
  private readonly DEFAULT_MAX_CHUNK_SIZE = 2000;
  private readonly MIN_CHUNK_SIZE = 100;

  chunkText(text: string, options?: TextChunkerOptions): TextChunk[] {
    const maxChunkSize = options?.maxChunkSize || this.DEFAULT_MAX_CHUNK_SIZE;

    if (maxChunkSize < this.MIN_CHUNK_SIZE) {
      throw new ValidationError(`Max chunk size must be at least ${this.MIN_CHUNK_SIZE}`);
    }

    if (maxChunkSize > 10000) {
      throw new ValidationError('Max chunk size cannot exceed 10000 characters');
    }

    const chunks: TextChunk[] = [];
    const sentences = this.splitIntoSentences(text);
    const chunkTexts = this.groupSentencesIntoChunks(sentences, maxChunkSize);

    chunkTexts.forEach((chunkText, index) => {
      const chunk = TextChunk.create(chunkText, index);
      chunks.push(chunk);
    });

    return chunks;
  }

  private splitIntoSentences(text: string): string[] {
    // Normalize whitespace
    const normalized = text.replace(/\s+/g, ' ').trim();

    // Split on sentence boundaries
    const sentencePattern = /(?<=[.!?])\s+(?=[A-Z])/;
    const sentences = normalized.split(sentencePattern);

    return sentences.filter(s => s.trim().length > 0);
  }

  private groupSentencesIntoChunks(sentences: string[], maxChunkSize: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();

      if (currentChunk.length + trimmedSentence.length <= maxChunkSize) {
        // Add to current chunk
        currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
      } else {
        // Current chunk is full, start a new one
        if (currentChunk) {
          chunks.push(currentChunk);
        }

        // If single sentence is too long, force split it
        if (trimmedSentence.length > maxChunkSize) {
          const forcedChunks = this.forceSplitText(trimmedSentence, maxChunkSize);
          chunks.push(...forcedChunks);
          currentChunk = '';
        } else {
          currentChunk = trimmedSentence;
        }
      }
    }

    // Add the last chunk if it exists
    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.filter(c => c.trim().length > 0);
  }

  private forceSplitText(text: string, maxChunkSize: number): string[] {
    const chunks: string[] = [];
    const words = text.split(' ');
    let currentChunk = '';

    for (const word of words) {
      if (currentChunk.length + word.length + 1 <= maxChunkSize) {
        currentChunk += (currentChunk ? ' ' : '') + word;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = word;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }
}
