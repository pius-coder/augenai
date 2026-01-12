// src/app/api/jobs/[id]/retry/route.ts
// Retry job route: POST /api/jobs/:id/retry

import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/Container';
import { RetryJobUseCase } from '@/core/domain/use-cases/job/RetryJobUseCase';
import { Logger } from '@/shared/lib/logger';

const logger = Logger.getInstance();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    
    const retryJobUseCase = container.get<RetryJobUseCase>('RetryJobUseCase');
    const result = await retryJobUseCase.execute({
      jobId: params.id,
      retryFailedOnly: body.retryFailedOnly ?? true,
    });

    logger.info('Job retried', { jobId: params.id, retriedItemsCount: result.retriedItemsCount });

    return NextResponse.json({
      success: true,
      data: {
        job: result.job.toJSON(),
        retriedItemsCount: result.retriedItemsCount,
      },
    });
  } catch (error) {
    logger.error('Failed to retry job', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 400 });
  }
}
