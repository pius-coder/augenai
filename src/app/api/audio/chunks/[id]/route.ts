// src/app/api/audio/chunks/[id]/route.ts
// Audio chunk endpoint: GET /api/audio/chunks/:id

import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/Container';
import { IAudioChunkRepository } from '@/core/ports/repositories/IAudioChunkRepository';
import { Logger } from '@/shared/lib/logger';

const logger = Logger.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const audioChunkRepository = container.get<IAudioChunkRepository>('IAudioChunkRepository');

    // Get audio chunk details
    const audioChunk = await audioChunkRepository.findById(params.id);

    if (!audioChunk) {
      return NextResponse.json({
        success: false,
        error: 'Audio chunk not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      chunk: audioChunk,
    });

  } catch (error) {
    logger.error('Failed to get audio chunk', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}