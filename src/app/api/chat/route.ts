// src/app/api/chat/route.ts
// Send chat message: POST /api/chat

import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/Container';
import { SendChatMessageUseCase } from '@/core/domain/use-cases/chat/SendChatMessageUseCase';
import { Logger } from '@/shared/lib/logger';

const logger = Logger.getInstance();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const sendChatMessageUseCase = container.get<SendChatMessageUseCase>('SendChatMessageUseCase');
    const result = await sendChatMessageUseCase.execute(body);

    return NextResponse.json({
      success: true,
      data: {
        userMessage: result.userMessage.toJSON(),
        assistantMessage: result.assistantMessage.toJSON(),
      },
    });
  } catch (error) {
    logger.error('Failed to send chat message', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 400 });
  }
}
