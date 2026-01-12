// src/infrastructure/database/repositories/PrismaErrorLogRepository.ts
// Prisma implementation of IErrorLogRepository

/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client';
import {
  IErrorLogRepository,
  ErrorLogListOptions,
} from '@/core/ports/repositories/IErrorLogRepository';
import { ErrorLog } from '@/core/domain/entities/ErrorLog';
import { DatabaseError } from '@/shared/utils/errors/AppError';

export class PrismaErrorLogRepository implements IErrorLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<ErrorLog | null> {
    try {
      const data = await this.prisma.errorLog.findUnique({
        where: { id },
      });

      if (!data) {
        return null;
      }

      return this.mapToEntity(data);
    } catch (error) {
      throw new DatabaseError(`Failed to find error log: ${error}`);
    }
  }

  async findByJobId(jobId: string, options?: ErrorLogListOptions): Promise<ErrorLog[]> {
    try {
      const where: Record<string, unknown> = { jobId };

      if (options?.step) {
        where.step = options.step;
      }

      const orderBy: Record<string, 'asc' | 'desc'> = {};
      if (options?.orderByCreatedAt) {
        orderBy.createdAt = options.orderByCreatedAt;
      } else {
        orderBy.createdAt = 'desc';
      }

      const data = await this.prisma.errorLog.findMany({
        where: where as any,
        orderBy: orderBy as any,
        take: options?.limit,
        skip: options?.offset,
      });

      return data.map((d) => this.mapToEntity(d));
    } catch (error) {
      throw new DatabaseError(`Failed to find error logs for job: ${error}`);
    }
  }

  async findByItemId(itemId: string, options?: ErrorLogListOptions): Promise<ErrorLog[]> {
    try {
      const where: Record<string, unknown> = { itemId };

      if (options?.step) {
        where.step = options.step;
      }

      const orderBy: Record<string, 'asc' | 'desc'> = {};
      if (options?.orderByCreatedAt) {
        orderBy.createdAt = options.orderByCreatedAt;
      } else {
        orderBy.createdAt = 'desc';
      }

      const data = await this.prisma.errorLog.findMany({
        where: where as any,
        orderBy: orderBy as any,
        take: options?.limit,
        skip: options?.offset,
      });

      return data.map((d) => this.mapToEntity(d));
    } catch (error) {
      throw new DatabaseError(`Failed to find error logs for item: ${error}`);
    }
  }

  async findByChunkId(chunkId: string, options?: ErrorLogListOptions): Promise<ErrorLog[]> {
    try {
      const where: Record<string, unknown> = { chunkId };

      if (options?.step) {
        where.step = options.step;
      }

      const orderBy: Record<string, 'asc' | 'desc'> = {};
      if (options?.orderByCreatedAt) {
        orderBy.createdAt = options.orderByCreatedAt;
      } else {
        orderBy.createdAt = 'desc';
      }

      const data = await this.prisma.errorLog.findMany({
        where: where as any,
        orderBy: orderBy as any,
        take: options?.limit,
        skip: options?.offset,
      });

      return data.map((d) => this.mapToEntity(d));
    } catch (error) {
      throw new DatabaseError(`Failed to find error logs for chunk: ${error}`);
    }
  }

  async save(errorLog: ErrorLog): Promise<void> {
    try {
      const data = errorLog.toPersistence();

      await this.prisma.errorLog.create({
        data: {
          id: data.id,
          jobId: data.jobId,
          itemId: data.itemId,
          chunkId: data.chunkId,
          step: data.step,
          errorCode: data.errorCode,
          message: data.message,
          details: data.details,
          stackTrace: data.stackTrace,
          isRetryable: data.isRetryable,
          wasRetried: data.wasRetried,
          retriedAt: data.retriedAt,
          createdAt: data.createdAt,
        },
      });
    } catch (error) {
      throw new DatabaseError(`Failed to save error log: ${error}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.errorLog.delete({
        where: { id },
      });
    } catch {
      // If delete fails, record doesn't exist - that's acceptable
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const errorLog = await this.prisma.errorLog.findUnique({
        where: { id },
        select: { id: true },
      });
      return errorLog !== null;
    } catch (error) {
      throw new DatabaseError(`Failed to check error log existence: ${error}`);
    }
  }

  private mapToEntity(data: any): ErrorLog {
    const errorLogData = {
      id: data.id,
      jobId: data.jobId || undefined,
      itemId: data.itemId || undefined,
      chunkId: data.chunkId || undefined,
      step: data.step,
      errorCode: data.errorCode || undefined,
      message: data.message,
      details: data.details || undefined,
      stackTrace: data.stackTrace || undefined,
      isRetryable: data.isRetryable,
      wasRetried: data.wasRetried,
      retriedAt: data.retriedAt || undefined,
      createdAt: data.createdAt,
    };

    return ErrorLog.fromPersistence(errorLogData);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
