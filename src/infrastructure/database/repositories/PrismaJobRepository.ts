// src/infrastructure/database/repositories/PrismaJobRepository.ts
// Prisma implementation of IJobRepository

/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client';
import { IJobRepository, JobListOptions } from '@/core/ports/repositories/IJobRepository';
import { Job } from '@/core/domain/entities/Job';
import { VoiceSettings } from '@/core/domain/value-objects/VoiceSettings';
import { PromptTemplate } from '@/core/domain/value-objects/PromptTemplate';
import { JobStatus } from '@/core/domain/value-objects/JobStatus';
import { DatabaseError } from '@/shared/utils/errors/AppError';

export class PrismaJobRepository implements IJobRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Job | null> {
    try {
      const data = await this.prisma.job.findUnique({
        where: { id },
      });

      if (!data) {
        return null;
      }

      return this.mapToEntity(data);
    } catch (error) {
      throw new DatabaseError(`Failed to find job: ${error}`);
    }
  }

  async findAll(options?: JobListOptions): Promise<Job[]> {
    try {
      const where: Record<string, unknown> = {};

      if (options?.status) {
        where.status = options.status;
      }

      const orderBy: Record<string, 'asc' | 'desc'> = {};
      if (options?.orderByCreatedAt) {
        orderBy.createdAt = options.orderByCreatedAt;
      } else {
        orderBy.createdAt = 'desc';
      }

      const data = await this.prisma.job.findMany({
        where: where as any,
        orderBy: orderBy as any,
        take: options?.limit,
        skip: options?.offset,
      });

      return data.map((d) => this.mapToEntity(d));
    } catch (error) {
      throw new DatabaseError(`Failed to list jobs: ${error}`);
    }
  }

  async save(job: Job): Promise<void> {
    try {
      const data = job.toPersistence();

      // Prepare voice settings for Prisma
      const voiceSettings = data.voiceSettings
        ? {
            voiceId: data.voiceSettings.voiceId,
            voiceName: data.voiceSettings.voiceName,
          }
        : {};

      // Prepare prompt template for Prisma
      const prompts = {
        systemPrompt: data.systemPrompt,
        userPromptTemplate: data.userPromptTemplate?.template || '',
      };

      await this.prisma.job.upsert({
        where: { id: data.id },
        update: {
          name: data.name,
          status: data.status,
          ...voiceSettings,
          ...prompts,
          maxChunkSize: data.maxChunkSize,
          silenceBetweenChunks: data.silenceBetweenChunks,
          totalItems: data.totalItems,
          completedItems: data.completedItems,
          failedItems: data.failedItems,
          startedAt: data.startedAt,
          completedAt: data.completedAt,
        },
        create: {
          id: data.id,
          name: data.name,
          status: data.status,
          ...voiceSettings,
          ...prompts,
          maxChunkSize: data.maxChunkSize,
          silenceBetweenChunks: data.silenceBetweenChunks,
          totalItems: data.totalItems,
          completedItems: data.completedItems,
          failedItems: data.failedItems,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          startedAt: data.startedAt,
          completedAt: data.completedAt,
        },
      });
    } catch (error) {
      throw new DatabaseError(`Failed to save job: ${error}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.job.delete({
        where: { id },
      });
    } catch {
      // If delete fails, record doesn't exist - that's acceptable
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const job = await this.prisma.job.findUnique({
        where: { id },
        select: { id: true },
      });
      return job !== null;
    } catch (error) {
      throw new DatabaseError(`Failed to check job existence: ${error}`);
    }
  }

  private mapToEntity(data: any): Job {
    // Map Prisma Job to Domain Job entity
    const jobData = {
      id: data.id,
      name: data.name,
      status: data.status as JobStatus,
      voiceSettings: data.voiceId
        ? VoiceSettings.create({
            voiceId: data.voiceId,
            voiceName: data.voiceName || undefined,
          })
        : undefined,
      systemPrompt: data.systemPrompt,
      userPromptTemplate: data.userPromptTemplate
        ? PromptTemplate.create(data.userPromptTemplate)
        : undefined,
      maxChunkSize: data.maxChunkSize,
      silenceBetweenChunks: data.silenceBetweenChunks,
      totalItems: data.totalItems,
      completedItems: data.completedItems,
      failedItems: data.failedItems,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      startedAt: data.startedAt || undefined,
      completedAt: data.completedAt || undefined,
    };

    return Job.fromPersistence(jobData);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
