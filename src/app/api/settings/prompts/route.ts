// src/app/api/settings/prompts/route.ts
// Prompts endpoints: GET, POST /api/settings/prompts

import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/Container';
import { CreateCustomPromptUseCase } from '@/core/domain/use-cases/settings/CreateCustomPromptUseCase';
import { Logger } from '@/shared/lib/logger';

const logger = Logger.getInstance();

export async function GET(request: NextRequest) {
  try {
    // In a real app, you would get the user ID from auth context
    const userId = 'current-user'; // Placeholder

    const getUserSettingsUseCase = container.get('GetUserSettingsUseCase');
    const result = await getUserSettingsUseCase.execute({ userId });

    return NextResponse.json({
      success: true,
      prompts: result.settings.customPrompts || [],
    });

  } catch (error) {
    logger.error('Failed to get custom prompts', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // In a real app, you would get the user ID from auth context
    const userId = 'current-user'; // Placeholder

    const createCustomPromptUseCase = container.get<CreateCustomPromptUseCase>('CreateCustomPromptUseCase');
    const result = await createCustomPromptUseCase.execute({
      userId,
      name: body.name,
      content: body.content,
    });

    logger.info('Custom prompt created', { userId, promptId: result.prompt.id });

    return NextResponse.json({
      success: true,
      prompt: result.prompt,
    }, { status: 201 });

  } catch (error) {
    logger.error('Failed to create custom prompt', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 400 });
  }
}