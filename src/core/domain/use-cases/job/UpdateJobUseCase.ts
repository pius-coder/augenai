// src/core/domain/use-cases/job/UpdateJobUseCase.ts
// Use case: Update job properties (name, voice settings, prompts)

import { z } from 'zod';
import { Job } from '../../entities/Job';
import { VoiceSettings } from '../../value-objects/VoiceSettings';
import { PromptTemplate } from '../../value-objects/PromptTemplate';
import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const UpdateJobSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  name: z.string().min(1).max(255).optional(),
  voiceId: z.string().optional(),
  stability: z.number().min(0).max(1).optional(),
  similarityBoost: z.number().min(0).max(1).optional(),
  style: z.number().min(0).max(1).optional(),
  useSpeakerBoost: z.boolean().optional(),
  systemPrompt: z.string().optional(),
  userPromptTemplate: z.string().optional(),
});

export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;

export interface UpdateJobOutput {
  job: Job;
}

export class UpdateJobUseCase {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: UpdateJobInput): Promise<UpdateJobOutput> {
    // Validate input
    const validatedInput = UpdateJobSchema.parse(input);

    // Retrieve job
    const job = await this.jobRepository.findById(validatedInput.jobId);
    if (!job) {
      throw ErrorFactory.notFound('Job', validatedInput.jobId);
    }

    // Check if job can be modified
    if (!job.canModify()) {
      throw ErrorFactory.invalidConfig(
        'job.status',
        'Cannot modify completed or cancelled job'
      );
    }

    // Update name if provided
    if (validatedInput.name !== undefined) {
      job.name = validatedInput.name;
    }

    // Update voice settings if provided
    if (validatedInput.voiceId !== undefined) {
      const voiceSettings = VoiceSettings.create({
        voiceId: validatedInput.voiceId,
        stability: validatedInput.stability,
        similarityBoost: validatedInput.similarityBoost,
        style: validatedInput.style,
        useSpeakerBoost: validatedInput.useSpeakerBoost,
      });
      job.updateVoiceSettings(voiceSettings);
    }

    // Update prompts if provided
    if (
      validatedInput.systemPrompt !== undefined ||
      validatedInput.userPromptTemplate !== undefined
    ) {
      const systemPrompt = validatedInput.systemPrompt ?? job.systemPrompt;
      const userPromptTemplate = validatedInput.userPromptTemplate
        ? PromptTemplate.create(validatedInput.userPromptTemplate)
        : job.userPromptTemplate!;

      job.updatePrompts(systemPrompt, userPromptTemplate);
    }

    // Persist changes
    await this.jobRepository.save(job);

    return { job };
  }
}
