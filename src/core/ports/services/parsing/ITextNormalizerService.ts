// src/core/ports/services/parsing/ITextNormalizerService.ts
// Text normalization port (whitespace, punctuation, etc.)

export interface ITextNormalizerService {
  normalize(text: string): string;
}
