// src/app/api/voices/preview/route.ts
// Voice preview endpoint: POST /api/voices/preview

import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/Container';
import { ITTSService } from '@/core/ports/services/tts/ITTSService';
import { Logger } from '@/shared/lib/logger';

const logger = Logger.getInstance();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voiceId, text } = body;

    if (!voiceId || !text) {
      return NextResponse.json({
        success: false,
        error: 'voiceId and text are required',
      }, { status: 400 });
    }

    const ttsService = container.get<ITTSService>('ITTSService');

    // Generate audio preview
    const audioBuffer = await ttsService.generateAudio(text, voiceId);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="preview.mp3"',
      },
    });

  } catch (error) {
    logger.error('Failed to generate voice preview', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}