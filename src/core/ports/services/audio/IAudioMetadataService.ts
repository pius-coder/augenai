// src/core/ports/services/audio/IAudioMetadataService.ts
// Audio metadata extraction port

import type { AudioMetadataData } from '../../../domain/value-objects/AudioMetadata';

export interface IAudioMetadataService {
  getMetadataFromFile(filePath: string): Promise<AudioMetadataData>;
  getMetadataFromBuffer(buffer: Buffer): Promise<AudioMetadataData>;
}
