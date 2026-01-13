// src/app/api/settings/prompts/[id]/route.ts
// Prompt deletion endpoint: DELETE /api/settings/prompts/:id

import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/Container';
import { DeleteCustomPromptUseCase } from '@/core/domain/use-cases/settings/DeleteCustomPromptUseCase';
import { Logger } from '@/shared/lib/logger';

const logger = Logger.getInstance();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In a real app, you would get the user ID from auth context
    const userId = 'current-user'; // Placeholder

    const deleteCustomPromptUseCase = container.get<DeleteCustomPromptUseCase>('DeleteCustomPromptUseCase');
    const result = await deleteCustomPromptUseCase.execute({
      userId,
      promptId: params.id,
    });

    logger.info('Custom prompt deleted', { userId, promptId: params.id });

    return NextResponse.json({
      success: true,
      deletedPromptId: result.deletedPromptId,
    });

  } catch (error) {
    logger.error('Failed to delete custom prompt', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 400 });
  }
}