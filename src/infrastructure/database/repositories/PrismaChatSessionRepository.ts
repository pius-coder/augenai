// src/infrastructure/database/repositories/PrismaChatSessionRepository.ts
// Prisma implementation of IChatSessionRepository

/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client';
import {
  IChatSessionRepository,
  ChatSessionListOptions,
} from '@/core/ports/repositories/IChatSessionRepository';
import { ChatSession } from '@/core/domain/entities/ChatSession';
import { DatabaseError } from '@/shared/utils/errors/AppError';

export class PrismaChatSessionRepository implements IChatSessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<ChatSession | null> {
    try {
      const data = await this.prisma.chatSession.findUnique({
        where: { id },
      });

      if (!data) {
        return null;
      }

      return this.mapToEntity(data);
    } catch (error) {
      throw new DatabaseError(`Failed to find chat session: ${error}`);
    }
  }

  async findAll(options?: ChatSessionListOptions): Promise<ChatSession[]> {
    try {
      const orderBy: Record<string, 'asc' | 'desc'> = {};
      if (options?.orderByCreatedAt) {
        orderBy.createdAt = options.orderByCreatedAt;
      } else {
        orderBy.createdAt = 'desc';
      }

      const data = await this.prisma.chatSession.findMany({
        orderBy: orderBy as any,
        take: options?.limit,
        skip: options?.offset,
      });

      return data.map((d) => this.mapToEntity(d));
    } catch (error) {
      throw new DatabaseError(`Failed to list chat sessions: ${error}`);
    }
  }

  async save(session: ChatSession): Promise<void> {
    try {
      const data = session.toPersistence();

      await this.prisma.chatSession.upsert({
        where: { id: data.id },
        update: {
          name: data.name,
          activeJobId: data.activeJobId,
        },
        create: {
          id: data.id,
          name: data.name,
          activeJobId: data.activeJobId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
      });
    } catch (error) {
      throw new DatabaseError(`Failed to save chat session: ${error}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.chatSession.delete({
        where: { id },
      });
    } catch {
      // If delete fails, record doesn't exist - that's acceptable
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const session = await this.prisma.chatSession.findUnique({
        where: { id },
        select: { id: true },
      });
      return session !== null;
    } catch (error) {
      throw new DatabaseError(`Failed to check chat session existence: ${error}`);
    }
  }

  private mapToEntity(data: any): ChatSession {
    const sessionData = {
      id: data.id,
      name: data.name,
      activeJobId: data.activeJobId || undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return ChatSession.fromPersistence(sessionData);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
