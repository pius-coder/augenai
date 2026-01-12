// src/app/api/items/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ProcessItemUseCase } from '@/core/domain/use-cases/content/ProcessItemUseCase';
import { serviceProvider } from '@/infrastructure/di/ServiceProvider';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const processItemUseCase = serviceProvider.getService<ProcessItemUseCase>('ProcessItemUseCase');
    const result = await processItemUseCase.execute({
      itemId: id,
      jobId: body.jobId,
      forceRegenerate: body.forceRegenerate || false,
    });
    
    return NextResponse.json({
      success: true,
      item: result.item,
      chunks: result.chunks,
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const getItemUseCase = serviceProvider.getService('GetItemUseCase');
    const item = await getItemUseCase.execute({ itemId: id });
    
    return NextResponse.json({
      success: true,
      item,
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 });
  }
}