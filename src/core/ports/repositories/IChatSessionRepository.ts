// src/core/ports/repositories/IChatSessionRepository.ts
// Repository port for ChatSession persistence

import { ChatSession } from '../../domain/entities/ChatSession';

export interface ChatSessionListOptions {
  limit?: number;
  offset?: number;
  orderByCreatedAt?: 'asc' | 'desc';
}

export interface IChatSessionRepository {
  findById(id: string): Promise<ChatSession | null>;
  findAll(options?: ChatSessionListOptions): Promise<ChatSession[]>;

  save(session: ChatSession): Promise<void>;
  delete(id: string): Promise<void>;

  exists(id: string): Promise<boolean>;
}
