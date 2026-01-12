// src/core/domain/use-cases/content/UploadAudioUseCase.ts
// Use case: Upload audio file for a content item

import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { IStorageService } from '@/core/ports/services/storage/IStorageService';
import { AudioMergeCompletedEvent } from '../../events/item/AudioMergeCompletedEvent';
import { ItemStatus } from '../../value-objects/ItemStatus';
import { PipelineStep } from '../../entities/ContentItem';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';
import { Readable } from 'stream';

export interface UploadAudioInput {
  itemId: string;
  audioFile: Express.Multer.File | {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
  metadata?: {
    duration?: number;
    format?: string;
    bitrate?: number;
  };
}

export interface UploadAudioOutput {
  success: boolean;
  itemId: string;
  audioUrl: string;
  duration: number;
  fileSize: number;
  metadata: Record<string, any>;
}

export class UploadAudioUseCase {
  constructor(
    private readonly itemRepository: IContentItemRepository,
    private readonly storageService: IStorageService,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: UploadAudioInput): Promise<UploadAudioOutput> {
    const { itemId, audioFile, metadata = {} } = input;

    // Find item
    const item = await this.itemRepository.findById(itemId);
    if (!item) {
      throw ErrorFactory.notFound(`Content item with id ${itemId} not found`);
    }

    // Validate audio file
    if (!audioFile || (audioFile as Express.Multer.File).size === 0) {
      throw ErrorFactory.validationError('Audio file is required');
    }

    const file = audioFile as Express.Multer.File;
    
    // Validate file type
    const allowedMimetypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/aac'];
    if (!allowedMimetypes.includes(file.mimetype)) {
      throw ErrorFactory.validationError(`Invalid audio file type: ${file.mimetype}. Allowed types: ${allowedMimetypes.join(', ')}`);
    }

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop() || 'mp3';
    const fileName = `upload_${item.jobId}_${itemId}_${Date.now()}.${fileExtension}`;

    try {
      // Upload audio to storage
      const audioUrl = await this.storageService.uploadFile(
        fileName,
        file.buffer,
        {
          contentType: file.mimetype,
          metadata: {
            itemId,
            jobId: item.jobId,
            originalName: file.originalname,
            size: file.size,
            ...metadata,
          },
        }
      );

      // Calculate duration if not provided
      const duration = metadata.duration || this.estimateDuration(file.size, file.mimetype);

      // Update item with audio information
      item.setAudio(audioUrl, duration);
      item.updateStep(PipelineStep.UPLOAD, ItemStatus.COMPLETED);
      await this.itemRepository.save(item);

      // Emit audio merge completed event
      await this.eventBus.publish(
        new AudioMergeCompletedEvent({
          itemId: item.id,
          jobId: item.jobId,
          audioUrl,
          audioDuration: duration,
          timestamp: new Date(),
          isUpload: true,
        })
      );

      return {
        success: true,
        itemId,
        audioUrl,
        duration,
        fileSize: file.size,
        metadata: {
          format: fileExtension,
          mimetype: file.mimetype,
          ...metadata,
        },
      };
    } catch (error) {
      // Update item status to failed
      item.setStatus(ItemStatus.FAILED);
      item.updateStep(PipelineStep.UPLOAD, ItemStatus.FAILED);
      await this.itemRepository.save(item);

      throw ErrorFactory.storageError(
        'audio.upload',
        `Failed to upload audio for item ${itemId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private estimateDuration(fileSize: number, mimetype: string): number {
    // Rough estimation: MP3 ~1MB per minute at 128kbps
    const bytesPerMinute = mimetype.includes('mp3') ? 1024 * 1024 : 1024 * 1024 * 2; // Assume 2MB per minute for other formats
    return Math.ceil(fileSize / bytesPerMinute * 60);
  }
}

// Extend IContentItem with audio-related methods
declare module '../../entities/ContentItem' {
  interface ContentItem {
    setAudio(audioUrl: string, duration: number): void;
    updateStep(step: PipelineStep, status: ItemStatus): void;
    errorMessage?: string;
    attempts?: number;
  }
}

// Extend storage service interface
declare module '@/core/ports/services/storage/IStorageService' {
  interface IStorageService {
    uploadFile(
      fileName: string,
      data: Buffer,
      options?: {
        contentType?: string;
        metadata?: Record<string, any>;
      }
    ): Promise<string>;
  }
}

declare module '@/core/ports/repositories/IContentItemRepository' {
  interface IContentItemRepository {
    findByJobIdAndStatus(jobId: string, status: ItemStatus): Promise<ContentItem[]>;
  }
}