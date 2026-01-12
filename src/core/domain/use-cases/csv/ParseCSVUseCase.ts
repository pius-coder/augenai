// src/core/domain/use-cases/csv/ParseCSVUseCase.ts
// Use case: Parse CSV into ContentItems

import { z } from 'zod';
import { CSVRow } from '../../value-objects/CSVRow';
import { ContentItem } from '../../entities/ContentItem';
import { ICSVParsingService } from '@/core/ports/services/parsing/ICSVParsingService';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const ParseCSVSchema = z.object({
  filePath: z.string().min(1, 'File path is required'),
  jobId: z.string().min(1, 'Job ID is required'),
});

export type ParseCSVInput = z.infer<typeof ParseCSVSchema>;

export interface ParseCSVOutput {
  items: ContentItem[];
  totalRows: number;
}

export class ParseCSVUseCase {
  constructor(
    private readonly csvParsingService: ICSVParsingService,
    private readonly contentItemRepository: IContentItemRepository,
    private readonly jobRepository: IJobRepository
  ) {}

  async execute(input: ParseCSVInput): Promise<ParseCSVOutput> {
    const { filePath, jobId } = ParseCSVSchema.parse(input);

    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw ErrorFactory.notFound('Job', jobId);
    }

    const csvRows = await this.csvParsingService.parseFile(filePath);
    const items: ContentItem[] = [];

    for (let i = 0; i < csvRows.length; i++) {
      const csvRow = CSVRow.create(csvRows[i]);
      const item = ContentItem.create(csvRow, jobId, i);
      items.push(item);
      await this.contentItemRepository.save(item);
    }

    job.setTotalItems(items.length);
    await this.jobRepository.save(job);

    return {
      items,
      totalRows: csvRows.length,
    };
  }
}
