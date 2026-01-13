// src/app/api/audio/merge/route.ts
// Audio merge endpoint: POST /api/audio/merge

import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/Container';
import { MergeAudioChunksUseCase } from '@/core/domain/use-cases/content/MergeAudioChunksUseCase';
import { Logger } from '@/shared/lib/logger';

const logger = Logger.getInstance();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json({
        success: false,
        error: 'itemId is required',
      }, { status: 400 });
    }

    const mergeAudioChunksUseCase = container.get<MergeAudioChunksUseCase>('MergeAudioChunksUseCase');
    const result = await mergeAudioChunksUseCase.execute({ itemId });

    logger.info('Audio chunks merged', { itemId, mergedAudioPath: result.mergedAudioPath });

    return NextResponse.json({
      success: true,
      mergedAudioPath: result.mergedAudioPath,
      item: result.item,
    });

  } catch (error) {
    logger.error('Failed to merge audio chunks', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}