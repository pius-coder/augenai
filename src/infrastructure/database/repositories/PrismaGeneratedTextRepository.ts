// src/infrastructure/database/repositories/PrismaGeneratedTextRepository.ts
// Prisma implementation of IGeneratedTextRepository

import { PrismaClient } from '@prisma/client';
import { IGeneratedTextRepository } from '@/core/ports/repositories/IGeneratedTextRepository';
import { GeneratedText } from '@/core/domain/entities/GeneratedText';
import { DatabaseError } from '@/shared/utils/errors/AppError';

export class PrismaGeneratedTextRepository implements IGeneratedTextRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByItemId(itemId: string): Promise<GeneratedText | null> {
    try {
      const item = await this.prisma.contentItem.findUnique({
        where: { id: itemId },
        select: { generatedText: true },
      });

      if (!item || !item.generatedText) {
        return null;
      }

      // Create GeneratedText entity from the stored text
      const textData = {
        itemId,
        content: item.generatedText,
        charCount: item.generatedText.length,
        estimatedDuration: undefined,
        metadata: undefined,
        createdAt: new Date(), // We don't have separate timestamp in schema
        updatedAt: new Date(),
      };

      return GeneratedText.fromPersistence(textData);
    } catch (error) {
      throw new DatabaseError(`Failed to find generated text: ${error}`);
    }
  }

  async save(text: GeneratedText): Promise<void> {
    try {
      const data = text.toPersistence();

      // Store the generated text in the ContentItem
      await this.prisma.contentItem.update({
        where: { id: data.itemId },
        data: {
          generatedText: data.content,
        },
      });
    } catch (error) {
      throw new DatabaseError(`Failed to save generated text: ${error}`);
    }
  }

  async deleteByItemId(itemId: string): Promise<void> {
    try {
      await this.prisma.contentItem.update({
        where: { id: itemId },
        data: {
          generatedText: null,
        },
      });
    } catch (error) {
      throw new DatabaseError(`Failed to delete generated text: ${error}`);
    }
  }
}
