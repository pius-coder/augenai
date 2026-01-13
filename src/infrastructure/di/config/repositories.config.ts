// src/infrastructure/di/config/repositories.config.ts
// Register all repository implementations with DI container

import { Container } from '../Container';
import { PrismaJobRepository } from '@/infrastructure/database/repositories/PrismaJobRepository';
import { PrismaContentItemRepository } from '@/infrastructure/database/repositories/PrismaContentItemRepository';
import { PrismaAudioChunkRepository } from '@/infrastructure/database/repositories/PrismaAudioChunkRepository';
import { PrismaChatSessionRepository } from '@/infrastructure/database/repositories/PrismaChatSessionRepository';
import { PrismaChatMessageRepository } from '@/infrastructure/database/repositories/PrismaChatMessageRepository';
import { PrismaUserSettingsRepository } from '@/infrastructure/database/repositories/PrismaUserSettingsRepository';
import { PrismaErrorLogRepository } from '@/infrastructure/database/repositories/PrismaErrorLogRepository';
import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IAudioChunkRepository } from '@/core/ports/repositories/IAudioChunkRepository';
import { IChatSessionRepository } from '@/core/ports/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '@/core/ports/repositories/IChatMessageRepository';
import { IUserSettingsRepository } from '@/core/ports/repositories/IUserSettingsRepository';
import { IErrorLogRepository } from '@/core/ports/repositories/IErrorLogRepository';
import { prisma } from '@/shared/lib/prisma';

export function registerRepositories(container: Container): void {
  // Register Prisma repositories
  container.register<IJobRepository>('IJobRepository', () => 
    new PrismaJobRepository(prisma)
  );

  container.register<IContentItemRepository>('IContentItemRepository', () => 
    new PrismaContentItemRepository(prisma)
  );

  container.register<IAudioChunkRepository>('IAudioChunkRepository', () => 
    new PrismaAudioChunkRepository(prisma)
  );

  container.register<IChatSessionRepository>('IChatSessionRepository', () => 
    new PrismaChatSessionRepository(prisma)
  );

  container.register<IChatMessageRepository>('IChatMessageRepository', () => 
    new PrismaChatMessageRepository(prisma)
  );

  container.register<IUserSettingsRepository>('IUserSettingsRepository', () => 
    new PrismaUserSettingsRepository(prisma)
  );

  container.register<IErrorLogRepository>('IErrorLogRepository', () => 
    new PrismaErrorLogRepository(prisma)
  );
}