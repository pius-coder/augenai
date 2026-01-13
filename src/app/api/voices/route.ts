// src/app/api/voices/route.ts
// Voices endpoints: GET /api/voices

import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/Container';
import { ITTSService } from '@/core/ports/services/tts/ITTSService';
import { Logger } from '@/shared/lib/logger';

const logger = Logger.getInstance();

export async function GET(request: NextRequest) {
  try {
    const ttsService = container.get<ITTSService>('ITTSService');

    // Get available voices from the TTS service
    const voices = await ttsService.listVoices();

    return NextResponse.json({
      success: true,
      voices,
    });

  } catch (error) {
    logger.error('Failed to list voices', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}