// src/app/api/audio/download/[id]/route.ts
// Audio download endpoint: GET /api/audio/download/:id

import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/Container';
import { IStorageService } from '@/core/ports/services/storage/IStorageService';
import { IAudioChunkRepository } from '@/core/ports/repositories/IAudioChunkRepository';
import { Logger } from '@/shared/lib/logger';

const logger = Logger.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const audioChunkRepository = container.get<IAudioChunkRepository>('IAudioChunkRepository');
    const storageService = container.get<IStorageService>('IStorageService');

    // Get audio chunk details
    const audioChunk = await audioChunkRepository.findById(params.id);

    if (!audioChunk || !audioChunk.audioPath) {
      return NextResponse.json({
        success: false,
        error: 'Audio file not found',
      }, { status: 404 });
    }

    // Read audio file from storage
    const audioBuffer = await storageService.readFile(audioChunk.audioPath);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="audio_${params.id}.mp3"`,
      },
    });

  } catch (error) {
    logger.error('Failed to download audio', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}