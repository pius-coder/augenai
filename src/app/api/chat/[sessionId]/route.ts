// src/app/api/chat/[sessionId]/route.ts
// Chat session operations: GET /api/chat/[sessionId]

import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/Container';
import { GetChatHistoryUseCase } from '@/core/domain/use-cases/chat/GetChatHistoryUseCase';
import { Logger } from '@/shared/lib/logger';

const logger = Logger.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    const getChatHistoryUseCase = container.get<GetChatHistoryUseCase>('GetChatHistoryUseCase');
    const result = await getChatHistoryUseCase.execute({ sessionId });

    return NextResponse.json({
      success: true,
      data: {
        session: result.session.toJSON(),
        messages: result.messages.map(m => m.toJSON()),
      },
    });
  } catch (error) {
    logger.error(`Failed to get chat history for session ${params.sessionId}`, error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 400 });
  }
}