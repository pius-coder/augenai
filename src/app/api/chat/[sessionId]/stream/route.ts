// src/app/api/chat/[sessionId]/stream/route.ts
// SSE endpoint for chat streaming

import { NextRequest } from 'next/server';
import { container } from '@/infrastructure/di/Container';
import { StreamChatResponseUseCase } from '@/core/domain/use-cases/chat/StreamChatResponseUseCase';
import { Logger } from '@/shared/lib/logger';

const logger = Logger.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const messageId = request.nextUrl.searchParams.get('messageId');

    if (!messageId) {
      return new Response('messageId parameter is required', { status: 400 });
    }

    // Set headers for SSE
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();

    const encoder = new TextEncoder();

    // Send initial SSE connection message
    writer.write(encoder.encode('data: {"type": "connection", "message": "Connected to chat stream"}\n\n'));

    // Get the use case
    const streamChatResponseUseCase = container.get<StreamChatResponseUseCase>('StreamChatResponseUseCase');

    // Execute the streaming use case
    await streamChatResponseUseCase.execute(
      {
        sessionId,
        messageId,
        systemPrompt: 'You are a helpful AI assistant for audio generation tasks.',
        maxTokens: 2048,
        temperature: 0.7,
      },
      (chunk) => {
        // Write each chunk to the stream
        const chunkData = JSON.stringify({
          type: 'chunk',
          content: chunk,
          timestamp: new Date().toISOString(),
        });
        writer.write(encoder.encode(`data: ${chunkData}\n\n`));
      }
    );

    // Send completion message
    writer.write(encoder.encode('data: {"type": "complete", "message": "Stream completed"}\n\n'));
    writer.close();

    return new Response(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    logger.error(`Failed to stream chat response for session ${params.sessionId}`, error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}