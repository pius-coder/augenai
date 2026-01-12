// src/shared/config/env.ts
// Environment Configuration - Loads and validates all environment variables
// Used by ALL services throughout the application

import { z } from 'zod';

// Define the environment schema using Zod for validation
const EnvSchema = z.object({
  // Database Configuration
  DATABASE_URL: z.string().url().describe('PostgreSQL database connection URL'),
  
  // AI Service API Keys
  ELEVENLABS_API_KEY: z.string().min(1).describe('ElevenLabs API key for TTS'),
  ANTHROPIC_API_KEY: z.string().min(1).optional().describe('Anthropic API key for text generation'),
  MISTRAL_API_KEY: z.string().min(1).optional().describe('Mistral API key for text generation'),
  
  // Application Configuration
  APP_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_PORT: z.coerce.number().default(3000),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
  
  // Storage Configuration
  STORAGE_DIR: z.string().default('./storage'),
  AUDIO_STORAGE_DIR: z.string().default('./storage/audio'),
  MAX_STORAGE_SIZE_MB: z.coerce.number().default(1024),
  
  // Rate Limiting
  API_RATE_LIMIT: z.coerce.number().default(100),
  
  // Security
  JWT_SECRET: z.string().min(32).optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  
  // Feature Flags
  ENABLE_AUDIO_GENERATION: z.coerce.boolean().default(true),
  ENABLE_TEXT_GENERATION: z.coerce.boolean().default(true),
  ENABLE_CHAT_INTERFACE: z.coerce.boolean().default(true),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Queue Configuration
  QUEUE_CONCURRENCY: z.coerce.number().default(5),
  MAX_RETRIES: z.coerce.number().default(3),
});

// Type for the validated environment variables
export type EnvConfig = z.infer<typeof EnvSchema>;

// Environment validation and loading
class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private config: EnvConfig;
  
  private constructor() {
    // Load and validate environment variables
    this.config = this.loadAndValidateEnv();
  }
  
  public static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }
  
  private loadAndValidateEnv(): EnvConfig {
    try {
      // Parse environment variables
      const parsed = EnvSchema.safeParse(process.env);
      
      if (!parsed.success) {
        const errors = parsed.error.issues.map(issue => {
          return `  - ${issue.path.join('.')}: ${issue.message}`;
        }).join('\n');
        
        throw new Error(
          `Environment validation failed:\n${errors}\n\n` +
          `Please check your .env file and ensure all required variables are set.`
        );
      }
      
      return parsed.data;
    } catch (error) {
      console.error('❌ Environment configuration error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }
  
  // Get the validated configuration
  public getConfig(): EnvConfig {
    return this.config;
  }
  
  // Convenience getters for specific configurations
  public getDatabaseUrl(): string {
    return this.config.DATABASE_URL;
  }
  
  public getElevenLabsApiKey(): string {
    return this.config.ELEVENLABS_API_KEY;
  }
  
  public getAnthropicApiKey(): string | undefined {
    return this.config.ANTHROPIC_API_KEY;
  }
  
  public getMistralApiKey(): string | undefined {
    return this.config.MISTRAL_API_KEY;
  }
  
  public isDevelopment(): boolean {
    return this.config.APP_ENV === 'development';
  }
  
  public isProduction(): boolean {
    return this.config.APP_ENV === 'production';
  }
  
  public getAppBaseUrl(): string {
    return this.config.APP_BASE_URL;
  }
  
  public getStorageDir(): string {
    return this.config.STORAGE_DIR;
  }
  
  public getAudioStorageDir(): string {
    return this.config.AUDIO_STORAGE_DIR;
  }
  
  public getLogLevel(): string {
    return this.config.LOG_LEVEL;
  }
  
  public getQueueConcurrency(): number {
    return this.config.QUEUE_CONCURRENCY;
  }
  
  public getMaxRetries(): number {
    return this.config.MAX_RETRIES;
  }
  
  public isAudioGenerationEnabled(): boolean {
    return this.config.ENABLE_AUDIO_GENERATION;
  }
  
  public isTextGenerationEnabled(): boolean {
    return this.config.ENABLE_TEXT_GENERATION;
  }
  
  public isChatInterfaceEnabled(): boolean {
    return this.config.ENABLE_CHAT_INTERFACE;
  }
}

// Export singleton instance
export const envConfig = EnvironmentConfig.getInstance();
export default envConfig;