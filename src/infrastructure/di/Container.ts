// src/infrastructure/di/Container.ts
// Main DI container using constructor injection

import { PrismaClient } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';

// Repositories
import { PrismaJobRepository } from '../persistence/repositories/PrismaJobRepository';
import { PrismaContentItemRepository } from '../persistence/repositories/PrismaContentItemRepository';
import { PrismaAudioChunkRepository } from '../persistence/repositories/PrismaAudioChunkRepository';
import { PrismaGeneratedTextRepository } from '../persistence/repositories/PrismaGeneratedTextRepository';
import { PrismaChatSessionRepository } from '../persistence/repositories/PrismaChatSessionRepository';
import { PrismaChatMessageRepository } from '../persistence/repositories/PrismaChatMessageRepository';
import { PrismaErrorLogRepository } from '../persistence/repositories/PrismaErrorLogRepository';
import { PrismaUserSettingsRepository } from '../persistence/repositories/PrismaUserSettingsRepository';

// Services
import { AnthropicTextGenerationService } from '../external/anthropic/AnthropicTextGenerationService';
import { AnthropicChatService } from '../external/anthropic/AnthropicChatService';
import { ElevenLabsTTSService } from '../external/elevenlabs/ElevenLabsTTSService';
import { PapaParseCSVService } from '../external/papaparse/PapaParseCSVService';
import { CSVValidationService } from '../services/CSVValidationService';
import { TextChunkingService } from '../services/TextChunkingService';
import { AudioMergeService } from '../services/AudioMergeService';

// Event System
import { InMemoryEventBus } from '../events/InMemoryEventBus';

// Queue System
import { InMemoryJobQueue } from '../queue/InMemoryJobQueue';

// Use Cases - Job
import { CreateJobUseCase } from '@/core/domain/use-cases/job/CreateJobUseCase';
import { GetJobUseCase } from '@/core/domain/use-cases/job/GetJobUseCase';
import { ListJobsUseCase } from '@/core/domain/use-cases/job/ListJobsUseCase';
import { UpdateJobUseCase } from '@/core/domain/use-cases/job/UpdateJobUseCase';
import { CancelJobUseCase } from '@/core/domain/use-cases/job/CancelJobUseCase';
import { RetryJobUseCase } from '@/core/domain/use-cases/job/RetryJobUseCase';

// Use Cases - Content
import { ProcessItemUseCase } from '@/core/domain/use-cases/content/ProcessItemUseCase';
import { GenerateTextUseCase } from '@/core/domain/use-cases/content/GenerateTextUseCase';
import { RefineTextUseCase } from '@/core/domain/use-cases/content/RefineTextUseCase';
import { ChunkTextUseCase } from '@/core/domain/use-cases/content/ChunkTextUseCase';
import { GenerateAudioUseCase } from '@/core/domain/use-cases/content/GenerateAudioUseCase';
import { MergeAudioChunksUseCase } from '@/core/domain/use-cases/content/MergeAudioChunksUseCase';

// Use Cases - Chat
import { CreateChatSessionUseCase } from '@/core/domain/use-cases/chat/CreateChatSessionUseCase';
import { SendChatMessageUseCase } from '@/core/domain/use-cases/chat/SendChatMessageUseCase';
import { GetChatHistoryUseCase } from '@/core/domain/use-cases/chat/GetChatHistoryUseCase';

// Use Cases - CSV
import { ValidateCSVUseCase } from '@/core/domain/use-cases/csv/ValidateCSVUseCase';
import { ParseCSVUseCase } from '@/core/domain/use-cases/csv/ParseCSVUseCase';

// Orchestrators
import { PipelineOrchestrator } from '@/application/orchestrators/PipelineOrchestrator';

export class Container {
  private static instance: Container;
  private services = new Map<string, any>();

  private constructor() {
    this.registerDependencies();
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  private registerDependencies(): void {
    // Database
    this.services.set('PrismaClient', prisma);

    // Repositories
    this.services.set('IJobRepository', new PrismaJobRepository(prisma));
    this.services.set('IContentItemRepository', new PrismaContentItemRepository(prisma));
    this.services.set('IAudioChunkRepository', new PrismaAudioChunkRepository(prisma));
    this.services.set('IGeneratedTextRepository', new PrismaGeneratedTextRepository(prisma));
    this.services.set('IChatSessionRepository', new PrismaChatSessionRepository(prisma));
    this.services.set('IChatMessageRepository', new PrismaChatMessageRepository(prisma));
    this.services.set('IErrorLogRepository', new PrismaErrorLogRepository(prisma));
    this.services.set('IUserSettingsRepository', new PrismaUserSettingsRepository(prisma));

    // External Services
    this.services.set('ITextGenerationService', new AnthropicTextGenerationService());
    this.services.set('IChatService', new AnthropicChatService());
    this.services.set('ITTSService', new ElevenLabsTTSService());
    this.services.set('ICSVParsingService', new PapaParseCSVService());

    // Internal Services
    this.services.set('ICSVValidationService', new CSVValidationService(
      this.get('ICSVParsingService')
    ));
    this.services.set('ITextChunkingService', new TextChunkingService());
    this.services.set('IAudioMergeService', new AudioMergeService());

    // Event System
    const eventBus = new InMemoryEventBus();
    this.services.set('IEventBus', eventBus);

    // Queue System
    const jobQueue = new InMemoryJobQueue();
    this.services.set('IJobQueue', jobQueue);

    // Use Cases - Job
    this.services.set('CreateJobUseCase', new CreateJobUseCase(
      this.get('IJobRepository'),
      this.get('IEventBus')
    ));
    this.services.set('GetJobUseCase', new GetJobUseCase(
      this.get('IJobRepository')
    ));
    this.services.set('ListJobsUseCase', new ListJobsUseCase(
      this.get('IJobRepository')
    ));
    this.services.set('UpdateJobUseCase', new UpdateJobUseCase(
      this.get('IJobRepository'),
      this.get('IEventBus')
    ));
    this.services.set('CancelJobUseCase', new CancelJobUseCase(
      this.get('IJobRepository'),
      this.get('IContentItemRepository'),
      this.get('IEventBus')
    ));
    this.services.set('RetryJobUseCase', new RetryJobUseCase(
      this.get('IJobRepository'),
      this.get('IContentItemRepository'),
      this.get('IEventBus')
    ));

    // Use Cases - Content
    this.services.set('ProcessItemUseCase', new ProcessItemUseCase(
      this.get('IContentItemRepository'),
      this.get('IEventBus')
    ));
    this.services.set('GenerateTextUseCase', new GenerateTextUseCase(
      this.get('IContentItemRepository'),
      this.get('IGeneratedTextRepository'),
      this.get('IJobRepository'),
      this.get('ITextGenerationService'),
      this.get('IEventBus')
    ));
    this.services.set('RefineTextUseCase', new RefineTextUseCase(
      this.get('IContentItemRepository'),
      this.get('ITextGenerationService'),
      this.get('IEventBus')
    ));
    this.services.set('ChunkTextUseCase', new ChunkTextUseCase(
      this.get('IContentItemRepository'),
      this.get('IAudioChunkRepository'),
      this.get('IJobRepository'),
      this.get('ITextChunkingService'),
      this.get('IEventBus')
    ));
    this.services.set('GenerateAudioUseCase', new GenerateAudioUseCase(
      this.get('IAudioChunkRepository'),
      this.get('IJobRepository'),
      this.get('ITTSService'),
      this.get('IEventBus')
    ));
    this.services.set('MergeAudioChunksUseCase', new MergeAudioChunksUseCase(
      this.get('IContentItemRepository'),
      this.get('IAudioChunkRepository'),
      this.get('IJobRepository'),
      this.get('IAudioMergeService'),
      this.get('IEventBus')
    ));

    // Use Cases - Chat
    this.services.set('CreateChatSessionUseCase', new CreateChatSessionUseCase(
      this.get('IChatSessionRepository'),
      this.get('IEventBus')
    ));
    this.services.set('SendChatMessageUseCase', new SendChatMessageUseCase(
      this.get('IChatSessionRepository'),
      this.get('IChatMessageRepository'),
      this.get('IChatService')
    ));
    this.services.set('GetChatHistoryUseCase', new GetChatHistoryUseCase(
      this.get('IChatSessionRepository'),
      this.get('IChatMessageRepository')
    ));

    // Use Cases - CSV
    this.services.set('ValidateCSVUseCase', new ValidateCSVUseCase(
      this.get('ICSVValidationService')
    ));
    this.services.set('ParseCSVUseCase', new ParseCSVUseCase(
      this.get('ICSVParsingService'),
      this.get('IContentItemRepository'),
      this.get('IJobRepository')
    ));

    // Orchestrators
    this.services.set('PipelineOrchestrator', new PipelineOrchestrator(
      this.get('IJobRepository'),
      this.get('IContentItemRepository'),
      this.get('IEventBus'),
      this.get('IJobQueue')
    ));
  }

  get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found in container`);
    }
    return service as T;
  }

  has(serviceName: string): boolean {
    return this.services.has(serviceName);
  }
}

export const container = Container.getInstance();
