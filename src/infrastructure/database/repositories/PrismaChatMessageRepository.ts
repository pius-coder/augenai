// src/infrastructure/database/repositories/PrismaChatMessageRepository.ts
// Prisma implementation of IChatMessageRepository

/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client';
import {
  IChatMessageRepository,
  ChatMessageListOptions,
} from '@/core/ports/repositories/IChatMessageRepository';
import { ChatMessage, MessageRole } from '@/core/domain/entities/ChatMessage';
import { DatabaseError } from '@/shared/utils/errors/AppError';

export class PrismaChatMessageRepository implements IChatMessageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<ChatMessage | null> {
    try {
      const data = await this.prisma.chatMessage.findUnique({
        where: { id },
      });

      if (!data) {
        return null;
      }

      return this.mapToEntity(data);
    } catch (error) {
      throw new DatabaseError(`Failed to find chat message: ${error}`);
    }
  }

  async findBySessionId(sessionId: string, options?: ChatMessageListOptions): Promise<ChatMessage[]> {
    try {
      const orderBy: Record<string, 'asc' | 'desc'> = {};
      if (options?.orderByCreatedAt) {
        orderBy.createdAt = options.orderByCreatedAt;
      } else {
        orderBy.createdAt = 'asc';
      }

      const data = await this.prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: orderBy as any,
        take: options?.limit,
        skip: options?.offset,
      });

      return data.map((d) => this.mapToEntity(d));
    } catch (error) {
      throw new DatabaseError(`Failed to find chat messages for session: ${error}`);
    }
  }

  async save(message: ChatMessage): Promise<void> {
    try {
      const data = message.toPersistence();

      await this.prisma.chatMessage.upsert({
        where: { id: data.id },
        update: {
          content: data.content,
          actions: data.actions ? JSON.stringify(data.actions) : null,
          tokenCount: data.tokenCount,
        },
        create: {
          id: data.id,
          sessionId: data.sessionId,
          role: data.role,
          content: data.content,
          actions: data.actions ? JSON.stringify(data.actions) : null,
          tokenCount: data.tokenCount,
          createdAt: data.createdAt,
        },
      });
    } catch (error) {
      throw new DatabaseError(`Failed to save chat message: ${error}`);
    }
  }

  async saveMany(messages: ChatMessage[]): Promise<void> {
    try {
      const data = messages.map((message) => {
        const d = message.toPersistence();
        return {
          id: d.id,
          sessionId: d.sessionId,
          role: d.role,
          content: d.content,
          actions: d.actions ? JSON.stringify(d.actions) : null,
          tokenCount: d.tokenCount,
          createdAt: d.createdAt,
        };
      });

      await this.prisma.chatMessage.createMany({
        data,
        skipDuplicates: true,
      });
    } catch (error) {
      throw new DatabaseError(`Failed to save chat messages: ${error}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.chatMessage.delete({
        where: { id },
      });
    } catch {
      // If delete fails, record doesn't exist - that's acceptable
    }
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    try {
      await this.prisma.chatMessage.deleteMany({
        where: { sessionId },
      });
    } catch {
      throw new DatabaseError(`Failed to delete chat messages for session: ${error}`);
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const message = await this.prisma.chatMessage.findUnique({
        where: { id },
        select: { id: true },
      });
      return message !== null;
    } catch (error) {
      throw new DatabaseError(`Failed to check chat message existence: ${error}`);
    }
  }

  private mapToEntity(data: any): ChatMessage {
    const messageData = {
      id: data.id,
      sessionId: data.sessionId,
      role: data.role as MessageRole,
      content: data.content,
      actions: data.actions ? JSON.parse(data.actions) : undefined,
      tokenCount: data.tokenCount,
      createdAt: data.createdAt,
    };

    return ChatMessage.fromPersistence(messageData);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
