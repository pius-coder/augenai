// src/core/domain/use-cases/job/CreateJobFromCSVUseCase.ts
// Use case: Create a new job from CSV data

import { z } from 'zod';
import { Job } from '../../entities/Job';
import { VoiceSettings } from '../../value-objects/VoiceSettings';
import { PromptTemplate } from '../../value-objects/PromptTemplate';
import { CSVRow } from '../../value-objects/CSVRow';
import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { JobCreatedEvent } from '../../events/job/JobCreatedEvent';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const CreateJobFromCSVSchema = z.object({
  name: z.string().min(1, 'Job name is required').max(255, 'Job name too long'),
  csvData: z.string().min(1, 'CSV data is required'),
  voiceId: z.string().optional(),
  stability: z.number().min(0).max(1).optional(),
  similarityBoost: z.number().min(0).max(1).optional(),
  style: z.number().min(0).max(1).optional(),
  useSpeakerBoost: z.boolean().optional(),
  systemPrompt: z.string().optional(),
  userPromptTemplate: z.string().optional(),
  maxChunkSize: z.number().int().min(100).max(5000).optional(),
  silenceBetweenChunks: z.number().int().min(0).max(5000).optional(),
});

export type CreateJobFromCSVInput = z.infer<typeof CreateJobFromCSVSchema>;

export interface CreateJobFromCSVOutput {
  job: Job;
  rows: CSVRow[];
}

export class CreateJobFromCSVUseCase {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: CreateJobFromCSVInput): Promise<CreateJobFromCSVOutput> {
    // Validate input
    const validatedInput = CreateJobFromCSVSchema.parse(input);

    // Parse CSV data and create rows (simplified for this implementation)
    const rows: CSVRow[] = this.parseCSVRows(validatedInput.csvData);

    // Create voice settings if provided
    let voiceSettings: VoiceSettings | undefined;
    if (validatedInput.voiceId) {
      voiceSettings = VoiceSettings.create({
        voiceId: validatedInput.voiceId,
        stability: validatedInput.stability,
        similarityBoost: validatedInput.similarityBoost,
        style: validatedInput.style,
        useSpeakerBoost: validatedInput.useSpeakerBoost,
      });
    }

    // Create prompt template if provided
    let userPromptTemplate: PromptTemplate | undefined;
    if (validatedInput.userPromptTemplate) {
      userPromptTemplate = PromptTemplate.create(validatedInput.userPromptTemplate);
    }

    // Create job entity
    const job = Job.create({
      name: validatedInput.name,
      voiceSettings,
      systemPrompt: validatedInput.systemPrompt,
      userPromptTemplate,
      maxChunkSize: validatedInput.maxChunkSize,
      silenceBetweenChunks: validatedInput.silenceBetweenChunks,
    });

    job.setTotalItems(rows.length);

    // Persist job
    await this.jobRepository.save(job);

    // Emit domain event
    await this.eventBus.publish(
      new JobCreatedEvent({
        jobId: job.id,
        jobName: job.name,
        timestamp: new Date(),
      })
    );

    return { job, rows };
  }

  private parseCSVRows(csvData: string): CSVRow[] {
    // Simplified CSV parsing - in real implementation would use a proper CSV parser
    const rows = csvData.split('\n').filter(row => row.trim().length > 0);
    const headers = rows[0].split(',').map(h => h.trim());
    
    return rows.slice(1).map((row, index) => {
      const values = row.split(',').map(v => v.trim());
      const data: Record<string, string> = {};
      
      headers.forEach((header, i) => {
        data[header] = values[i] || '';
      });

      return CSVRow.create({
        id: `row_${Date.now()}_${index}`,
        data,
        status: 'pending',
      });
    });
  }
}