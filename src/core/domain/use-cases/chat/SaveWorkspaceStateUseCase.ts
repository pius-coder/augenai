// src/core/domain/use-cases/chat/SaveWorkspaceStateUseCase.ts
// Use case: Save workspace state for a chat session

import { IChatSessionRepository } from '@/core/ports/repositories/IChatSessionRepository';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { z } from 'zod';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const SaveWorkspaceStateSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  workspaceState: z.record(z.any()),
  commitMessage: z.string().optional(),
  branchName: z.string().optional(),
});

export type SaveWorkspaceStateInput = z.infer<typeof SaveWorkspaceStateSchema>;

export interface SaveWorkspaceStateOutput {
  success: boolean;
  sessionId: string;
  version: number;
  timestamp: Date;
}

export class SaveWorkspaceStateUseCase {
  constructor(
    private readonly chatSessionRepository: IChatSessionRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: SaveWorkspaceStateInput): Promise<SaveWorkspaceStateOutput> {
    // Validate input
    const validatedInput = SaveWorkspaceStateSchema.parse(input);
    const { sessionId, workspaceState, commitMessage, branchName } = validatedInput;

    // Find the session
    const session = await this.chatSessionRepository.findById(sessionId);
    if (!session) {
      throw ErrorFactory.notFound(`Chat session with id ${sessionId} not found`);
    }

    // Save workspace state
    const version = (session.workspaceVersions || 0) + 1;
    const timestamp = new Date();

    // Update session with new workspace state
    session.workspaceState = workspaceState;
    session.workspaceVersions = version;
    session.lastWorkspaceUpdate = timestamp;
    
    await this.chatSessionRepository.save(session);

    // Emit workspace state saved event
    await this.eventBus.publish({
      type: 'workspace.state.saved',
      data: {
        sessionId,
        version,
        commitMessage,
        branchName,
        timestamp,
      },
    });

    return {
      success: true,
      sessionId,
      version,
      timestamp,
    };
  }
}

// Extend ChatSession interface
declare module '../../entities/ChatSession' {
  interface ChatSession {
    workspaceState?: Record<string, any>;
    workspaceVersions?: number;
    lastWorkspaceUpdate?: Date;
  }
}