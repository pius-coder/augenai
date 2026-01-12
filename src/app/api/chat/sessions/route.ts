// src/app/api/chat/sessions/route.ts
// Chat sessions: POST /api/chat/sessions

import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/Container';
import { CreateChatSessionUseCase } from '@/core/domain/use-cases/chat/CreateChatSessionUseCase';
import { Logger } from '@/shared/lib/logger';

const logger = Logger.getInstance();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    const createChatSessionUseCase = container.get<CreateChatSessionUseCase>('CreateChatSessionUseCase');
    const result = await createChatSessionUseCase.execute(body);

    logger.info('Chat session created', { sessionId: result.session.id });

    return NextResponse.json({
      success: true,
      data: result.session.toJSON(),
    }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create chat session', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 400 });
  }
}
