// src/app/api/settings/route.ts
// Settings endpoints: GET, PATCH /api/settings

import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/Container';
import { GetUserSettingsUseCase } from '@/core/domain/use-cases/settings/GetUserSettingsUseCase';
import { UpdateUserSettingsUseCase } from '@/core/domain/use-cases/settings/UpdateUserSettingsUseCase';
import { Logger } from '@/shared/lib/logger';

const logger = Logger.getInstance();

export async function GET(request: NextRequest) {
  try {
    // In a real app, you would get the user ID from auth context
    const userId = 'current-user'; // Placeholder

    const getUserSettingsUseCase = container.get<GetUserSettingsUseCase>('GetUserSettingsUseCase');
    const result = await getUserSettingsUseCase.execute({ userId });

    return NextResponse.json({
      success: true,
      settings: result.settings,
    });

  } catch (error) {
    logger.error('Failed to get user settings', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    // In a real app, you would get the user ID from auth context
    const userId = 'current-user'; // Placeholder

    const updateUserSettingsUseCase = container.get<UpdateUserSettingsUseCase>('UpdateUserSettingsUseCase');
    const result = await updateUserSettingsUseCase.execute({
      userId,
      ...body,
    });

    logger.info('User settings updated', { userId });

    return NextResponse.json({
      success: true,
      settings: result.settings,
    });

  } catch (error) {
    logger.error('Failed to update user settings', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 400 });
  }
}