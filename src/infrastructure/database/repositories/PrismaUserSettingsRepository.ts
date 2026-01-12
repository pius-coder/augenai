// src/infrastructure/database/repositories/PrismaUserSettingsRepository.ts
// Prisma implementation of IUserSettingsRepository

/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client';
import { IUserSettingsRepository } from '@/core/ports/repositories/IUserSettingsRepository';
import { UserSettings, ChannelTone, AudioFormat, Theme } from '@/core/domain/entities/UserSettings';
import { DatabaseError } from '@/shared/utils/errors/AppError';

export class PrismaUserSettingsRepository implements IUserSettingsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(): Promise<UserSettings | null> {
    try {
      const data = await this.prisma.userSettings.findUnique({
        where: { id: 'default' },
      });

      if (!data) {
        return null;
      }

      return this.mapToEntity(data);
    } catch (error) {
      throw new DatabaseError(`Failed to get user settings: ${error}`);
    }
  }

  async getOrCreateDefault(): Promise<UserSettings> {
    try {
      const existing = await this.get();
      if (existing) {
        return existing;
      }

      const defaultSettings = UserSettings.create();
      await this.save(defaultSettings);
      return defaultSettings;
    } catch (error) {
      throw new DatabaseError(`Failed to get or create user settings: ${error}`);
    }
  }

  async save(settings: UserSettings): Promise<void> {
    try {
      const data = settings.toPersistence();

      await this.prisma.userSettings.upsert({
        where: { id: 'default' },
        update: {
          channelName: data.channelName,
          channelDescription: data.channelDescription,
          channelTone: data.channelTone as any,
          channelLanguage: data.channelLanguage,
          defaultVoiceId: data.defaultVoiceId,
          defaultMaxChunkSize: data.defaultMaxChunkSize,
          defaultSilenceBetween: data.defaultSilenceBetween,
          defaultAudioFormat: data.defaultAudioFormat as any,
          defaultAutoRetry: data.defaultAutoRetry,
          theme: data.theme as any,
          sidebarOpen: data.sidebarOpen,
        },
        create: {
          id: data.id,
          channelName: data.channelName,
          channelDescription: data.channelDescription,
          channelTone: data.channelTone as any,
          channelLanguage: data.channelLanguage,
          defaultVoiceId: data.defaultVoiceId,
          defaultMaxChunkSize: data.defaultMaxChunkSize,
          defaultSilenceBetween: data.defaultSilenceBetween,
          defaultAudioFormat: data.defaultAudioFormat as any,
          defaultAutoRetry: data.defaultAutoRetry,
          theme: data.theme as any,
          sidebarOpen: data.sidebarOpen,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
      });
    } catch (error) {
      throw new DatabaseError(`Failed to save user settings: ${error}`);
    }
  }

  private mapToEntity(data: any): UserSettings {
    const settingsData = {
      id: data.id,
      channelName: data.channelName,
      channelDescription: data.channelDescription,
      channelTone: data.channelTone as ChannelTone,
      channelLanguage: data.channelLanguage,
      defaultVoiceId: data.defaultVoiceId,
      defaultMaxChunkSize: data.defaultMaxChunkSize,
      defaultSilenceBetween: data.defaultSilenceBetween,
      defaultAudioFormat: data.defaultAudioFormat as AudioFormat,
      defaultAutoRetry: data.defaultAutoRetry,
      theme: data.theme as Theme,
      sidebarOpen: data.sidebarOpen,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return UserSettings.fromPersistence(settingsData);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
