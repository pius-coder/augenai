// src/core/domain/value-objects/AudioMetadata.ts
// Audio metadata (duration, fileSize)
// Imported by AudioChunk entity

import { ValidationError } from '@/shared/utils/errors/AppError';

export interface AudioMetadataData {
  duration: number;
  fileSize: number;
  format?: string;
  sampleRate?: number;
  bitrate?: number;
}

export class AudioMetadata {
  private constructor(
    public readonly duration: number,
    public readonly fileSize: number,
    public readonly format: string,
    public readonly sampleRate?: number,
    public readonly bitrate?: number
  ) {}

  static create(data: AudioMetadataData): AudioMetadata {
    this.validate(data);

    return new AudioMetadata(
      data.duration,
      data.fileSize,
      data.format || 'mp3',
      data.sampleRate,
      data.bitrate
    );
  }

  private static validate(data: AudioMetadataData): void {
    if (data.duration < 0) {
      throw new ValidationError('Duration cannot be negative');
    }

    if (data.fileSize < 0) {
      throw new ValidationError('File size cannot be negative');
    }

    if (data.sampleRate !== undefined && data.sampleRate <= 0) {
      throw new ValidationError('Sample rate must be positive');
    }

    if (data.bitrate !== undefined && data.bitrate <= 0) {
      throw new ValidationError('Bitrate must be positive');
    }
  }

  public getDurationFormatted(): string {
    const minutes = Math.floor(this.duration / 60);
    const seconds = Math.floor(this.duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  public getFileSizeFormatted(): string {
    const kb = this.fileSize / 1024;
    const mb = kb / 1024;

    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }

    return `${kb.toFixed(2)} KB`;
  }

  public toJSON() {
    return {
      duration: this.duration,
      durationFormatted: this.getDurationFormatted(),
      fileSize: this.fileSize,
      fileSizeFormatted: this.getFileSizeFormatted(),
      format: this.format,
      sampleRate: this.sampleRate,
      bitrate: this.bitrate,
    };
  }
}
