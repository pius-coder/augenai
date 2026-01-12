// src/core/domain/use-cases/job/ExportJobResultsUseCase.ts
// Use case: Export job results as a downloadable file

import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IAudioChunkRepository } from '@/core/ports/repositories/IAudioChunkRepository';
import { Job } from '../../entities/Job';
import { ContentItem } from '../../entities/ContentItem';
import { IStorageService } from '@/core/ports/Services/storage/IStorageService';
import { JobStatus } from '../../value-objects/JobStatus';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export interface ExportJobResultsInput {
  jobId: string;
  format: 'json' | 'csv' | 'zip';
  includeAudio?: boolean;
  includeMetadata?: boolean;
}

export interface ExportJobResultsOutput {
  success: boolean;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
}

export class ExportJobResultsUseCase {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly itemRepository: IContentItemRepository,
    private readonly chunkRepository: IAudioChunkRepository,
    private readonly storageService: IStorageService
  ) {}

  async execute(input: ExportJobResultsInput): Promise<ExportJobResultsOutput> {
    const { jobId, format, includeAudio = true, includeMetadata = true } = input;

    // Find job
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw ErrorFactory.notFound(`Job with id ${jobId} not found`);
    }

    // Check if job is completed
    if (job.status !== JobStatus.COMPLETED) {
      throw ErrorFactory.invalidTransition(
        'job.status',
        `Cannot export results for job in ${job.status} status. Job must be completed.`
      );
    }

    // Get all items for the job
    const items = await this.itemRepository.findByJobId(jobId);
    
    // Prepare export data
    const exportData = await this.prepareExportData(job, items, includeAudio);
    
    // Generate file based on format
    const fileName = `job_${jobId}_export.${format}`;
    let fileContent: string | Buffer;
    let contentType: string;

    switch (format) {
      case 'json':
        fileContent = JSON.stringify(exportData, null, 2);
        contentType = 'application/json';
        break;
      
      case 'csv':
        fileContent = this.generateCSV(exportData);
        contentType = 'text/csv';
        break;
      
      case 'zip':
        fileContent = await this.generateZip(exportData, jobId);
        contentType = 'application/zip';
        break;
      
      default:
        throw ErrorFactory.validationError(`Unsupported export format: ${format}`);
    }

    // Store file and get download URL
    const fileBuffer = Buffer.isBuffer(fileContent) ? fileContent : Buffer.from(fileContent);
    const downloadUrl = await this.storageService.uploadExport(
      fileName,
      fileBuffer,
      contentType
    );

    return {
      success: true,
      downloadUrl,
      fileName,
      fileSize: fileBuffer.length,
    };
  }

  private async prepareExportData(
    job: Job,
    items: ContentItem[],
    includeAudio: boolean
  ): Promise<any> {
    const exportData: any = {
      jobId: job.id,
      jobName: job.name,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      totalItems: job.totalItems,
      completedItems: job.completedItems,
      failedItems: job.failedItems,
      items: [],
    };

    for (const item of items) {
      const itemData: any = {
        itemId: item.id,
        originalText: item.originalText,
        generatedText: item.generatedText,
        status: item.status,
        metadata: item.metadata,
        createdAt: item.createdAt,
        completedAt: item.completedAt,
      };

      if (includeAudio && item.audioUrl) {
        itemData.audioUrl = item.audioUrl;
        itemData.audioDuration = item.audioDuration;
        
        // Get chunks if needed
        if (item.status === 'COMPLETED') {
          const chunks = await this.chunkRepository.findByItemId(item.id);
          itemData.chunks = chunks.map(chunk => ({
            chunkId: chunk.id,
            text: chunk.text,
            audioUrl: chunk.audioUrl,
            duration: chunk.duration,
            sequence: chunk.sequence,
          }));
        }
      }

      exportData.items.push(itemData);
    }

    return exportData;
  }

  private generateCSV(data: any): string {
    const headers = ['Item ID', 'Original Text', 'Generated Text', 'Status', 'Created At', 'Completed At'];
    let csv = headers.join(',') + '\n';

    for (const item of data.items) {
      const row = [
        item.itemId,
        `"${(item.originalText || '').toString().replace(/"/g, '""')}"`,
        `"${(item.generatedText || '').toString().replace(/"/g, '""')}"`,
        item.status,
        item.createdAt,
        item.completedAt || '',
      ];
      csv += row.join(',') + '\n';
    }

    return csv;
  }

  private async generateZip(data: any, jobId: string): Promise<Buffer> {
    // In a real implementation, this would create a ZIP file with json data and audio files
    // For this implementation, we'll return a placeholder
    throw ErrorFactory.notImplemented('ZIP export is not implemented yet');
  }
}

// Extend IStorageService interface to include uploadExport method
declare module '@/core/ports/services/storage/IStorageService' {
  interface IStorageService {
    uploadExport(fileName: string, data: Buffer, contentType: string): Promise<string>;
  }
}