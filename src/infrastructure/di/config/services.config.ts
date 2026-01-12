// src/infrastructure/di/config/services.config.ts
// Configuration for external and internal services

import { AnthropicTextGenerationService } from '@/infrastructure/services/ai/mistral/MistralService';
import { ElevenLabsTTSService } from '@/infrastructure/services/tts/elevenlabs/ElevenLabsService';
import { PapaParseCSVService } from '@/infrastructure/services/parsing/csv/PapaParseService';
import { SmartTextChunker } from '@/infrastructure/services/parsing/text/SmartTextChunker';
import { FFmpegMergeService } from '@/infrastructure/services/audio/ffmpeg/FFmpegMergeService';
import { IAudioMergeService } from '@/core/ports/services/audio/IAudioMergeService';
import { FFmpegAudioMetadataService } from '@/infrastructure/services/audio/ffmpeg/FFmpegAudioMetadataService';
import { IAudioMetadataService } from '@/core/ports/services/audio/IAudioMetadataService';
import { ITextChunkerService } from '@/core/ports/services/parsing/ITextChunkerService';
import { IValidationService } from '@/core/ports/services/validation/IValidationService';
import { container } from '../Container';
import { env } from '@/shared/config/env';

export interface ServiceConfig {
  // Text Generation
  textGeneration: {
    provider: 'anthropic' | 'openai' | 'mistral';
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  
  // TTS Service
  tts: {
    provider: 'elevenlabs' | 'openai';
    apiKey: string;
    model: string;
    voiceId: string;
    stability: number;
    similarityBoost: number;
  };
  
  // Storage
  storage: {
    provider: 'local' | 's3' | 'gcs';
    bucket?: string;
    region?: string;
    accessKey?: string;
    secretKey?: string;
  };
  
  // FFmpeg
  ffmpeg: {
    binaryPath?: string;
    timeout: number;
    maxAudioLength: number;
  };
}

export function createServiceConfig(): ServiceConfig {
  return {
    textGeneration: {
      provider: (env.AI_PROVIDER || 'mistral') as 'anthropic' | 'openai' | 'mistral',
      apiKey: env.MISTRAL_API_KEY || env.ANTHROPIC_API_KEY || env.OPENAI_API_KEY || '',
      model: env.MODEL_ID || 'mistral-small-latest',
      maxTokens: parseInt(env.MAX_TOKENS || '2000', 10),
      temperature: parseFloat(env.TEMPERATURE || '0.7'),
    },
    
    tts: {
      provider: 'elevenlabs',
      apiKey: env.ELEVENLABS_API_KEY || '',
      model: env.TTS_MODEL_ID || 'eleven_multilingual_v2',
      voiceId: env.DEFAULT_VOICE_ID || 'default',
      stability: parseFloat(env.DEFAULT_STABILITY || '0.5'),
      similarityBoost: parseFloat(env.DEFAULT_SIMILARITY_BOOST || '0.75'),
    },
    
    storage: {
      provider: (env.STORAGE_PROVIDER || 'local') as 'local' | 's3' | 'gcs',
      bucket: env.STORAGE_BUCKET,
      region: env.STORAGE_REGION,
      accessKey: env.STORAGE_ACCESS_KEY,
      secretKey: env.STORAGE_SECRET_KEY,
    },
    
    ffmpeg: {
      binaryPath: env.FFMPEG_PATH,
      timeout: parseInt(env.FFMPEG_TIMEOUT || '600000', 10),
      maxAudioLength: parseInt(env.MAX_AUDIO_LENGTH || '3600', 10),
    },
  };
}

export function initializeServices(config: ServiceConfig) {
  // Register services in container
  
  // Text Generation Service
  if (config.textGeneration.provider === 'mistral' || config.textGeneration.provider === 'anthropic') {
    const mistralService = new AnthropicTextGenerationService(
      config.textGeneration.apiKey,
      config.textGeneration.model,
      {
        maxTokens: config.textGeneration.maxTokens,
        temperature: config.textGeneration.temperature,
      }
    );
    container.bind('ITextGenerationService').toConstantValue(mistralService);
  }
  
  // TTS Service
  if (config.tts.provider === 'elevenlabs') {
    const elevenLabsService = new ElevenLabsTTSService(
      config.tts.apiKey,
      config.tts.model,
      config.tts.voiceId
    );
    container.bind('ITTSService').toConstantValue(elevenLabsService);
  }
  
  // CSV Parsing Service
  const csvParsingService = new PapaParseCSVService();
  container.bind('ICSVParsingService').toConstantValue(csvParsingService);
  
  // Text Chunking Service
  const textChunkingService = new SmartTextChunker({
    maxChunkSize: 2000,
    overlap: 100,
    preserveSentences: true,
  });
  container.bind('ITextChunkingService').toConstantValue(textChunkingService);
  
  // Audio Merge Service
  const audioMergeService = new FFmpegMergeService({
    binaryPath: config.ffmpeg.binaryPath,
    timeout: config.ffmpeg.timeout,
  });
  container.bind('IAudioMergeService').toConstantValue(audioMergeService);
  
  // Audio Metadata Service
  const audioMetadataService = new FFmpegAudioMetadataService({
    binaryPath: config.ffmpeg.binaryPath,
  });
  container.bind('IAudioMetadataService').toConstantValue(audioMetadataService);
  
  // Validation Service
  const validationService = new ValidationService();
  container.bind('IValidationService').toConstantValue(validationService);
  
  return {
    textGeneration: container.get('ITextGenerationService'),
    tts: container.get('ITTSService'),
    csvParsing: container.get('ICSVParsingService'),
    textChunking: container.get('ITextChunkingService'),
    audioMerge: container.get('IAudioMergeService'),
    audioMetadata: container.get('IAudioMetadataService'),
    validation: container.get('IValidationService'),
  };
}

// Simple Validation Service implementation
class ValidationService implements IValidationService {
  validateContentItem(data: any, rules?: any): Promise<{ isValid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    
    if (rules?.requiredFields) {
      for (const field of rules.requiredFields) {
        if (!data[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }
    
    if (rules?.minLength && data.titre && data.titre.length < rules.minLength) {
      errors.push(`Field "titre" is too short. Minimum length: ${rules.minLength}`);
    }
    
    return Promise.resolve({
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    });
  }
}