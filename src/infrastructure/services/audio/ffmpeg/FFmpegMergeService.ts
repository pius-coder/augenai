// src/infrastructure/services/audio/ffmpeg/FFmpegMergeService.ts
// FFmpeg-based audio merge service

import { IAudioMergeService, AudioMergeOptions, AudioMergeResult } from '@/core/ports/services/audio/IAudioMergeService';
import { AudioMetadataData } from '@/core/domain/value-objects/AudioMetadata';
import { StorageError, ValidationError } from '@/shared/utils/errors/AppError';
import { promises as fs } from 'fs';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class FFmpegMergeService implements IAudioMergeService {
  private readonly DEFAULT_SILENCE_MS = 500;

  async mergeAudioFiles(
    inputPaths: string[],
    outputPath: string,
    options?: AudioMergeOptions
  ): Promise<AudioMergeResult> {
    try {
      // Validate inputs
      if (!inputPaths || inputPaths.length === 0) {
        throw new ValidationError('At least one input file is required');
      }

      for (const path of inputPaths) {
        await this.validateFileExists(path);
      }

      if (!outputPath || outputPath.trim().length === 0) {
        throw new ValidationError('Output path is required');
      }

      // Ensure output directory exists
      const outputDir = dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Check if FFmpeg is available
      await this.checkFFmpegAvailable();

      // Build FFmpeg command
      const command = this.buildFFmpegCommand(inputPaths, outputPath, options);

      // Execute FFmpeg
      await execAsync(command);

      // Get metadata from merged file
      const metadata = await this.getAudioMetadata(outputPath);

      return {
        outputPath,
        metadata,
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to merge audio files', 'MERGE_ERROR');
    }
  }

  private async validateFileExists(path: string): Promise<void> {
    try {
      await fs.access(path);
    } catch {
      throw new ValidationError(`File not found: ${path}`);
    }
  }

  private async checkFFmpegAvailable(): Promise<void> {
    try {
      await execAsync('ffmpeg -version');
    } catch {
      throw new StorageError(
        'FFmpeg is not installed or not available in PATH',
        'MERGE_ERROR'
      );
    }
  }

  private buildFFmpegCommand(
    inputPaths: string[],
    outputPath: string,
    options?: AudioMergeOptions
  ): string {
    const silenceMs = options?.silenceBetweenChunksMs ?? this.DEFAULT_SILENCE_MS;

    // Build filter complex for concatenation with silence
    const inputs = inputPaths.map(p => `-i "${p}"`).join(' ');

    let filterComplex = '';

    if (silenceMs > 0 && inputPaths.length > 1) {
      // Add silence between each file
      const silenceFile = this.createSilenceFilter(silenceMs);
      const streams: string[] = [];

      for (let i = 0; i < inputPaths.length; i++) {
        streams.push(`[${i}:0]`);
        if (i < inputPaths.length - 1) {
          streams.push(silenceFile);
        }
      }

      const joinedStreams = streams.join('');
      filterComplex = `-filter_complex "${joinedStreams}concat=n=${inputPaths.length}:v=0:a=1[out]" -map "[out]"`;
    } else {
      // Simple concatenation without silence
      const streams = inputPaths.map((_, i) => `[${i}:0]`).join('');
      filterComplex = `-filter_complex "${streams}concat=n=${inputPaths.length}:v=0:a=1[out]" -map "[out]"`;
    }

    return `ffmpeg ${inputs} ${filterComplex} -c:a libmp3lame -b:a 128k -y "${outputPath}"`;
  }

  private createSilenceFilter(ms: number): string {
    const duration = ms / 1000;
    return `aevalsrc=0:d=${duration}[s${ms}];[s${ms}]`;
  }

  private async getAudioMetadata(path: string): Promise<AudioMetadataData> {
    try {
      const command = `ffprobe -v quiet -show_entries format=duration,size -show_entries stream=bit_rate,sample_rate -of json "${path}"`;
      const { stdout } = await execAsync(command);

      const data = JSON.parse(stdout);
      const format = data.format || {};
      const stream = data.streams?.[0] || {};

      return {
        duration: parseFloat(format.duration) || 0,
        fileSize: parseInt(format.size) || 0,
        format: 'mp3',
        sampleRate: parseInt(stream.sample_rate) || undefined,
        bitrate: parseInt(stream.bit_rate) || undefined,
      };
    } catch {
      // Return basic metadata if ffprobe fails
      const stats = await fs.stat(path);
      return {
        duration: 0,
        fileSize: stats.size,
        format: 'mp3',
      };
    }
  }
}
