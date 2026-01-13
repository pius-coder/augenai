// src/infrastructure/di/config/usecases.config.ts
// Register all use case implementations with DI container

import { Container } from '../Container';
import { CreateJobFromCSVUseCase } from '@/core/domain/use-cases/job/CreateJobFromCSVUseCase';
import { StartJobProcessingUseCase } from '@/core/domain/use-cases/job/StartJobProcessingUseCase';
import { PauseJobUseCase } from '@/core/domain/use-cases/job/PauseJobUseCase';
import { ResumeJobUseCase } from '@/core/domain/use-cases/job/ResumeJobUseCase';
import { CancelJobUseCase } from '@/core/domain/use-cases/job/CancelJobUseCase';
import { RetryFailedJobItemsUseCase } from '@/core/domain/use-cases/job/RetryFailedJobItemsUseCase';
import { ValidateContentItemUseCase } from '@/core/domain/use-cases/content/ValidateContentItemUseCase';
import { GenerateTextUseCase } from '@/core/domain/use-cases/content/GenerateTextUseCase';
import { ChunkTextUseCase } from '@/core/domain/use-cases/content/ChunkTextUseCase';
import { GenerateAudioForChunkUseCase } from '@/core/domain/use-cases/content/GenerateAudioForChunkUseCase';
import { MergeAudioChunksUseCase } from '@/core/domain/use-cases/content/MergeAudioChunksUseCase';
import { SendMessageUseCase } from '@/core/domain/use-cases/chat/SendMessageUseCase';
import { StreamChatResponseUseCase } from '@/core/domain/use-cases/chat/StreamChatResponseUseCase';
import { ExecuteToolCallUseCase } from '@/core/domain/use-cases/chat/ExecuteToolCallUseCase';
import { GetUserSettingsUseCase } from '@/core/domain/use-cases/settings/GetUserSettingsUseCase';
import { UpdateUserSettingsUseCase } from '@/core/domain/use-cases/settings/UpdateUserSettingsUseCase';
import { CreateCustomPromptUseCase } from '@/core/domain/use-cases/settings/CreateCustomPromptUseCase';
import { DeleteCustomPromptUseCase } from '@/core/domain/use-cases/settings/DeleteCustomPromptUseCase';

export function registerUseCases(container: Container): void {
  // Job Use Cases
  container.register('CreateJobFromCSVUseCase', () => 
    new CreateJobFromCSVUseCase(
      container.resolve('IJobRepository'),
      container.resolve('IEventBus')
    )
  );

  container.register('StartJobProcessingUseCase', () => 
    new StartJobProcessingUseCase(
      container.resolve('IJobRepository'),
      container.resolve('IEventBus')
    )
  );

  container.register('PauseJobUseCase', () => 
    new PauseJobUseCase(
      container.resolve('IJobRepository'),
      container.resolve('IEventBus')
    )
  );

  container.register('ResumeJobUseCase', () => 
    new ResumeJobUseCase(
      container.resolve('IJobRepository'),
      container.resolve('IEventBus')
    )
  );

  container.register('CancelJobUseCase', () => 
    new CancelJobUseCase(
      container.resolve('IJobRepository'),
      container.resolve('IEventBus')
    )
  );

  container.register('RetryFailedJobItemsUseCase', () => 
    new RetryFailedJobItemsUseCase(
      container.resolve('IJobRepository'),
      container.resolve('IContentItemRepository'),
      container.resolve('IEventBus')
    )
  );

  // Content Item Use Cases
  container.register('ValidateContentItemUseCase', () => 
    new ValidateContentItemUseCase(
      container.resolve('IContentItemRepository'),
      container.resolve('IValidationService'),
      container.resolve('IEventBus')
    )
  );

  container.register('GenerateTextUseCase', () => 
    new GenerateTextUseCase(
      container.resolve('IContentItemRepository'),
      container.resolve('ITextGenerationService'),
      container.resolve('IEventBus'),
      container.resolve('ISSEManager')
    )
  );

  container.register('ChunkTextUseCase', () => 
    new ChunkTextUseCase(
      container.resolve('IContentItemRepository'),
      container.resolve('ITextChunkerService'),
      container.resolve('IEventBus')
    )
  );

  container.register('GenerateAudioForChunkUseCase', () => 
    new GenerateAudioForChunkUseCase(
      container.resolve('IAudioChunkRepository'),
      container.resolve('ITTSService'),
      container.resolve('IStorageService'),
      container.resolve('IEventBus')
    )
  );

  container.register('MergeAudioChunksUseCase', () => 
    new MergeAudioChunksUseCase(
      container.resolve('IContentItemRepository'),
      container.resolve('IAudioMergeService'),
      container.resolve('IEventBus')
    )
  );

  // Chat Use Cases
  container.register('SendMessageUseCase', () => 
    new SendMessageUseCase(
      container.resolve('IChatSessionRepository'),
      container.resolve('IChatMessageRepository'),
      container.resolve('IEventBus')
    )
  );

  container.register('StreamChatResponseUseCase', () => 
    new StreamChatResponseUseCase(
      container.resolve('IChatSessionRepository'),
      container.resolve('IChatMessageRepository'),
      container.resolve('IAIService'),
      container.resolve('IEventBus'),
      container.resolve('ISSEManager')
    )
  );

  container.register('ExecuteToolCallUseCase', () => 
    new ExecuteToolCallUseCase(
      container.resolve('IChatSessionRepository'),
      container.resolve('IChatMessageRepository'),
      container.resolve('CreateJobFromCSVUseCase'),
      container.resolve('StartJobProcessingUseCase'),
      container.resolve('IEventBus')
    )
  );

  // Settings Use Cases
  container.register('GetUserSettingsUseCase', () => 
    new GetUserSettingsUseCase(
      container.resolve('IUserSettingsRepository')
    )
  );

  container.register('UpdateUserSettingsUseCase', () => 
    new UpdateUserSettingsUseCase(
      container.resolve('IUserSettingsRepository'),
      container.resolve('IEventBus')
    )
  );

  container.register('CreateCustomPromptUseCase', () => 
    new CreateCustomPromptUseCase(
      container.resolve('IUserSettingsRepository'),
      container.resolve('IEventBus')
    )
  );

  container.register('DeleteCustomPromptUseCase', () => 
    new DeleteCustomPromptUseCase(
      container.resolve('IUserSettingsRepository'),
      container.resolve('IEventBus')
    )
  );
}