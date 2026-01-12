// src/infrastructure/database/repositories/PrismaContentItemRepository.ts
// Prisma implementation of IContentItemRepository

/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client';
import {
  IContentItemRepository,
  ContentItemListOptions,
} from '@/core/ports/repositories/IContentItemRepository';
import { ContentItem } from '@/core/domain/entities/ContentItem';
import { ItemStatus } from '@/core/domain/value-objects/ItemStatus';
import { ContentCategory } from '@/core/domain/value-objects/CSVRow';
import { DatabaseError } from '@/shared/utils/errors/AppError';

export class PrismaContentItemRepository implements IContentItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<ContentItem | null> {
    try {
      const data = await this.prisma.contentItem.findUnique({
        where: { id },
      });

      if (!data) {
        return null;
      }

      return this.mapToEntity(data);
    } catch (error) {
      throw new DatabaseError(`Failed to find content item: ${error}`);
    }
  }

  async findByJobId(jobId: string, options?: ContentItemListOptions): Promise<ContentItem[]> {
    try {
      const where: Record<string, unknown> = { jobId };

      if (options?.status) {
        where.status = options.status;
      }

      const orderBy: Record<string, 'asc' | 'desc'> = {};
      if (options?.orderByRowIndex) {
        orderBy.rowIndex = options.orderByRowIndex;
      } else if (options?.orderByUpdatedAt) {
        orderBy.updatedAt = options.orderByUpdatedAt;
      } else {
        orderBy.rowIndex = 'asc';
      }

      const data = await this.prisma.contentItem.findMany({
        where: where as any,
        orderBy: orderBy as any,
        take: options?.limit,
        skip: options?.offset,
      });

      return data.map((d) => this.mapToEntity(d));
    } catch (error) {
      throw new DatabaseError(`Failed to find content items for job: ${error}`);
    }
  }

  async save(item: ContentItem): Promise<void> {
    try {
      const data = item.toPersistence();

      await this.prisma.contentItem.upsert({
        where: { id: data.id },
        update: {
          status: data.status,
          currentStep: data.currentStep,
          titre: data.titre,
          details: data.details,
          category: data.category as any,
          reference: data.reference,
          generatedText: data.generatedText,
          finalAudioPath: data.finalAudioPath,
          audioDuration: data.audioDuration,
          retryCount: data.retryCount,
          startedAt: data.startedAt,
          completedAt: data.completedAt,
        },
        create: {
          id: data.id,
          jobId: data.jobId,
          rowIndex: data.rowIndex,
          status: data.status,
          currentStep: data.currentStep,
          titre: data.titre,
          details: data.details,
          category: data.category as any,
          reference: data.reference,
          generatedText: data.generatedText,
          finalAudioPath: data.finalAudioPath,
          audioDuration: data.audioDuration,
          retryCount: data.retryCount,
          maxRetries: data.maxRetries,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          startedAt: data.startedAt,
          completedAt: data.completedAt,
        },
      });
    } catch (error) {
      throw new DatabaseError(`Failed to save content item: ${error}`);
    }
  }

  async saveMany(items: ContentItem[]): Promise<void> {
    try {
      const data = items.map((item) => {
        const d = item.toPersistence();
        return {
          id: d.id,
          jobId: d.jobId,
          rowIndex: d.rowIndex,
          status: d.status,
          currentStep: d.currentStep,
          titre: d.titre,
          details: d.details,
          category: d.category,
          reference: d.reference,
          generatedText: d.generatedText,
          finalAudioPath: d.finalAudioPath,
          audioDuration: d.audioDuration,
          retryCount: d.retryCount,
          maxRetries: d.maxRetries,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          startedAt: d.startedAt,
          completedAt: d.completedAt,
        };
      });

      await this.prisma.contentItem.createMany({
        data,
        skipDuplicates: true,
      });
    } catch (error) {
      throw new DatabaseError(`Failed to save content items: ${error}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.contentItem.delete({
        where: { id },
      });
    } catch {
      // If delete fails, record doesn't exist - that's acceptable
    }
  }

  async deleteByJobId(jobId: string): Promise<void> {
    try {
      await this.prisma.contentItem.deleteMany({
        where: { jobId },
      });
    } catch (error) {
      throw new DatabaseError(`Failed to delete content items for job: ${error}`);
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const item = await this.prisma.contentItem.findUnique({
        where: { id },
        select: { id: true },
      });
      return item !== null;
    } catch (error) {
      throw new DatabaseError(`Failed to check content item existence: ${error}`);
    }
  }

  private mapToEntity(data: any): ContentItem {
    const itemData = {
      id: data.id,
      jobId: data.jobId,
      rowIndex: data.rowIndex,
      status: data.status as ItemStatus,
      currentStep: data.currentStep,
      titre: data.titre,
      details: data.details,
      category: data.category as ContentCategory,
      reference: data.reference,
      generatedText: data.generatedText || undefined,
      finalAudioPath: data.finalAudioPath || undefined,
      audioDuration: data.audioDuration || undefined,
      retryCount: data.retryCount,
      maxRetries: data.maxRetries,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      startedAt: data.startedAt || undefined,
      completedAt: data.completedAt || undefined,
    };

    return ContentItem.fromPersistence(itemData);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
