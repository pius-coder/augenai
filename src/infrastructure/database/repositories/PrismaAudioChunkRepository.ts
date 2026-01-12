// src/infrastructure/database/repositories/PrismaAudioChunkRepository.ts
// Prisma implementation of IAudioChunkRepository

/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client';
import {
  IAudioChunkRepository,
  AudioChunkListOptions,
} from '@/core/ports/repositories/IAudioChunkRepository';
import { AudioChunk } from '@/core/domain/entities/AudioChunk';
import { ChunkStatus } from '@/core/domain/value-objects/ChunkStatus';
import { AudioMetadata } from '@/core/domain/value-objects/AudioMetadata';
import { DatabaseError } from '@/shared/utils/errors/AppError';

export class PrismaAudioChunkRepository implements IAudioChunkRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<AudioChunk | null> {
    try {
      const data = await this.prisma.audioChunk.findUnique({
        where: { id },
      });

      if (!data) {
        return null;
      }

      return this.mapToEntity(data);
    } catch (error) {
      throw new DatabaseError(`Failed to find audio chunk: ${error}`);
    }
  }

  async findByItemId(itemId: string, options?: AudioChunkListOptions): Promise<AudioChunk[]> {
    try {
      const where: Record<string, unknown> = { itemId };

      if (options?.status) {
        where.status = options.status;
      }

      const orderBy: Record<string, 'asc' | 'desc'> = {};
      if (options?.orderByIndex) {
        orderBy.index = options.orderByIndex;
      } else {
        orderBy.index = 'asc';
      }

      const data = await this.prisma.audioChunk.findMany({
        where: where as any,
        orderBy: orderBy as any,
        take: options?.limit,
        skip: options?.offset,
      });

      return data.map((d) => this.mapToEntity(d));
    } catch (error) {
      throw new DatabaseError(`Failed to find audio chunks for item: ${error}`);
    }
  }

  async findByTextChunkId(textChunkId: string): Promise<AudioChunk | null> {
    try {
      const data = await this.prisma.audioChunk.findUnique({
        where: { textChunkId },
      });

      if (!data) {
        return null;
      }

      return this.mapToEntity(data);
    } catch (error) {
      throw new DatabaseError(`Failed to find audio chunk by text chunk: ${error}`);
    }
  }

  async save(chunk: AudioChunk): Promise<void> {
    try {
      const data = chunk.toPersistence();

      await this.prisma.audioChunk.upsert({
        where: { id: data.id },
        update: {
          status: data.status,
          audioPath: data.audioPath,
          duration: data.duration,
          fileSize: data.fileSize,
          voiceId: chunk.voiceId,
          retryCount: data.retryCount,
          lastError: data.lastError,
          completedAt: data.completedAt,
        },
        create: {
          id: data.id,
          itemId: data.itemId,
          textChunkId: data.textChunkId,
          index: data.index,
          status: data.status,
          audioPath: data.audioPath,
          duration: data.duration,
          fileSize: data.fileSize,
          voiceId: chunk.voiceId,
          retryCount: data.retryCount,
          lastError: data.lastError,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          completedAt: data.completedAt,
        },
      });
    } catch (error) {
      throw new DatabaseError(`Failed to save audio chunk: ${error}`);
    }
  }

  async saveMany(chunks: AudioChunk[]): Promise<void> {
    try {
      const data = chunks.map((chunk) => {
        const d = chunk.toPersistence();
        return {
          id: d.id,
          itemId: d.itemId,
          textChunkId: d.textChunkId,
          index: d.index,
          status: d.status,
          audioPath: d.audioPath,
          duration: d.duration,
          fileSize: d.fileSize,
          voiceId: chunk.voiceId,
          retryCount: d.retryCount,
          lastError: d.lastError,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          completedAt: d.completedAt,
        };
      });

      await this.prisma.audioChunk.createMany({
        data,
        skipDuplicates: true,
      });
    } catch (error) {
      throw new DatabaseError(`Failed to save audio chunks: ${error}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.audioChunk.delete({
        where: { id },
      });
    } catch {
      // If delete fails, record doesn't exist - that's acceptable
    }
  }

  async deleteByItemId(itemId: string): Promise<void> {
    try {
      await this.prisma.audioChunk.deleteMany({
        where: { itemId },
      });
    } catch (error) {
      throw new DatabaseError(`Failed to delete audio chunks for item: ${error}`);
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const chunk = await this.prisma.audioChunk.findUnique({
        where: { id },
        select: { id: true },
      });
      return chunk !== null;
    } catch (error) {
      throw new DatabaseError(`Failed to check audio chunk existence: ${error}`);
    }
  }

  private mapToEntity(data: any): AudioChunk {
    const chunkData = {
      id: data.id,
      itemId: data.itemId,
      textChunkId: data.textChunkId,
      index: data.index,
      status: data.status as ChunkStatus,
      audioPath: data.audioPath || undefined,
      duration: data.duration || undefined,
      fileSize: data.fileSize || undefined,
      audioMetadata: data.duration && data.fileSize
        ? AudioMetadata.create({
            duration: data.duration,
            fileSize: data.fileSize,
          })
        : undefined,
      voiceId: data.voiceId || undefined,
      retryCount: data.retryCount,
      lastError: data.lastError || undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      completedAt: data.completedAt || undefined,
    };

    return AudioChunk.fromPersistence(chunkData);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
