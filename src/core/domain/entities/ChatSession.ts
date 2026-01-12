// src/core/domain/entities/ChatSession.ts
// Chat session entity - represents a conversation session with AI
// Contains chat messages and context

import { ValidationError } from '@/shared/utils/errors/AppError';

export interface ChatSessionData {
  id: string;
  name?: string;
  activeJobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatSession {
  private constructor(
    public readonly id: string,
    private _name: string | undefined,
    private _activeJobId: string | undefined,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  static create(name?: string, activeJobId?: string): ChatSession {
    const now = new Date();
    const id = `chat_session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return new ChatSession(
      id,
      name?.trim(),
      activeJobId,
      now,
      now
    );
  }

  static fromPersistence(data: ChatSessionData): ChatSession {
    return new ChatSession(
      data.id,
      data.name,
      data.activeJobId,
      data.createdAt,
      data.updatedAt
    );
  }

  get name(): string | undefined {
    return this._name;
  }

  get activeJobId(): string | undefined {
    return this._activeJobId;
  }

  public setName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Chat session name cannot be empty');
    }

    if (name.length > 100) {
      throw new ValidationError('Chat session name cannot exceed 100 characters');
    }

    this._name = name.trim();
    this.updatedAt = new Date();
  }

  public setActiveJob(jobId: string): void {
    if (!jobId || jobId.trim().length === 0) {
      throw new ValidationError('Job ID cannot be empty');
    }

    this._activeJobId = jobId;
    this.updatedAt = new Date();
  }

  public clearActiveJob(): void {
    this._activeJobId = undefined;
    this.updatedAt = new Date();
  }

  public hasActiveJob(): boolean {
    return this._activeJobId !== undefined && this._activeJobId.length > 0;
  }

  public toPersistence(): ChatSessionData {
    return {
      id: this.id,
      name: this._name,
      activeJobId: this._activeJobId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public toJSON() {
    return {
      ...this.toPersistence(),
      hasActiveJob: this.hasActiveJob(),
    };
  }
}
