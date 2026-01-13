// src/infrastructure/di/config/workers.config.ts
// Register all worker implementations with DI container

import { Container } from '../Container';
import { TextGenerationWorker } from '@/infrastructure/queue/workers/TextGenerationWorker';
import { AudioGenerationWorker } from '@/infrastructure/queue/workers/AudioGenerationWorker';
import { AudioMergeWorker } from '@/infrastructure/queue/workers/AudioMergeWorker';
import { ValidationWorker } from '@/infrastructure/queue/workers/ValidationWorker';
import { IWorker } from '@/core/ports/queue/IWorker';

export function registerWorkers(container: Container): void {
  // Register workers
  container.register<IWorker>('TextGenerationWorker', () => 
    new TextGenerationWorker(
      container.resolve('GenerateTextUseCase'),
      container.resolve('IEventBus')
    )
  );

  container.register<IWorker>('AudioGenerationWorker', () => 
    new AudioGenerationWorker(
      container.resolve('GenerateAudioForChunkUseCase'),
      container.resolve('IEventBus')
    )
  );

  container.register<IWorker>('AudioMergeWorker', () => 
    new AudioMergeWorker(
      container.resolve('MergeAudioChunksUseCase'),
      container.resolve('IEventBus')
    )
  );

  container.register<IWorker>('ValidationWorker', () => 
    new ValidationWorker(
      container.resolve('ValidateContentItemUseCase'),
      container.resolve('IEventBus')
    )
  );
}