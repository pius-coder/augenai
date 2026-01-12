// src/app/api/jobs/route.ts
// Job API routes: POST /api/jobs, GET /api/jobs

import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/Container';
import { CreateJobUseCase } from '@/core/domain/use-cases/job/CreateJobUseCase';
import { ListJobsUseCase } from '@/core/domain/use-cases/job/ListJobsUseCase';
import { JobStatus } from '@/core/domain/value-objects/JobStatus';
import { Logger } from '@/shared/lib/logger';

const logger = Logger.getInstance();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const createJobUseCase = container.get<CreateJobUseCase>('CreateJobUseCase');
    const result = await createJobUseCase.execute(body);

    logger.info('Job created', { jobId: result.job.id });

    return NextResponse.json({
      success: true,
      data: result.job.toJSON(),
    }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create job', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as JobStatus | null;
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const orderByCreatedAt = searchParams.get('order') as 'asc' | 'desc' | null;

    const listJobsUseCase = container.get<ListJobsUseCase>('ListJobsUseCase');
    const result = await listJobsUseCase.execute({
      status: status || undefined,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
      orderByCreatedAt: orderByCreatedAt || 'desc',
    });

    return NextResponse.json({
      success: true,
      data: {
        jobs: result.jobs.map(j => j.toJSON()),
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error) {
    logger.error('Failed to list jobs', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
