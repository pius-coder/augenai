// src/core/ports/services/audio/IAudioMergeService.ts
// Audio merge/concatenation port (e.g., via ffmpeg)

import type { AudioMetadataData } from '../../../domain/value-objects/AudioMetadata';

export interface AudioMergeOptions {
  silenceBetweenChunksMs?: number;
  outputFormat?: string;
}

export interface AudioMergeResult {
  outputPath: string;
  metadata?: AudioMetadataData;
}

export interface IAudioMergeService {
  mergeAudioFiles(inputPaths: string[], outputPath: string, options?: AudioMergeOptions): Promise<AudioMergeResult>;
}
