// src/core/ports/services/parsing/ITextChunkerService.ts
// Text chunking port (splitting a long text into <= N character chunks)

import { TextChunk } from '../../../domain/value-objects/TextChunk';

export interface TextChunkerOptions {
  maxChunkSize?: number;
}

export interface ITextChunkerService {
  chunkText(text: string, options?: TextChunkerOptions): TextChunk[];
}
