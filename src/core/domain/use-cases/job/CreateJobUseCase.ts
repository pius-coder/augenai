// src/core/domain/use-cases/job/CreateJobUseCase.ts
// Use case: Create a new job with validation

import { z } from 'zod';
import { Job } from '../../entities/Job';
import { VoiceSettings } from '../../value-objects/VoiceSettings';
import { PromptTemplate } from '../../value-objects/PromptTemplate';
import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { JobCreatedEvent } from '../../events/job/JobCreatedEvent';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const CreateJobSchema = z.object({
  name: z.string().min(1, 'Job name is required').max(255, 'Job name too long'),
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

export type CreateJobInput = z.infer<typeof CreateJobSchema>;

export interface CreateJobOutput {
  job: Job;
}

export class CreateJobUseCase {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: CreateJobInput): Promise<CreateJobOutput> {
    // Validate input
    const validatedInput = CreateJobSchema.parse(input);

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

    return { job };
  }
}
