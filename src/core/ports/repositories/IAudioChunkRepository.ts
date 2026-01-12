// src/core/ports/repositories/IAudioChunkRepository.ts
// Repository port for AudioChunk persistence

import { AudioChunk } from '../../domain/entities/AudioChunk';
import { ChunkStatus } from '../../domain/value-objects/ChunkStatus';

export interface AudioChunkListOptions {
  status?: ChunkStatus;
  limit?: number;
  offset?: number;
  orderByIndex?: 'asc' | 'desc';
}

export interface IAudioChunkRepository {
  findById(id: string): Promise<AudioChunk | null>;
  findByItemId(itemId: string, options?: AudioChunkListOptions): Promise<AudioChunk[]>;
  findByTextChunkId(textChunkId: string): Promise<AudioChunk | null>;

  save(chunk: AudioChunk): Promise<void>;
  saveMany(chunks: AudioChunk[]): Promise<void>;

  delete(id: string): Promise<void>;
  deleteByItemId(itemId: string): Promise<void>;

  exists(id: string): Promise<boolean>;
}
