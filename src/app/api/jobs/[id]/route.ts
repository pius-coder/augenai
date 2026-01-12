// src/app/api/jobs/[id]/route.ts
// Job detail routes: GET, PUT, DELETE /api/jobs/:id

import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/Container';
import { GetJobUseCase } from '@/core/domain/use-cases/job/GetJobUseCase';
import { UpdateJobUseCase } from '@/core/domain/use-cases/job/UpdateJobUseCase';
import { CancelJobUseCase } from '@/core/domain/use-cases/job/CancelJobUseCase';
import { Logger } from '@/shared/lib/logger';

const logger = Logger.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const getJobUseCase = container.get<GetJobUseCase>('GetJobUseCase');
    const result = await getJobUseCase.execute({ jobId: params.id });

    return NextResponse.json({
      success: true,
      data: result.job.toJSON(),
    });
  } catch (error) {
    logger.error('Failed to get job', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const updateJobUseCase = container.get<UpdateJobUseCase>('UpdateJobUseCase');
    const result = await updateJobUseCase.execute({
      jobId: params.id,
      ...body,
    });

    logger.info('Job updated', { jobId: params.id });

    return NextResponse.json({
      success: true,
      data: result.job.toJSON(),
    });
  } catch (error) {
    logger.error('Failed to update job', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cancelJobUseCase = container.get<CancelJobUseCase>('CancelJobUseCase');
    const result = await cancelJobUseCase.execute({
      jobId: params.id,
      reason: 'User deleted job',
    });

    logger.info('Job cancelled', { jobId: params.id });

    return NextResponse.json({
      success: true,
      data: {
        job: result.job.toJSON(),
        cancelledItemsCount: result.cancelledItemsCount,
      },
    });
  } catch (error) {
    logger.error('Failed to delete job', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 400 });
  }
}
