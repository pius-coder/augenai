// src/core/ports/repositories/IChatMessageRepository.ts
// Repository port for ChatMessage persistence

import { ChatMessage } from '../../domain/entities/ChatMessage';

export interface ChatMessageListOptions {
  limit?: number;
  offset?: number;
  orderByCreatedAt?: 'asc' | 'desc';
}

export interface IChatMessageRepository {
  findById(id: string): Promise<ChatMessage | null>;
  findBySessionId(sessionId: string, options?: ChatMessageListOptions): Promise<ChatMessage[]>;

  save(message: ChatMessage): Promise<void>;
  saveMany(messages: ChatMessage[]): Promise<void>;

  delete(id: string): Promise<void>;
  deleteBySessionId(sessionId: string): Promise<void>;

  exists(id: string): Promise<boolean>;
}
