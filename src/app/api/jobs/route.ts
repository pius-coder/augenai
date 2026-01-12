// src/app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CreateJobUseCase } from '@/core/domain/use-cases/job/CreateJobUseCase';
import { serviceProvider } from '@/infrastructure/di/ServiceProvider';
import { z } from 'zod';

const CreateJobSchema = z.object({
  name: z.string().min(1),
  voiceId: z.string().optional(),
  stability: z.number().min(0).max(1).optional(),
  similarityBoost: z.number().min(0).max(1).optional(),
  systemPrompt: z.string().optional(),
  userPromptTemplate: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateJobSchema.parse(body);
    
    const createJobUseCase = serviceProvider.getService<CreateJobUseCase>('CreateJobUseCase');
    const result = await createJobUseCase.execute(validatedData);
    
    return NextResponse.json({
      success: true,
      job: result.job,
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        errors: error.errors.map(e => e.message),
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    
    const listJobsUseCase = serviceProvider.getService('ListJobsUseCase');
    const jobs = await listJobsUseCase.execute({
      status: status || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
    
    return NextResponse.json({
      success: true,
      jobs,
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}