// src/core/ports/services/audio/IAudioProcessingService.ts
// Audio processing port (format conversion, silence insertion, normalization)

export interface AudioConvertOptions {
  inputFormat?: string;
  outputFormat: string;
}

export interface IAudioProcessingService {
  convertFile(inputPath: string, outputPath: string, options: AudioConvertOptions): Promise<void>;
  addSilenceToEnd(inputPath: string, outputPath: string, silenceMs: number): Promise<void>;
}
