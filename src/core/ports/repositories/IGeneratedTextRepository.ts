// src/core/ports/repositories/IGeneratedTextRepository.ts
// Repository port for GeneratedText persistence

import { GeneratedText } from '../../domain/entities/GeneratedText';

export interface IGeneratedTextRepository {
  findByItemId(itemId: string): Promise<GeneratedText | null>;
  save(text: GeneratedText): Promise<void>;
  deleteByItemId(itemId: string): Promise<void>;
}
